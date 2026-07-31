import { ProviderId } from '../../payment-provider/core/provider-id.model';

export interface MerchantPaymentProviderResponseDto {
  id: string;
  providerType: ProviderId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
