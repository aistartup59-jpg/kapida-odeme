import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export interface TransactionResponseDto {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentLifecycleState;
  providerReference?: string;
  createdAt: Date;
}
