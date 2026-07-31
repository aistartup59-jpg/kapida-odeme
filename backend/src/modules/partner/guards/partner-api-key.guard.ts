import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { PartnerApiKeyService } from '../partner-api-key.service';

export const PARTNER_API_KEY_HEADER = 'x-api-key';

// Authenticates an order platform by its API key and attaches the merchant that key belongs
// to. The merchant is derived from the credential and never read from the request body,
// which is the same rule ADR-005 applies to JWT-authenticated callers.
@Injectable()
export class PartnerApiKeyGuard implements CanActivate {
  constructor(private readonly partnerApiKeyService: PartnerApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const presentedKey = request.headers?.[PARTNER_API_KEY_HEADER];

    const merchantId = await this.partnerApiKeyService.resolveMerchantId(
      typeof presentedKey === 'string' ? presentedKey : undefined,
    );

    if (!merchantId) {
      throw new UnauthorizedException('A valid partner API key is required.');
    }

    request.partnerMerchantId = merchantId;
    return true;
  }
}
