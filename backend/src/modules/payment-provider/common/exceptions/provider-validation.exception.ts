import { ProviderException } from './provider.exception';

export class ProviderValidationException extends ProviderException {
  constructor(message: string, providerCode?: string, details?: Record<string, unknown>) {
    super(message, providerCode, details);
    this.name = 'ProviderValidationException';
    Object.setPrototypeOf(this, ProviderValidationException.prototype);
  }
}
