import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateTransactionRequestDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  providerReference?: string;
}
