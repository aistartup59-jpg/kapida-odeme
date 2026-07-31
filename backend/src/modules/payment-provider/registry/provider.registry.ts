import { Injectable, NotFoundException } from '@nestjs/common';

import { normalizeProviderId, ProviderId } from '../core/provider-id.model';
import { PaymentProvider } from '../interfaces/payment-provider.interface';

// The registry is the single source of truth for which providers exist (ADR-014). It is
// keyed by a normalized string id rather than an enum, so an adapter that registers itself
// becomes an accepted providerType everywhere — merchant configuration, resolution, and
// dispatch — without any other file changing.
@Injectable()
export class ProviderRegistry {
  private readonly providers = new Map<ProviderId, PaymentProvider>();

  register(id: ProviderId, provider: PaymentProvider): void {
    this.providers.set(normalizeProviderId(id), provider);
  }

  resolve(id: ProviderId): PaymentProvider {
    const provider = this.providers.get(normalizeProviderId(id));
    if (!provider) {
      throw new NotFoundException(`Payment provider not registered: ${id}`);
    }
    return provider;
  }

  has(id: ProviderId): boolean {
    return this.providers.has(normalizeProviderId(id));
  }

  // Merchant-facing validation asks the registry what is actually installed instead of
  // comparing against a hardcoded list of provider names.
  list(): ProviderId[] {
    return [...this.providers.keys()].sort();
  }
}
