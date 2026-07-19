import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { ProviderResolverService } from '../../../src/modules/payment-provider/resolver/provider-resolver.service';
import { NoActiveProviderException } from '../../../src/modules/payment-provider/common/exceptions/no-active-provider.exception';
import { MerchantPaymentProvider } from '../../../src/modules/payment-provider/entities/merchant-payment-provider.entity';

// ProviderResolverService has no direct HTTP route — it is consumed internally by the
// payment engine (Phase 3). Exercised here directly via the app's DI container, against
// real DB state set up through the public API, since this is where it belongs by scope.
describe('Merchant Provider - Active Provider Resolve', () => {
  let app: INestApplication;
  let resolver: ProviderResolverService;

  beforeAll(async () => {
    app = await createTestApp();
    resolver = app.get(ProviderResolverService);
  });

  afterEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('throws NoActiveProviderException when the merchant has no active provider', async () => {
    const { merchantId } = await registerAndLoginMerchant(app);

    await expect(resolver.resolveActiveProvider(merchantId)).rejects.toBeInstanceOf(NoActiveProviderException);
  });

  it('resolves the active provider once one is activated', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const resolved = await resolver.resolveActiveProvider(merchantId);

    expect(resolved.providerType).toBe('PARAM_POS');
    expect(resolved.credentialsReference).toEqual(expect.any(String));
    expect(resolved.provider).toBeDefined();
  });

  it('resolves independently per merchant', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, ownerA.accessToken, { providerType: 'PARAM_POS' });

    const resolvedA = await resolver.resolveActiveProvider(ownerA.merchantId);
    expect(resolvedA.providerType).toBe('PARAM_POS');

    await expect(resolver.resolveActiveProvider(ownerB.merchantId)).rejects.toBeInstanceOf(NoActiveProviderException);
  });

  it('resolves the newly-activated provider after switching, not the deactivated one', async () => {
    // Only PARAM_POS is registered in the ProviderRegistry today (see Phase 3 audit
    // notes) — using two PARAM_POS configs and distinguishing them by credentialsReference
    // still exercises the "switch which row is active" path without depending on an
    // unimplemented provider adapter.
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, {
      providerType: 'PARAM_POS',
      credentials: { apiKey: 'first-key' },
    });
    const second = await registerAndActivateProvider(app, accessToken, {
      providerType: 'PARAM_POS',
      credentials: { apiKey: 'second-key' },
    });

    const resolved = await resolver.resolveActiveProvider(merchantId);

    const dataSource = app.get(DataSource);
    const secondEntity = await dataSource
      .getRepository(MerchantPaymentProvider)
      .findOne({ where: { id: second.id } });

    expect(resolved.credentialsReference).toBe(secondEntity?.credentialsReference);
  });
});
