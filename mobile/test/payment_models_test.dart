import 'package:flutter_test/flutter_test.dart';
import 'package:payals_pos/data/payment_models.dart';

// What the app believes about a collection comes entirely from this parse. Everything the
// courier sees on the screen — the amount still owed, whether to keep the QR up, whether the
// door can be closed — is decided by these fields.
void main() {
  Map<String, dynamic> response({
    Object total = 250,
    Object paid = 100,
    Object remaining = 150,
    String status = 'PARTIALLY_PAID',
    List<Map<String, dynamic>> transactions = const [],
    Map<String, dynamic> extra = const {},
  }) {
    return {
      'id': 'e4d9a0f0-0000-4000-8000-000000000001',
      'totalAmount': total,
      'paidAmount': paid,
      'remainingAmount': remaining,
      'currency': 'TRY',
      'status': status,
      'transactions': transactions,
      ...extra,
    };
  }

  group('PaymentRequest.fromJson', () {
    test('reads decimal amounts whether they arrive as numbers or as strings', () {
      // Postgres numeric columns round-trip as either, depending on the path the value took.
      final asNumbers = PaymentRequest.fromJson(response(total: 250.5, paid: 100.25, remaining: 150.25));
      final asStrings = PaymentRequest.fromJson(response(total: '250.50', paid: '100.25', remaining: '150.25'));

      expect(asNumbers.totalAmount, 250.5);
      expect(asStrings.totalAmount, 250.5);
      expect(asStrings.paidAmount, 100.25);
      expect(asStrings.remainingAmount, 150.25);
    });

    test('takes remainingAmount from the server instead of subtracting locally', () {
      // ADR-002: the remainder is derived server side and never stored. If the app ever
      // recomputed it, a rounding rule that differed by a cent would show the courier a
      // different number from the one the backend will accept.
      final parsed = PaymentRequest.fromJson(response(total: 19.9, paid: 19.1, remaining: 0.8));

      expect(parsed.remainingAmount, 0.8);
      expect(parsed.remainingAmount, isNot(parsed.totalAmount - parsed.paidAmount));
    });

    test('reads the bank QR payload when the response carries one', () {
      final parsed = PaymentRequest.fromJson(
        response(extra: {
          'qrData': '0002010102122654...TR',
          'qrExpiresAt': '2026-08-03T12:30:00.000Z',
        }),
      );

      expect(parsed.qrData, '0002010102122654...TR');
      expect(parsed.qrExpiresAt, DateTime.parse('2026-08-03T12:30:00.000Z'));
    });

    test('accepts a response with no QR, because a later read never repeats it', () {
      // ADR-003: a bank QR is time-limited provider output returned once and never persisted,
      // so every poll after the one that issued it comes back without these fields.
      final parsed = PaymentRequest.fromJson(response());

      expect(parsed.qrData, isNull);
      expect(parsed.qrExpiresAt, isNull);
    });

    test('survives an unparseable QR expiry rather than failing the whole collection', () {
      final parsed = PaymentRequest.fromJson(response(extra: {'qrData': 'x', 'qrExpiresAt': 'not-a-date'}));

      expect(parsed.qrData, 'x');
      expect(parsed.qrExpiresAt, isNull);
    });

    test('reads each transaction of a hybrid collection separately', () {
      final parsed = PaymentRequest.fromJson(
        response(status: 'PAID', paid: 250, remaining: 0, transactions: [
          {'id': 't1', 'amount': '150.00', 'paymentMethod': 'QR', 'status': 'SUCCESS'},
          {'id': 't2', 'amount': 100, 'paymentMethod': 'CASH', 'status': 'SUCCESS'},
        ]),
      );

      expect(parsed.transactions, hasLength(2));
      expect(parsed.transactions.first.amount, 150);
      expect(parsed.transactions.first.paymentMethod, 'QR');
      expect(parsed.transactions.last.paymentMethod, 'CASH');
    });

    test('treats a missing transactions array as none, not as a failure', () {
      final json = response()..remove('transactions');

      expect(PaymentRequest.fromJson(json).transactions, isEmpty);
    });

    test('carries the platform\'s own order id through a hand-off', () {
      final parsed = PaymentRequest.fromJson(response(extra: {'externalOrderId': 'UBER-4471'}));

      expect(parsed.externalOrderId, 'UBER-4471');
    });
  });

  group('collection state', () {
    test('is collectable while anything is still owed', () {
      expect(PaymentRequest.fromJson(response(status: 'PENDING')).isCollectable, isTrue);
      expect(PaymentRequest.fromJson(response(status: 'PARTIALLY_PAID')).isCollectable, isTrue);
    });

    test('is not collectable once the payment has left the door', () {
      // Every one of these is terminal server side. Offering a cash button against any of them
      // would produce a rejection the courier cannot act on while a customer waits.
      for (final status in ['PAID', 'CANCELLED', 'FAILED', 'EXPIRED', 'REFUNDED']) {
        expect(PaymentRequest.fromJson(response(status: status)).isCollectable, isFalse, reason: status);
      }
    });

    test('reports paid only for PAID', () {
      expect(PaymentRequest.fromJson(response(status: 'PAID')).isPaid, isTrue);
      expect(PaymentRequest.fromJson(response(status: 'PARTIALLY_PAID')).isPaid, isFalse);
    });
  });
}
