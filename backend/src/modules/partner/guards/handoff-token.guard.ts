import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

import { HandoffSessionService } from '../handoff-session.service';

export const HANDOFF_TOKEN_HEADER = 'x-handoff-token';

// Authorises a courier's device for one collection, with no account behind it (ADR-015). The
// token resolves to the PaymentRequest it was minted for, and that id never comes from the
// request — so there is no id for a caller to swap in order to reach someone else's payment.
@Injectable()
export class HandoffTokenGuard implements CanActivate {
  constructor(private readonly handoffSessionService: HandoffSessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const presented = request.headers?.[HANDOFF_TOKEN_HEADER];

    const paymentRequestId = await this.handoffSessionService.resolvePaymentRequestId(
      typeof presented === 'string' ? presented : undefined,
    );

    if (!paymentRequestId) {
      throw new UnauthorizedException('A valid hand-off token is required.');
    }

    request.handoffPaymentRequestId = paymentRequestId;
    return true;
  }
}
