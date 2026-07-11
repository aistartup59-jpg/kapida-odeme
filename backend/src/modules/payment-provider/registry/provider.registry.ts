import { Injectable, NotFoundException } from '@nestjs/common';

import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { ProviderType } from '../enums/provider-type.enum';

@Injectable()
export class ProviderRegistry {
  private readonly providers = new Map<ProviderType, PaymentProvider>();

  register(type: ProviderType, provider: PaymentProvider): void {
    this.providers.set(type, provider);
  }

  resolve(type: ProviderType): PaymentProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new NotFoundException(`Payment provider not registered: ${type}`);
    }
    return provider;
  }

  has(type: ProviderType): boolean {
    return this.providers.has(type);
  }
}
