import { ProviderError } from './provider-error.interface';

export interface ProviderResult<T> {
  success: boolean;
  data?: T;
  error?: ProviderError;
}
