import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

// Deeper cancellation policy edge cases, beyond Phase 4's baseline (PENDING/PARTIALLY_PAID
// cancel succeeds, PAID cancel rejected, unknown id 404) in cancelled.spec.ts.
describe('Payment Lifecycle - Cancellation Edge Cases (Phase 7)', () => {
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

  it('is idempotent: cancelling an already-CANCELLED request succeeds again without changing paidAmount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 30, 'CASH').expect(201);

    const first = await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(first.status).toBe(201);
    expect(first.body.status).toBe('CANCELLED');
    expect(first.body.paidAmount).toBe(30);

    const second = await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(second.status).toBe(201);
    expect(second.body.status).toBe('CANCELLED');
    expect(second.body.paidAmount).toBe(30);
  });

  it('rejects cancelling a FAILED payment request (terminal state, no outgoing transitions)', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' })
      .expect(400); // fails at creation (unimplemented ParamPOS QR stub), lands in FAILED

    const list = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.body).toHaveLength(1);
    const failedId = list.body[0].id;
    expect(list.body[0].status).toBe('FAILED');
    void merchantId;

    const response = await request(app.getHttpServer())
      .post(`/api/payments/${failedId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
  });

  it('rejects cancelling a PAID payment request with a message naming the illegal transition', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 100, 'CASH').expect(201);

    const response = await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('PAID');
    expect(response.body.message).toContain('CANCELLED');
  });

  it('rejects recording a new transaction against an already-cancelled payment request, without leaving a partial record', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 40, 'CASH').expect(201);

    await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const attempt = await recordTransaction(app, accessToken, created.id, 10, 'CASH');
    expect(attempt.status).toBe(400);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('CANCELLED');
    expect(fetched.body.paidAmount).toBe(40);
    expect(fetched.body.transactions).toHaveLength(1);
  });

  it('returns 400 (not 500) for a malformed payment request id (regression: ParseUUIDPipe)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const cancel = await request(app.getHttpServer())
      .post('/api/payments/not-a-uuid/cancel')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(cancel.status).toBe(400);

    const get = await request(app.getHttpServer())
      .get('/api/payments/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(get.status).toBe(400);

    const transaction = await recordTransaction(app, accessToken, 'not-a-uuid', 10, 'CASH');
    expect(transaction.status).toBe(400);
  });

  it('returns 404, not 400/500, for a well-formed but unknown payment request id', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments/11111111-1111-1111-1111-111111111111/cancel')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });
});
