import { ProviderConfig } from './provider-config.model';
import { ProviderCredentials } from './provider-credentials.model';
import { ProviderId } from './provider-id.model';

export interface ProviderContext {
  providerType: ProviderId;
  merchantId: string;
  config: ProviderConfig;
  credentials: ProviderCredentials;
}
