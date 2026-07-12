export class ProviderException extends Error {
  constructor(
    message: string,
    public readonly providerCode?: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ProviderException';
    Object.setPrototypeOf(this, ProviderException.prototype);
  }
}
