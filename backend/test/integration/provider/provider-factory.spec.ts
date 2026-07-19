import { INestApplication, NotFoundException } from '@nestjs/common';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { PaymentProviderFactory } from '../../../src/modules/payment-provider/factory/payment-provider.factory';
import { ProviderRegistry } from '../../../src/modules/payment-provider/registry/provider.registry';
import { ProviderType } from '../../../src/modules/payment-provider/enums/provider-type.enum';
import { ParamPosAdapter } from '../../../src/modules/payment-provider/adapters/parampos/parampos.adapter';

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
    expect(registry.has(ProviderType.PARAM_POS)).toBe(true);
    expect(factory.getProvider(ProviderType.PARAM_POS)).toBeInstanceOf(ParamPosAdapter);
  });

  it.each([ProviderType.IYZICO, ProviderType.PAY_TR, ProviderType.SIPAY])(
    'has no adapter registered yet for %s (ADR-007: new providers need only an adapter + registration)',
    (providerType) => {
      expect(registry.has(providerType)).toBe(false);
    },
  );

  it('throws NotFoundException when resolving an unregistered provider type', () => {
    expect(() => factory.getProvider(ProviderType.IYZICO)).toThrow(NotFoundException);
  });
});
