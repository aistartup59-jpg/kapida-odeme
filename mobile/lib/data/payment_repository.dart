import '../core/api_client.dart';
import 'payment_models.dart';

class PaymentRepository {
  PaymentRepository(this._api);

  final ApiClient _api;

  // ADR-005: a single creation endpoint, and merchantId/employeeId are never sent — the
  // backend takes both from the JWT. externalOrderId carries the order platform's own id when
  // the collection arrived as a hand-off, which also makes a repeated hand-off idempotent.
  Future<PaymentRequest> create({
    required double totalAmount,
    required String paymentMethod,
    String? externalOrderId,
    String? description,
  }) async {
    final json = await _api.post('/payments', body: {
      'totalAmount': totalAmount,
      'paymentMethod': paymentMethod,
      if (externalOrderId != null && externalOrderId.isNotEmpty) 'externalOrderId': externalOrderId,
      if (description != null && description.isNotEmpty) 'description': description,
    });

    return PaymentRequest.fromJson(json);
  }

  Future<PaymentRequest> getById(String id) async {
    return PaymentRequest.fromJson(await _api.get('/payments/$id'));
  }

  // Issues a bank QR for whatever is still owed. Called again after a partial payment, because
  // the new QR must cover the reduced remaining amount rather than the original total.
  Future<PaymentRequest> generateQr(String id) async {
    return PaymentRequest.fromJson(await _api.post('/payments/$id/qr'));
  }

  Future<PaymentRequest> recordTransaction({
    required String paymentRequestId,
    required double amount,
    required String paymentMethod,
    String? providerReference,
  }) async {
    final json = await _api.post('/payments/$paymentRequestId/transactions', body: {
      'amount': amount,
      'paymentMethod': paymentMethod,
      if (providerReference != null && providerReference.isNotEmpty) 'providerReference': providerReference,
    });

    return PaymentRequest.fromJson(json);
  }

  Future<List<PaymentRequest>> list({String? status}) async {
    final items = await _api.getList('/payments', query: status == null ? null : {'status': status});
    return items
        .map((item) => PaymentRequest.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }
}
