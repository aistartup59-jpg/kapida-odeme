import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { PARTNER_API_KEY_HEADER } from '../../modules/partner/guards/partner-api-key.guard';
import { HANDOFF_TOKEN_HEADER } from '../../modules/partner/guards/handoff-token.guard';

// Counts requests against the caller, not against the address the packets arrived from.
//
// The address is the wrong unit for two of this API's callers. An order platform's backend is
// one machine placing every hand-off for every courier it employs, so limiting it by address
// would throttle the whole platform as if it were one shop. In the other direction, a shop's
// POS devices and its customers' phones share a single public address behind NAT, so an
// address-based count attributes one device's behaviour to all of them.
//
// Where a credential identifies the caller, that is what gets counted. Everything else — sign
// in, registration, an unauthenticated probe — has no credential to count by and correctly
// falls back to the address.
@Injectable()
export class CredentialAwareThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: Record<string, any>): Promise<string> {
    const apiKey = request.headers?.[PARTNER_API_KEY_HEADER];
    if (typeof apiKey === 'string' && apiKey) {
      return `partner-key:${apiKey}`;
    }

    const handoffToken = request.headers?.[HANDOFF_TOKEN_HEADER];
    if (typeof handoffToken === 'string' && handoffToken) {
      return `handoff:${handoffToken}`;
    }

    // req.ip is only the real client once Express is told how many proxies sit in front of it
    // — see TRUST_PROXY in main.ts. Without that, every request behind a load balancer shares
    // one tracker and the limits below would apply to the deployment as a whole.
    return request.ip ?? 'unknown';
  }
}
