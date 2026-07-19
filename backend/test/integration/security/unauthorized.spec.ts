import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment } from '../../utils/payment-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';

// Sweeps every protected route that earlier phases exercised only with a valid token,
// confirming JwtAuthGuard actually rejects the no-token case on each one. Routes already
// covered elsewhere (POST /payments, POST /auth/logout, POST /auth/employee, DELETE
// /merchant/payment-providers/:id) are intentionally not repeated here.
describe('Security - Unauthorized Access (no token)', () => {
  let app: INestApplication;
  let accessToken: string;
  let paymentRequestId: string;
  let providerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const owner = await registerAndLoginMerchant(app);
    accessToken = owner.accessToken;
    const payment = await createCashPayment(app, accessToken, 100);
    paymentRequestId = payment.id;
    const provider = await registerProvider(app, accessToken);
    providerId = provider.id;
  });

  afterAll(async () => {
    await clearDatabase(app);
    await app.close();
  });

  it('rejects GET /payments without a token', async () => {
    const response = await request(app.getHttpServer()).get('/api/payments');
    expect(response.status).toBe(401);
  });

  it('rejects GET /payments/:id without a token', async () => {
    const response = await request(app.getHttpServer()).get(`/api/payments/${paymentRequestId}`);
    expect(response.status).toBe(401);
  });

  it('rejects POST /payments/:id/transactions without a token', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/payments/${paymentRequestId}/transactions`)
      .send({ amount: 10, paymentMethod: 'CASH' });
    expect(response.status).toBe(401);
  });

  it('rejects POST /payments/:id/cancel without a token', async () => {
    const response = await request(app.getHttpServer()).post(`/api/payments/${paymentRequestId}/cancel`);
    expect(response.status).toBe(401);
  });

  it('rejects GET /merchant/payment-providers without a token', async () => {
    const response = await request(app.getHttpServer()).get('/api/merchant/payment-providers');
    expect(response.status).toBe(401);
  });

  it('rejects PATCH /merchant/payment-providers/:id without a token', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${providerId}`)
      .send({ credentials: { apiKey: 'x' } });
    expect(response.status).toBe(401);
  });

  it('rejects POST /merchant/payment-providers/:id/activate without a token', async () => {
    const response = await request(app.getHttpServer()).post(`/api/merchant/payment-providers/${providerId}/activate`);
    expect(response.status).toBe(401);
  });
});
