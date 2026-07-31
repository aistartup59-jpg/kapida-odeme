import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/api_client.dart';
import '../../data/collection_gateway.dart';
import '../../data/payment_models.dart';

class CollectArguments {
  const CollectArguments({required this.gateway, required this.paymentRequest, this.returnUrl});

  // How this screen reaches the payment: a signed-in session, or an order platform hand-off
  // token held by a courier with no account (ADR-015).
  final CollectionGateway gateway;
  final PaymentRequest paymentRequest;

  // Set on a hand-off, which is what makes the automatic return to the platform's app possible
  // once the money is in.
  final String? returnUrl;
}

class CollectScreen extends ConsumerStatefulWidget {
  const CollectScreen({super.key, required this.arguments});

  final CollectArguments arguments;

  @override
  ConsumerState<CollectScreen> createState() => _CollectScreenState();
}

class _CollectScreenState extends ConsumerState<CollectScreen> {
  late PaymentRequest _payment = widget.arguments.paymentRequest;
  String? _qrData;
  bool _busy = false;
  String? _error;
  Timer? _poll;
  bool _returned = false;

  CollectionGateway get _gateway => widget.arguments.gateway;

  @override
  void initState() {
    super.initState();
    if (_payment.isPaid) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _returnToPartner());
    }
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  // A bank QR is settled by the customer's banking app, so nothing happens on this device when
  // it succeeds — the backend learns about it from the provider. Polling while a QR is on
  // screen is what turns that into a visible result for whoever is collecting.
  void _startPolling() {
    _poll?.cancel();
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _refresh());
  }

  Future<void> _refresh() async {
    try {
      final updated = await _gateway.load();
      if (!mounted) return;

      setState(() => _payment = updated);
      _onPaymentChanged();
    } on ApiException {
      // A transient failure while polling is not worth interrupting a collection over; the
      // next tick tries again, and every explicit action still surfaces its own errors.
    }
  }

  void _onPaymentChanged() {
    if (!_payment.isCollectable) {
      _poll?.cancel();
      setState(() => _qrData = null);
    }

    if (_payment.isPaid) {
      _returnToPartner();
    }
  }

  Future<void> _showQr() async {
    await _run(() async {
      final updated = await _gateway.generateQr();
      setState(() {
        _payment = updated;
        _qrData = updated.qrData;
      });
      _startPolling();
    });
  }

  Future<void> _collectCash() async {
    final amount = await _askAmount();
    if (amount == null) return;

    await _run(() async {
      final updated = await _gateway.recordCash(amount);

      setState(() {
        _payment = updated;
        // Any QR still on screen was issued for the old remaining amount and no longer covers
        // what is owed, so it must not stay visible after a partial cash payment.
        _qrData = null;
      });
      _onPaymentChanged();
    });
  }

  Future<double?> _askAmount() async {
    final controller = TextEditingController(text: _payment.remainingAmount.toStringAsFixed(2));

    return showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nakit tahsilat'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: 'Alınan tutar',
            helperText: 'Kalan: ${_money(_payment.remainingAmount)}',
            border: const OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Vazgeç')),
          FilledButton(
            onPressed: () {
              final value = double.tryParse(controller.text.trim().replaceAll(',', '.'));
              Navigator.of(context).pop(value != null && value > 0 ? value : null);
            },
            child: const Text('Tahsil et'),
          ),
        ],
      ),
    );
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      await action();
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // Hands the courier straight back to the platform's app so the delivery can be completed
  // without them hunting for it in the task switcher.
  Future<void> _returnToPartner() async {
    final returnUrl = widget.arguments.returnUrl;
    if (_returned || returnUrl == null) return;

    _returned = true;
    final uri = Uri.tryParse(returnUrl);
    if (uri == null) return;

    // Launched without a canLaunchUrl() check on purpose: that check only answers truthfully
    // for schemes declared in <queries>, and the platform's scheme is not known when this APK
    // is built. Attempting the jump and tolerating failure is the honest behaviour — whoever
    // collected still sees the completed payment either way.
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // The platform app is not installed or refused the link; nothing more to do here.
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_payment.externalOrderId == null ? 'Tahsilat' : 'Sipariş ${_payment.externalOrderId}'),
        automaticallyImplyLeading: Navigator.of(context).canPop(),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            _AmountSummary(payment: _payment),
            const SizedBox(height: 20),
            if (_error != null) ...[
              Card(
                color: theme.colorScheme.errorContainer,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(_error!, style: TextStyle(color: theme.colorScheme.onErrorContainer)),
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (_payment.isPaid)
              _PaidPanel(returnUrl: widget.arguments.returnUrl, onReturn: _returnToPartner)
            else if (!_payment.isCollectable)
              Card(
                child: ListTile(
                  leading: const Icon(Icons.block),
                  title: Text('Bu ödeme artık tahsil edilemez (${_payment.status}).'),
                ),
              )
            else ...[
              if (_qrData != null) ...[
                _QrPanel(data: _qrData!, amount: _money(_payment.remainingAmount)),
                const SizedBox(height: 20),
              ],
              FilledButton.icon(
                onPressed: _busy ? null : _showQr,
                icon: const Icon(Icons.qr_code_2),
                label: Text(_qrData == null ? 'Banka QR göster' : 'QR yenile'),
              ),
              const SizedBox(height: 12),
              FilledButton.tonalIcon(
                onPressed: _busy ? null : _collectCash,
                icon: const Icon(Icons.payments_outlined),
                label: const Text('Nakit tahsil et'),
              ),
              const SizedBox(height: 12),
              // NFC is deliberately inert: accepting a contactless card on a phone needs a
              // PCI-certified SoftPOS SDK from the payment provider, which raw Android NFC
              // cannot stand in for. The flow is in place for the moment that SDK lands.
              Tooltip(
                message: 'NFC tahsilat, sağlayıcının sertifikalı SoftPOS SDK\'sı entegre edilince açılacak.',
                child: OutlinedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.contactless_outlined),
                  label: const Text('NFC ile tahsil et (yakında)'),
                ),
              ),
            ],
            if (_payment.transactions.isNotEmpty) ...[
              const SizedBox(height: 28),
              Text('Tahsilat geçmişi', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final transaction in _payment.transactions)
                ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: Icon(_iconFor(transaction.paymentMethod)),
                  title: Text(_labelFor(transaction.paymentMethod)),
                  trailing: Text(_money(transaction.amount)),
                ),
            ],
          ],
        ),
      ),
    );
  }

  String _money(double value) => '${value.toStringAsFixed(2)} ${_payment.currency}';
}

IconData _iconFor(String paymentMethod) {
  switch (paymentMethod) {
    case 'QR':
      return Icons.qr_code_2;
    case 'NFC':
      return Icons.contactless_outlined;
    default:
      return Icons.payments_outlined;
  }
}

String _labelFor(String paymentMethod) {
  switch (paymentMethod) {
    case 'QR':
      return 'Banka QR';
    case 'NFC':
      return 'NFC';
    default:
      return 'Nakit';
  }
}

class _AmountSummary extends StatelessWidget {
  const _AmountSummary({required this.payment});

  final PaymentRequest payment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Kalan tutar', style: theme.textTheme.labelLarge),
            const SizedBox(height: 4),
            Text(
              '${payment.remainingAmount.toStringAsFixed(2)} ${payment.currency}',
              style: theme.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Toplam ${payment.totalAmount.toStringAsFixed(2)}'),
                Text('Tahsil edilen ${payment.paidAmount.toStringAsFixed(2)}'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QrPanel extends StatelessWidget {
  const _QrPanel({required this.data, required this.amount});

  final String data;
  final String amount;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text('Müşteri bankasından okutsun', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 16),
            // The payload is a real bank QR (TR Karekod / EMV) issued by the merchant's
            // provider (ADR-003) — this only renders it, it never builds one.
            QrImageView(data: data, size: 240, backgroundColor: Colors.white),
            const SizedBox(height: 12),
            Text(amount, style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      ),
    );
  }
}

class _PaidPanel extends StatelessWidget {
  const _PaidPanel({required this.returnUrl, required this.onReturn});

  final String? returnUrl;
  final Future<void> Function() onReturn;

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Icon(Icons.check_circle, size: 56),
            const SizedBox(height: 12),
            Text('Tahsilat tamamlandı', style: Theme.of(context).textTheme.titleLarge),
            if (returnUrl != null) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onReturn,
                icon: const Icon(Icons.open_in_new),
                label: const Text('Sipariş uygulamasına dön'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
