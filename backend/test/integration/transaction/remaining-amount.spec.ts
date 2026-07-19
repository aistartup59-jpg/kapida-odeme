import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

describe('Transaction - Remaining Amount (ADR-002: always derived, never stored)', () => {
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

  it('equals totalAmount minus the sum of recorded transactions', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 200);

    await recordTransaction(app, accessToken, created.id, 75, 'CASH').expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.remainingAmount).toBe(125);
  });

  it('does not drift due to floating-point arithmetic (regression for 4c764a9)', async () => {
    // 19.9 - 19.1 in plain JS float arithmetic produces 0.7999999999999989, not 0.8.
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 19.9);

    await recordTransaction(app, accessToken, created.id, 19.1, 'CASH').expect(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.remainingAmount).toBe(0.8);
    expect(fetched.body.status).toBe('PARTIALLY_PAID');
  });

  it('reaches exactly zero when fully paid via several odd-cent partial transactions', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 10);

    await recordTransaction(app, accessToken, created.id, 3.33, 'CASH').expect(201);
    await recordTransaction(app, accessToken, created.id, 3.33, 'CASH').expect(201);
    const final = await recordTransaction(app, accessToken, created.id, 3.34, 'CASH');

    expect(final.body.remainingAmount).toBe(0);
    expect(final.body.status).toBe('PAID');
  });

  it('never goes negative and is clamped at 0 once fully paid', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 50);

    const response = await recordTransaction(app, accessToken, created.id, 50, 'CASH');

    expect(response.body.remainingAmount).toBe(0);
  });
});
