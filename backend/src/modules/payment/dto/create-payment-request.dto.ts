export class CreatePaymentRequestDto {
  totalAmount: number;
  paymentMethod: string;
  currency?: string;
  deliveryChannel?: string;
  description?: string;
  expiresAt?: Date | string;
}
