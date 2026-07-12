import { PaymentState } from './payment-state.enum';

export interface PaymentTransition {
  from: PaymentState;
  to: PaymentState;
}
