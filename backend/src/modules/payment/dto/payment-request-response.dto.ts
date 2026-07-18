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
  // Present only on the create response for PaymentMethod.QR. A real Bank QR (ADR-003) is
  // a time-limited provider payload, not a stored PaymentRequest attribute — it is never
  // persisted or returned again on subsequent reads (mirrors ADR-002's "always derive,
  // never store" treatment of remainingAmount).
  qrData?: string;
  qrExpiresAt?: Date;
}
