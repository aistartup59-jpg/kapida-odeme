import { ProviderType } from '../../payment-provider/enums/provider-type.enum';

export interface MerchantPaymentProviderResponseDto {
  id: string;
  providerType: ProviderType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
