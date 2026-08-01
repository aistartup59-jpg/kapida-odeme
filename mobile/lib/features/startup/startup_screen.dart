import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api_client.dart';
import '../../core/di.dart';
import '../../core/partner_handoff.dart';
import '../../data/collection_gateway.dart';
import '../collect/collect_screen.dart';

// Decides where the app lands, and which of the two products the person in front of it is
// using (ADR-015):
//
//  - An order platform courier arrives through a hand-off link and goes straight to the
//    collection. They never see a login screen, because they have no account at all.
//  - Everyone else is a small business signing in or signing up.
//
// A hand-off that launched the app cold has to be captured here: the deep link stream only
// carries links that arrive once the app is already running, so subscribing later would
// silently drop the very link that started it.
class StartupScreen extends ConsumerStatefulWidget {
  const StartupScreen({super.key});

  @override
  ConsumerState<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends ConsumerState<StartupScreen> {
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _decide());
  }

  Future<void> _decide() async {
    PartnerHandoff? handoff;

    try {
      final initialUri = await ref.read(appLinksProvider).getInitialLink();
      handoff = initialUri == null ? null : PartnerHandoff.parse(initialUri);
    } catch (_) {
      handoff = null;
    }

    if (!mounted) return;

    if (handoff != null) {
      await openHandoff(context, handoff, replace: true, onError: (message) {
        if (mounted) setState(() => _error = message);
      });
      return;
    }

    final signedIn = await ref.read(authRepositoryProvider).hasSession();
    if (!mounted) return;

    Navigator.of(context).pushReplacementNamed(signedIn ? '/home' : '/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.link_off, size: 56),
                  const SizedBox(height: 16),
                  Text('Tahsilat açılamadı', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  // A courier whose hand-off failed has no account to fall back to, so the
                  // only honest options are trying again or going back to the platform's app.
                  FilledButton(
                    onPressed: () {
                      setState(() => _error = null);
                      _decide();
                    },
                    child: const Text('Tekrar dene'),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}

// Opens a hand-off collection with no sign-in: the token is the entire authorisation and it
// reaches exactly one payment request. Shared by cold start and by links that arrive while the
// app is already open.
//
// A warm hand-off replaces whatever is on screen rather than stacking on top of it. A courier
// who has just finished one order and is handed the next must land on the new collection —
// leaving them looking at the completed previous one, with the new order silently queued
// behind it, is how a payment gets missed.
Future<void> openHandoff(
  BuildContext context,
  PartnerHandoff handoff, {
  bool replace = false,
  void Function(String message)? onError,
}) async {
  final gateway = HandoffCollectionGateway(handoff.token);

  try {
    final payment = await gateway.load();
    if (!context.mounted) return;

    final arguments = CollectArguments(
      gateway: gateway,
      paymentRequest: payment,
      returnUrl: handoff.returnUrl,
    );

    if (replace) {
      Navigator.of(context).pushReplacementNamed('/collect', arguments: arguments);
    } else {
      Navigator.of(context).pushNamedAndRemoveUntil('/collect', (route) => route.isFirst, arguments: arguments);
    }
  } on ApiException catch (error) {
    onError?.call(
      error.statusCode == 401
          ? 'Bu tahsilat bağlantısının süresi dolmuş. Sipariş uygulamasından tekrar başlatın.'
          : error.message,
    );
  }
}
