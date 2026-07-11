import { Injectable } from '@nestjs/common';

import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { ProviderType } from '../enums/provider-type.enum';
import { ProviderRegistry } from '../registry/provider.registry';

@Injectable()
export class PaymentProviderFactory {
  constructor(private readonly registry: ProviderRegistry) {}

  getProvider(type: ProviderType): PaymentProvider {
    return this.registry.resolve(type);
  }
}
