import { IsObject, IsOptional } from 'class-validator';

export class UpdateMerchantPaymentProviderDto {
  @IsOptional()
  @IsObject()
  credentials?: Record<string, string>;
}
