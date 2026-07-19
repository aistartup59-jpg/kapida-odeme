import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';

describe('Merchant Provider - Activate', () => {
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

  it('activates a provider', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);

    const response = await request(app.getHttpServer())
      .post(`/api/merchant/payment-providers/${provider.id}/activate`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body.isActive).toBe(true);
  });

  it('deactivates the previously active provider when a new one is activated', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const providerA = await registerProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const providerB = await registerProvider(app, accessToken, { providerType: 'IYZICO' });

    await request(app.getHttpServer())
      .post(`/api/merchant/payment-providers/${providerA.id}/activate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/merchant/payment-providers/${providerB.id}/activate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`);

    const activeProviders = list.body.filter((p: { isActive: boolean }) => p.isActive);
    expect(activeProviders).toHaveLength(1);
    expect(activeProviders[0].id).toBe(providerB.id);
  });

  it('returns 404 when activating an unknown provider id', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers/11111111-1111-1111-1111-111111111111/activate')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it('returns 404 when activating a different merchant\'s provider', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, ownerA.accessToken);

    const response = await request(app.getHttpServer())
      .post(`/api/merchant/payment-providers/${provider.id}/activate`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`);

    expect(response.status).toBe(404);
  });
});
