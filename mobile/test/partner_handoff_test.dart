import 'package:flutter_test/flutter_test.dart';
import 'package:payals_pos/core/partner_handoff.dart';

// The hand-off link is the seam between another company's app and money changing hands here
// (ADR-015), so every way it can arrive malformed has to end in a refusal rather than in a
// collection opened against the wrong payment.
void main() {
  group('PartnerHandoff.parse', () {
    test('reads a complete hand-off link', () {
      final handoff = PartnerHandoff.parse(
        Uri.parse('payals://collect?token=hof_abc123_def456&returnUrl=partner://order/4471'),
      );

      expect(handoff, isNotNull);
      expect(handoff!.token, 'hof_abc123_def456');
      expect(handoff.returnUrl, 'partner://order/4471');
    });

    test('treats a missing returnUrl as no automatic return', () {
      final handoff = PartnerHandoff.parse(Uri.parse('payals://collect?token=hof_abc123_def456'));

      expect(handoff?.token, 'hof_abc123_def456');
      expect(handoff?.returnUrl, isNull);
    });

    test('rejects a link for another scheme or host', () {
      expect(PartnerHandoff.parse(Uri.parse('other://collect?token=hof_a_b')), isNull);
      expect(PartnerHandoff.parse(Uri.parse('payals://settings?token=hof_a_b')), isNull);
    });

    test('rejects a missing or blank token', () {
      // Without a token there is no authorisation at all — the link says nothing about which
      // payment, which merchant, or how much.
      expect(PartnerHandoff.parse(Uri.parse('payals://collect')), isNull);
      expect(PartnerHandoff.parse(Uri.parse('payals://collect?token=')), isNull);
      expect(PartnerHandoff.parse(Uri.parse('payals://collect?token=%20')), isNull);
    });

    test('takes nothing but the token from a link that also carries an amount', () {
      // An amount in the link would be a claim made by another app on this device. Only the
      // token — minted server side by the platform — decides what is owed, so a link that
      // tries to state an amount parses exactly as if it had not.
      final withAmount = PartnerHandoff.parse(
        Uri.parse('payals://collect?token=hof_abc_def&amount=999999&merchantId=someone-else'),
      );
      final withoutAmount = PartnerHandoff.parse(Uri.parse('payals://collect?token=hof_abc_def'));

      expect(withAmount, isNotNull);
      expect(withAmount!.token, withoutAmount!.token);
      expect(withAmount.returnUrl, withoutAmount.returnUrl);
    });
  });
}
