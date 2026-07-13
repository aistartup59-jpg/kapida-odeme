import { Currency } from '../../enums/currency.enum';

export interface PaymentExecutionContext {
  paymentRequestId: string;
  amount: number;
  currency: Currency;
  credentialsReference: string;
}
