import { Injectable } from '@nestjs/common';

import { ProviderId } from '../core/provider-id.model';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { ProviderRegistry } from '../registry/provider.registry';

@Injectable()
export class PaymentProviderFactory {
  constructor(private readonly registry: ProviderRegistry) {}

  getProvider(id: ProviderId): PaymentProvider {
    return this.registry.resolve(id);
  }
}
