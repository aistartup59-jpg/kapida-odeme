import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';

describe('Merchant Provider - Update', () => {
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

  it('updates the provider credentials', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);

    const response = await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ credentials: { apiKey: 'rotated-key', apiSecret: 'rotated-secret' } });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(provider.id);
    expect(response.body.credentials).toBeUndefined();
  });

  it('accepts an update with no fields as a no-op', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);

    const response = await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(provider.id);
  });

  it('rejects empty credentials on update', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);

    const response = await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ credentials: {} });

    expect(response.status).toBe(400);
  });

  it('returns 404 for an unknown provider id', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .patch('/api/merchant/payment-providers/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ credentials: { apiKey: 'key' } });

    expect(response.status).toBe(404);
  });

  it('returns 404 when updating a different merchant\'s provider', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, ownerA.accessToken);

    const response = await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .send({ credentials: { apiKey: 'stolen-key' } });

    expect(response.status).toBe(404);
  });
});
