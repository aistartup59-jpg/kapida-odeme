import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Payment - Validation', () => {
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

  it('rejects an unauthenticated request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .send({ totalAmount: 100, paymentMethod: 'CASH' });

    expect(response.status).toBe(401);
  });

  it('rejects a missing totalAmount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ paymentMethod: 'CASH' });

    expect(response.status).toBe(400);
  });

  it('rejects a zero totalAmount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 0, paymentMethod: 'CASH' });

    expect(response.status).toBe(400);
  });

  it('rejects a negative totalAmount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: -50, paymentMethod: 'CASH' });

    expect(response.status).toBe(400);
  });

  it('rejects a missing paymentMethod', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100 });

    expect(response.status).toBe(400);
  });

  it('rejects an invalid paymentMethod', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'BITCOIN' });

    expect(response.status).toBe(400);
  });

  it('rejects an invalid currency', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH', currency: 'GBP' });

    expect(response.status).toBe(400);
  });

  it('rejects an invalid deliveryChannel', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH', deliveryChannel: 'EMAIL' });

    expect(response.status).toBe(400);
  });

  it('rejects a client-supplied merchantId or employeeId (must always come from the JWT)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        totalAmount: 100,
        paymentMethod: 'CASH',
        merchantId: '11111111-1111-1111-1111-111111111111',
        employeeId: '22222222-2222-2222-2222-222222222222',
      });

    expect(response.status).toBe(400);
  });
});
