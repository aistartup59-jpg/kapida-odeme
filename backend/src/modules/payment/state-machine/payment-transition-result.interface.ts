import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';

export interface PaymentTransitionResult {
  allowed: boolean;
  from: PaymentLifecycleState;
  to: PaymentLifecycleState;
  reason?: string;
}
