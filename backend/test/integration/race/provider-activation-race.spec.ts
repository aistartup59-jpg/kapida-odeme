import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';

// Regression for #8 "Make provider activation atomic" (033443b). Before the fix,
// deactivateAllForMerchant + save ran as two separate statements — concurrent activate()
// calls for two different providers could each complete their own deactivate-then-activate
// pair interleaved, leaving more than one provider isActive at once. The fix wraps both in
// a single DB transaction (merchant-payment-provider.service.ts's activate()).
describe('Race - Provider Activation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('never leaves more than one provider active when two are activated concurrently', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const providerA = await registerProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const providerB = await registerProvider(app, accessToken, { providerType: 'IYZICO' });

    const [resultA, resultB] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/merchant/payment-providers/${providerA.id}/activate`)
        .set('Authorization', `Bearer ${accessToken}`),
      request(app.getHttpServer())
        .post(`/api/merchant/payment-providers/${providerB.id}/activate`)
        .set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(resultA.status).toBe(201);
    expect(resultB.status).toBe(201);

    const list = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`);

    const activeProviders = list.body.filter((p: { isActive: boolean }) => p.isActive);
    expect(activeProviders).toHaveLength(1);
  });

  it('never leaves more than one active provider under repeated concurrent activation (5 providers at once)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const providers = await Promise.all(
      ['PARAM_POS', 'IYZICO', 'PAY_TR', 'SIPAY'].map((providerType) => registerProvider(app, accessToken, { providerType })),
    );
    // Register a second PARAM_POS config too, so 5 rows exist even with only 4 provider types.
    const extra = await registerProvider(app, accessToken, { providerType: 'PARAM_POS', credentials: { apiKey: 'extra' } });
    const allProviders = [...providers, extra];

    const results = await Promise.all(
      allProviders.map((provider) =>
        request(app.getHttpServer())
          .post(`/api/merchant/payment-providers/${provider.id}/activate`)
          .set('Authorization', `Bearer ${accessToken}`),
      ),
    );

    // Regression for a deadlock (Postgres 40P01) found while writing this test: 3+
    // concurrent activate() calls for the same merchant could deadlock on
    // deactivateAllForMerchant's bulk UPDATE, surfacing as a raw 500 for the deadlocked
    // request even though the final "exactly one active" invariant below still held.
    // Asserting every individual response status is what actually catches that class of
    // bug — the final-state check alone does not.
    for (const result of results) {
      expect(result.status).toBe(201);
    }

    const list = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`);

    const activeProviders = list.body.filter((p: { isActive: boolean }) => p.isActive);
    expect(activeProviders).toHaveLength(1);
  });
});
