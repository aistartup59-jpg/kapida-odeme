import { ProviderType } from '../enums/provider-type.enum';
import { ProviderConfig } from './provider-config.model';
import { ProviderCredentials } from './provider-credentials.model';

export interface ProviderContext {
  providerType: ProviderType;
  merchantId: string;
  config: ProviderConfig;
  credentials: ProviderCredentials;
}
