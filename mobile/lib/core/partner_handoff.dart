import 'app_config.dart';

// A collection handed over by an order platform's courier app (ADR-015):
//
//   payals://collect?token=hof_<publicId>_<secret>&returnUrl=partner://order/4471
//
// The link carries no amount and no merchant. Those live inside the token, which the
// platform's backend minted with the merchant's API key — so what the courier is asked to
// collect was authorised by a server, not stated by an app sitting next to ours on the same
// device. The courier never signs in: the token is the whole authorisation, and it reaches
// exactly one payment request.
class PartnerHandoff {
  const PartnerHandoff({required this.token, this.returnUrl});

  final String token;

  // Where to send the courier once the money is in. Absent means the platform expects the
  // usual Android back-stack return instead of an explicit jump.
  final String? returnUrl;

  static PartnerHandoff? parse(Uri uri) {
    if (uri.scheme != AppConfig.deepLinkScheme || uri.host != AppConfig.deepLinkCollectHost) {
      return null;
    }

    final token = uri.queryParameters['token']?.trim();

    if (token == null || token.isEmpty) {
      return null;
    }

    final returnUrl = uri.queryParameters['returnUrl']?.trim();

    return PartnerHandoff(
      token: token,
      returnUrl: returnUrl == null || returnUrl.isEmpty ? null : returnUrl,
    );
  }
}
