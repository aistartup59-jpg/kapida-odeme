import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

describe('Payment Lifecycle - Pending & Partially Paid', () => {
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

  it('starts a freshly created payment request in PENDING with the full amount remaining', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    expect(created.status).toBe('PENDING');
    expect(created.paidAmount).toBe(0);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('PENDING');
    expect(fetched.body.remainingAmount).toBe(100);
  });

  it('moves PENDING to PARTIALLY_PAID after a partial transaction, and returns the full response shape immediately', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const recordResponse = await recordTransaction(app, accessToken, created.id, 40).expect(201);

    // Regression: recordTransaction previously returned the raw PaymentRequest entity
    // instead of going through toResponse() like every sibling endpoint, silently omitting
    // remainingAmount and transactions from the response.
    expect(recordResponse.body.status).toBe('PARTIALLY_PAID');
    expect(recordResponse.body.paidAmount).toBe(40);
    expect(recordResponse.body.remainingAmount).toBe(60);
    expect(recordResponse.body.transactions).toHaveLength(1);
    expect(recordResponse.body.transactions[0].amount).toBe(40);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('PARTIALLY_PAID');
    expect(fetched.body.paidAmount).toBe(40);
    expect(fetched.body.remainingAmount).toBe(60);
  });

  it('stays PARTIALLY_PAID across multiple partial transactions until fully paid', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 30).expect(201);
    await recordTransaction(app, accessToken, created.id, 20).expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('PARTIALLY_PAID');
    expect(fetched.body.paidAmount).toBe(50);
    expect(fetched.body.remainingAmount).toBe(50);
  });
});
