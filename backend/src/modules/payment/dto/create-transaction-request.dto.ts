export class CreateTransactionRequestDto {
  amount: number;
  paymentMethod: string;
  providerReference?: string;
}
