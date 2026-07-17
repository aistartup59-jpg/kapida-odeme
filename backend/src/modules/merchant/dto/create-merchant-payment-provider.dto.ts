import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateMerchantPaymentProviderDto {
  @IsString()
  @IsNotEmpty()
  providerType: string;

  @IsObject()
  @IsNotEmpty()
  credentials: Record<string, string>;
}
