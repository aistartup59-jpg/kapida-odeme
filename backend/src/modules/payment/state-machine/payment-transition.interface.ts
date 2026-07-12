import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';

export interface PaymentTransition {
  from: PaymentLifecycleState;
  to: PaymentLifecycleState;
}
