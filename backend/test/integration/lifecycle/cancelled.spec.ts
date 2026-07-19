import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

// Baseline "is CANCELLED reachable / legal" coverage per the state machine table. Deeper
// cancellation policy edge cases (cancel after paid error details, double-cancel, invalid
// cancel messaging) belong to Phase 7 (Cancellation) to avoid duplicating coverage.
describe('Payment Lifecycle - Cancelled', () => {
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

  it('cancels a PENDING payment request', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const response = await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('CANCELLED');
  });

  it('cancels a PARTIALLY_PAID payment request without touching paidAmount (ADR-012)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 40).expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('CANCELLED');
    expect(response.body.paidAmount).toBe(40);
  });

  it('rejects cancelling a PAID payment request (PAID only allows REFUNDED)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 100).expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
  });

  it('returns 404 when cancelling an unknown payment request', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments/11111111-1111-1111-1111-111111111111/cancel')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });
});
