import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

describe('Payment Lifecycle - Paid', () => {
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

  it('moves to PAID and sets paidAt once the full amount is recorded in one transaction', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 100).expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('PAID');
    expect(fetched.body.paidAmount).toBe(100);
    expect(fetched.body.remainingAmount).toBe(0);
    expect(fetched.body.paidAt).toEqual(expect.any(String));
  });

  it('moves to PAID once partial transactions sum to the full amount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 60).expect(201);
    await recordTransaction(app, accessToken, created.id, 40).expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('PAID');
    expect(fetched.body.paidAmount).toBe(100);
  });

  it('rejects a transaction that would exceed the total amount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 80).expect(201);

    const overpay = await recordTransaction(app, accessToken, created.id, 30);
    expect(overpay.status).toBe(400);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('PARTIALLY_PAID');
    expect(fetched.body.paidAmount).toBe(80);
  });

  it('rejects any further transaction once a payment is already PAID', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 100).expect(201);

    const extra = await recordTransaction(app, accessToken, created.id, 1);
    expect(extra.status).toBe(400);
  });
});
