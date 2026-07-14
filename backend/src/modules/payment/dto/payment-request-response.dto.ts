import { Currency } from '../enums/currency.enum';
import { DeliveryChannel } from '../enums/delivery-channel.enum';
import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { TransactionResponseDto } from './transaction-response.dto';

export interface PaymentRequestResponseDto {
  id: string;
  merchantId: string;
  employeeId?: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  deliveryChannel: DeliveryChannel;
  status: PaymentLifecycleState;
  description?: string;
  expiresAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  transactions: TransactionResponseDto[];
}
