import { ProviderError } from './provider-error.model';

export interface PaymentResult<T> {
  success: boolean;
  data?: T;
  error?: ProviderError;
}
