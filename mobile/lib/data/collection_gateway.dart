import '../core/api_client.dart';
import 'payment_models.dart';
import 'payment_repository.dart';

// One collection screen serves two callers who share nothing about how they are authorised: a
// signed-in merchant or employee, and an order platform's courier who has no account and holds
// only a hand-off token (ADR-015). What they do with the money is identical, so the screen
// talks to this instead of to either transport.
abstract class CollectionGateway {
  Future<PaymentRequest> load();
  Future<PaymentRequest> generateQr();
  Future<PaymentRequest> recordCash(double amount);
}

class SessionCollectionGateway implements CollectionGateway {
  SessionCollectionGateway(this._payments, this._paymentRequestId);

  final PaymentRepository _payments;
  final String _paymentRequestId;

  @override
  Future<PaymentRequest> load() => _payments.getById(_paymentRequestId);

  @override
  Future<PaymentRequest> generateQr() => _payments.generateQr(_paymentRequestId);

  @override
  Future<PaymentRequest> recordCash(double amount) => _payments.recordTransaction(
        paymentRequestId: _paymentRequestId,
        amount: amount,
        paymentMethod: 'CASH',
      );
}

// No payment id is sent anywhere: the token names the one payment request it may act on, so
// there is nothing for a tampered request to point at.
class HandoffCollectionGateway implements CollectionGateway {
  HandoffCollectionGateway(String handoffToken) : _api = ApiClient.handoff(handoffToken);

  final ApiClient _api;

  @override
  Future<PaymentRequest> load() async => PaymentRequest.fromJson(await _api.get('/handoff/payment'));

  @override
  Future<PaymentRequest> generateQr() async => PaymentRequest.fromJson(await _api.post('/handoff/payment/qr'));

  @override
  Future<PaymentRequest> recordCash(double amount) async => PaymentRequest.fromJson(
        await _api.post('/handoff/payment/transactions', body: {'amount': amount, 'paymentMethod': 'CASH'}),
      );
}
