import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Merchant Provider - Create', () => {
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

  it('registers a payment provider for the authenticated merchant', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ providerType: 'PARAM_POS', credentials: { apiKey: 'key', apiSecret: 'secret' } });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ providerType: 'PARAM_POS', isActive: false });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.credentials).toBeUndefined();
    expect(response.body.credentialsReference).toBeUndefined();
  });

  it('rejects an unauthenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .send({ providerType: 'PARAM_POS', credentials: { apiKey: 'key' } });

    expect(response.status).toBe(401);
  });

  it('rejects an invalid providerType', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ providerType: 'NOT_A_REAL_PROVIDER', credentials: { apiKey: 'key' } });

    expect(response.status).toBe(400);
  });

  it('rejects empty credentials', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ providerType: 'PARAM_POS', credentials: {} });

    expect(response.status).toBe(400);
  });

  it('rejects credentials with a non-string value', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ providerType: 'PARAM_POS', credentials: { apiKey: 12345 } });

    expect(response.status).toBe(400);
  });

  it('lists only the authenticated merchant\'s own providers', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);

    await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .send({ providerType: 'PARAM_POS', credentials: { apiKey: 'a-key' } })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${ownerB.accessToken}`)
      .send({ providerType: 'IYZICO', credentials: { apiKey: 'b-key' } })
      .expect(201);

    const listA = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${ownerA.accessToken}`);

    expect(listA.status).toBe(200);
    expect(listA.body).toHaveLength(1);
    expect(listA.body[0].providerType).toBe('PARAM_POS');
  });
});
