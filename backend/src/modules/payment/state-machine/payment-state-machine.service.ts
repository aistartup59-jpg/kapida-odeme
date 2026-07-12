import { Injectable } from '@nestjs/common';

import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';
import { PaymentTransition } from './payment-transition.interface';
import { PaymentTransitionResult } from './payment-transition-result.interface';

const ALLOWED_TRANSITIONS: Record<PaymentLifecycleState, PaymentLifecycleState[]> = {
  [PaymentLifecycleState.PENDING]: [
    PaymentLifecycleState.PARTIALLY_PAID,
    PaymentLifecycleState.PAID,
    PaymentLifecycleState.CANCELLED,
    PaymentLifecycleState.EXPIRED,
    PaymentLifecycleState.FAILED,
  ],
  [PaymentLifecycleState.PARTIALLY_PAID]: [
    PaymentLifecycleState.PAID,
    PaymentLifecycleState.CANCELLED,
    PaymentLifecycleState.EXPIRED,
    PaymentLifecycleState.REFUNDED,
  ],
  [PaymentLifecycleState.PAID]: [PaymentLifecycleState.REFUNDED],
  [PaymentLifecycleState.CANCELLED]: [],
  [PaymentLifecycleState.EXPIRED]: [],
  [PaymentLifecycleState.FAILED]: [],
  [PaymentLifecycleState.REFUNDED]: [],
};

@Injectable()
export class PaymentStateMachineService {
  canTransition(from: PaymentLifecycleState, to: PaymentLifecycleState): boolean {
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
