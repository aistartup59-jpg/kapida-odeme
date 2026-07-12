import { PaymentState } from './payment-state.enum';

export interface PaymentTransitionResult {
  allowed: boolean;
  from: PaymentState;
  to: PaymentState;
  reason?: string;
}
