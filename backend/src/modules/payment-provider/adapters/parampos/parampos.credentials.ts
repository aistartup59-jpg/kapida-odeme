import { ProviderCredentials } from '../../core/provider-credentials.model';

export interface ParamPosCredentials extends ProviderCredentials {
  clientCode: string;
  clientUsername: string;
  clientPassword: string;
  guid: string;
  mode: 'TEST' | 'PRODUCTION';
}
