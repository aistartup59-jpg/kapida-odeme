import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/di.dart';
import '../../data/collection_gateway.dart';
import '../../data/payment_models.dart';
import '../collect/collect_screen.dart';

// The small business side of the product: sign in, key the amount in, collect. Order platform
// couriers never reach this screen — they arrive on a hand-off link and go straight to the
// collection without an account (ADR-015).
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _amount = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  // A collection starts as CASH, because at this point nobody knows how the customer will pay.
  // The method is decided at the counter and recorded per Transaction, and a bank QR can be
  // issued on demand for whatever is still owed (ADR-002, ADR-013).
  Future<void> _startCollection() async {
    final amount = double.tryParse(_amount.text.trim().replaceAll(',', '.'));

    if (amount == null || amount <= 0) {
      setState(() => _error = 'Geçerli bir tutar girin.');
      return;
    }

    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      final payments = ref.read(paymentRepositoryProvider);
      final payment = await payments.create(totalAmount: amount, paymentMethod: 'CASH');

      if (!mounted) return;
      _amount.clear();
      _openCollection(payment);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openCollection(PaymentRequest payment) {
    Navigator.of(context).pushNamed(
      '/collect',
      arguments: CollectArguments(
        gateway: SessionCollectionGateway(ref.read(paymentRepositoryProvider), payment.id),
        paymentRequest: payment,
      ),
    );
  }

  Future<void> _logout() async {
    await ref.read(authRepositoryProvider).logout();
    if (!mounted) return;
    Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    // Incoming hand-offs are handled at the root of the app (see App), not here — a listener
    // on one screen misses every link that arrives while the courier is on another.
    return Scaffold(
      appBar: AppBar(
        title: const Text('PayALS'),
        actions: [
          IconButton(onPressed: _busy ? null : _logout, icon: const Icon(Icons.logout), tooltip: 'Çıkış'),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Yeni tahsilat', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextField(
              controller: _amount,
              enabled: !_busy,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Tutar',
                suffixText: 'TRY',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (_) => _startCollection(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _busy ? null : _startCollection,
              icon: const Icon(Icons.point_of_sale),
              label: const Text('Tahsilata başla'),
            ),
            const SizedBox(height: 32),
            _OpenCollections(onOpen: _openCollection),
          ],
        ),
      ),
    );
  }
}

class _OpenCollections extends ConsumerStatefulWidget {
  const _OpenCollections({required this.onOpen});

  final void Function(PaymentRequest payment) onOpen;

  @override
  ConsumerState<_OpenCollections> createState() => _OpenCollectionsState();
}

class _OpenCollectionsState extends ConsumerState<_OpenCollections> {
  // Held in state rather than created inline in build(): a future built during build is
  // rebuilt on every frame that touches this widget, which would fire a fresh request each
  // time instead of showing the one that is already in flight.
  late Future<List<PaymentRequest>> _pending = _load();

  Future<List<PaymentRequest>> _load() => ref.read(paymentRepositoryProvider).list(status: 'PENDING');

  void _reload() => setState(() => _pending = _load());

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Bekleyen tahsilatlar', style: Theme.of(context).textTheme.titleMedium),
            IconButton(onPressed: _reload, icon: const Icon(Icons.refresh)),
          ],
        ),
        FutureBuilder(
          future: _pending,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Padding(padding: EdgeInsets.all(16), child: LinearProgressIndicator());
            }

            if (snapshot.hasError) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Text('${snapshot.error}'),
              );
            }

            final payments = snapshot.data ?? const <PaymentRequest>[];

            if (payments.isEmpty) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('Bekleyen tahsilat yok.'),
              );
            }

            return Column(
              children: [
                for (final payment in payments)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text('${payment.remainingAmount.toStringAsFixed(2)} ${payment.currency}'),
                    subtitle: Text(payment.externalOrderId ?? payment.id),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => widget.onOpen(payment),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}
