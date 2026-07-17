import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  deliveryChannel?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  expiresAt?: Date | string;
}
