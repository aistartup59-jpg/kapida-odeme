import { Injectable } from '@nestjs/common';

import { PaymentState } from './payment-state.enum';
import { PaymentTransition } from './payment-transition.interface';
import { PaymentTransitionResult } from './payment-transition-result.interface';

const ALLOWED_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  [PaymentState.PENDING]: [
    PaymentState.PARTIALLY_PAID,
    PaymentState.PAID,
    PaymentState.CANCELLED,
    PaymentState.EXPIRED,
    PaymentState.FAILED,
  ],
  [PaymentState.PARTIALLY_PAID]: [
    PaymentState.PAID,
    PaymentState.CANCELLED,
    PaymentState.EXPIRED,
    PaymentState.REFUNDED,
  ],
  [PaymentState.PAID]: [PaymentState.REFUNDED],
  [PaymentState.CANCELLED]: [],
  [PaymentState.EXPIRED]: [],
  [PaymentState.FAILED]: [],
  [PaymentState.REFUNDED]: [],
};

@Injectable()
export class PaymentStateMachineService {
  canTransition(from: PaymentState, to: PaymentState): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(transition: PaymentTransition): PaymentTransitionResult {
    const { from, to } = transition;
    const allowed = this.canTransition(from, to);

    return {
      allowed,
      from,
      to,
      reason: allowed ? undefined : `Transition from ${from} to ${to} is not allowed.`,
    };
  }
}
