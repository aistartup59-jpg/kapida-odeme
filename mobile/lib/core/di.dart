import 'package:app_links/app_links.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/auth_repository.dart';
import '../data/payment_repository.dart';
import 'api_client.dart';
import 'partner_handoff.dart';
import 'token_store.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient.session(ref.watch(tokenStoreProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.watch(apiClientProvider), ref.watch(tokenStoreProvider));
});

final paymentRepositoryProvider = Provider<PaymentRepository>((ref) {
  return PaymentRepository(ref.watch(apiClientProvider));
});

final appLinksProvider = Provider<AppLinks>((ref) => AppLinks());

// Hand-offs arriving while the app is already running. The cold-start link is read separately
// at startup, because a stream subscriber attached after launch would miss it.
final incomingHandoffProvider = StreamProvider<PartnerHandoff>((ref) {
  return ref
      .watch(appLinksProvider)
      .uriLinkStream
      .map(PartnerHandoff.parse)
      .where((handoff) => handoff != null)
      .cast<PartnerHandoff>();
});
