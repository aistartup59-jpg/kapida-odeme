import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateHandoffDto {
  // The platform's own order id. It makes the hand-off idempotent: minting twice for one
  // order returns a token for the PaymentRequest that already exists, never a second charge.
  @IsString()
  @IsNotEmpty()
  externalOrderId: string;

  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
