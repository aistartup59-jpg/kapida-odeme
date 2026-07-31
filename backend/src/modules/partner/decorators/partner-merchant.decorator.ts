import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// The merchant resolved from the partner API key by PartnerApiKeyGuard.
export const PartnerMerchant = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().partnerMerchantId;
});
