// Mirrors the backend's PaymentRequestResponseDto. remainingAmount is derived server side and
// never stored (ADR-002), so the app always reads it rather than subtracting locally.
class PaymentRequest {
  const PaymentRequest({
    required this.id,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.currency,
    required this.status,
    required this.transactions,
    this.externalOrderId,
    this.qrData,
    this.qrExpiresAt,
  });

  final String id;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final String currency;
  final String status;
  final List<PaymentTransaction> transactions;
  final String? externalOrderId;

  // Present only on the response that issued it: a bank QR is a time-limited provider payload,
  // never persisted (ADR-003), so it is gone from any later read of the same request.
  final String? qrData;
  final DateTime? qrExpiresAt;

  bool get isPaid => status == 'PAID';
  bool get isCollectable => status == 'PENDING' || status == 'PARTIALLY_PAID';

  factory PaymentRequest.fromJson(Map<String, dynamic> json) {
    final rawTransactions = (json['transactions'] as List<dynamic>?) ?? const [];

    return PaymentRequest(
      id: json['id'] as String,
      totalAmount: _toDouble(json['totalAmount']),
      paidAmount: _toDouble(json['paidAmount']),
      remainingAmount: _toDouble(json['remainingAmount']),
      currency: json['currency'] as String? ?? 'TRY',
      status: json['status'] as String? ?? 'PENDING',
      externalOrderId: json['externalOrderId'] as String?,
      qrData: json['qrData'] as String?,
      qrExpiresAt: json['qrExpiresAt'] == null ? null : DateTime.tryParse(json['qrExpiresAt'] as String),
      transactions: rawTransactions
          .map((item) => PaymentTransaction.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class PaymentTransaction {
  const PaymentTransaction({
    required this.id,
    required this.amount,
    required this.paymentMethod,
    required this.status,
  });

  final String id;
  final double amount;
  final String paymentMethod;
  final String status;

  factory PaymentTransaction.fromJson(Map<String, dynamic> json) {
    return PaymentTransaction(
      id: json['id'] as String,
      amount: _toDouble(json['amount']),
      paymentMethod: json['paymentMethod'] as String? ?? '',
      status: json['status'] as String? ?? '',
    );
  }
}

// Postgres numeric columns can arrive as either a JSON number or a string depending on how the
// value round-tripped, so both are accepted rather than assuming one.
double _toDouble(Object? value) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? 0;
  return 0;
}
