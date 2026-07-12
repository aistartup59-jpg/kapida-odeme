import { ProviderException } from './provider.exception';

export class ProviderAuthenticationException extends ProviderException {
  constructor(message: string, providerCode?: string, details?: Record<string, unknown>) {
    super(message, providerCode, details);
    this.name = 'ProviderAuthenticationException';
    Object.setPrototypeOf(this, ProviderAuthenticationException.prototype);
  }
}
