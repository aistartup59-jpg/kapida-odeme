import { INestApplication, NotFoundException } from '@nestjs/common';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { PaymentProviderFactory } from '../../../src/modules/payment-provider/factory/payment-provider.factory';
import { ProviderRegistry } from '../../../src/modules/payment-provider/registry/provider.registry';
import { PaymentProvider } from '../../../src/modules/payment-provider/interfaces/payment-provider.interface';
import {
  PARAM_POS_PROVIDER_ID,
  ParamPosAdapter,
} from '../../../src/modules/payment-provider/adapters/parampos/parampos.adapter';

// The registry — not an enum — is the vocabulary of installed providers (ADR-014).
describe('Provider - Factory & Registry', () => {
  let app: INestApplication;
  let factory: PaymentProviderFactory;
  let registry: ProviderRegistry;

  beforeAll(async () => {
    app = await createTestApp();
    factory = app.get(PaymentProviderFactory);
    registry = app.get(ProviderRegistry);
  });

  afterEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('self-registers ParamPosAdapter for PARAM_POS on module init', () => {
    expect(registry.has(PARAM_POS_PROVIDER_ID)).toBe(true);
    expect(factory.getProvider(PARAM_POS_PROVIDER_ID)).toBeInstanceOf(ParamPosAdapter);
    expect(registry.list()).toContain(PARAM_POS_PROVIDER_ID);
  });

  it('resolves a provider id regardless of the casing and padding it arrives with', () => {
    expect(registry.has('  param_pos  ')).toBe(true);
    expect(factory.getProvider('param_pos')).toBeInstanceOf(ParamPosAdapter);
  });

  // The demo provider settles payments nobody made. It must be absent unless an environment
  // explicitly asked for it, and the test environment never does — so if this ever fails, a
  // fake provider has become reachable somewhere it was not switched on.
  it('does not install the demo provider unless DEMO_PAYMENT_PROVIDER is set', () => {
    expect(process.env.DEMO_PAYMENT_PROVIDER).toBeUndefined();
    expect(registry.has('DEMO')).toBe(false);
    expect(() => factory.getProvider('DEMO')).toThrow(NotFoundException);
  });

  it.each(['IYZICO', 'PAY_TR', 'SIPAY'])('has no adapter installed for %s', (providerId) => {
    expect(registry.has(providerId)).toBe(false);
    expect(registry.list()).not.toContain(providerId);
  });

  it('throws NotFoundException when resolving a provider that was never registered', () => {
    expect(() => factory.getProvider('IYZICO')).toThrow(NotFoundException);
  });

  // ADR-014: onboarding a provider is one adapter plus its registration — no enum edit and
  // no migration. Registering one at runtime here stands in for dropping in a new adapter.
  it('accepts a brand new provider id the moment an adapter registers itself', () => {
    const newcomer = {} as PaymentProvider;

    expect(registry.has('SOME_BANK_GATEWAY')).toBe(false);

    registry.register('SOME_BANK_GATEWAY', newcomer);

    expect(registry.has('SOME_BANK_GATEWAY')).toBe(true);
    expect(factory.getProvider('SOME_BANK_GATEWAY')).toBe(newcomer);
  });
});
