import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

describe('Transaction - paidAmount & paidAt', () => {
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

  it('starts paidAmount at 0 and paidAt at null on a freshly created payment request', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    expect(created.paidAmount).toBe(0);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.paidAt).toBeNull();
  });

  it('advances paidAmount by exactly each transaction amount, and leaves paidAt null while partially paid', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const first = await recordTransaction(app, accessToken, created.id, 30, 'CASH');
    expect(first.body.paidAmount).toBe(30);
    expect(first.body.paidAt).toBeNull();

    const second = await recordTransaction(app, accessToken, created.id, 25, 'CASH');
    expect(second.body.paidAmount).toBe(55);
    expect(second.body.paidAt).toBeNull();
  });

  it('sets paidAt exactly once, on the transaction that first reaches PAID', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 40, 'CASH').expect(201);
    const final = await recordTransaction(app, accessToken, created.id, 60, 'CASH');

    expect(final.body.status).toBe('PAID');
    expect(final.body.paidAmount).toBe(100);
    expect(final.body.paidAt).toEqual(expect.any(String));
  });

  it('preserves paidAmount exactly when a partially paid request is later cancelled (ADR-012)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 35, 'CASH').expect(201);

    await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('CANCELLED');
    expect(fetched.body.paidAmount).toBe(35);
  });
});
