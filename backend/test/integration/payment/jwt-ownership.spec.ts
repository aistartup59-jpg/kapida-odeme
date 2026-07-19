import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Payment - JWT Ownership', () => {
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

  it('stamps the created payment request with the merchantId from the JWT, never the client', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' });

    expect(response.body.merchantId).toBe(merchantId);
  });

  it('lets the owner read back their own payment request', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/payments/${created.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.body.id);
  });

  it('rejects reading a different merchant\'s payment request', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);

    const created = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/payments/${created.body.id}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`);

    expect(response.status).toBe(401);
  });

  it('returns 404 for a nonexistent payment request', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .get('/api/payments/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it('scopes the payment list to the authenticated merchant only', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);

    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    const listB = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${ownerB.accessToken}`);

    expect(listB.status).toBe(200);
    expect(listB.body).toEqual([]);

    const listA = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${ownerA.accessToken}`);

    expect(listA.body).toHaveLength(1);
  });
});
