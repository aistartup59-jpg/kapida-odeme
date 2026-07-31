import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// The single PaymentRequest the presented hand-off token is scoped to, resolved by
// HandoffTokenGuard. It never comes from the request itself.
export const HandoffPaymentRequestId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest().handoffPaymentRequestId;
});
