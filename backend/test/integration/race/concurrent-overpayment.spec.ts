import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';
import { Transaction } from '../../../src/modules/transaction/entities/transaction.entity';

// Regression for #9 "Prevent concurrent overpayment race" (18733d6) and #4 "Wrap
// transaction and lifecycle update in a single DB transaction" (9fe3157). Before those
// fixes, two concurrent createTransaction calls could each read the same stale paidAmount,
// independently pass the overpayment check, and together exceed totalAmount.
// transaction-engine.service.ts's pessimistic_write lock on the PaymentRequest row is what
// serializes this — this test only proves anything if the two requests genuinely overlap.
describe('Race - Concurrent Overpayment', () => {
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

  it('allows only one of two concurrent transactions that would together overpay', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    // Each individually fits under totalAmount (60 <= 100), but together they exceed it
    // (120 > 100) — only the lock correctly serializing the two prevents both succeeding.
    const [resultA, resultB] = await Promise.all([
      recordTransaction(app, accessToken, created.id, 60, 'CASH'),
      recordTransaction(app, accessToken, created.id, 60, 'CASH'),
    ]);

    const statuses = [resultA.status, resultB.status].sort();
    expect(statuses).toEqual([201, 400]);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.paidAmount).toBe(60);
    expect(fetched.body.status).toBe('PARTIALLY_PAID');
    expect(fetched.body.transactions).toHaveLength(1);
  });

  it('never leaves an orphan Transaction row for the rejected overpayment attempt (atomicity)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await Promise.all([
      recordTransaction(app, accessToken, created.id, 70, 'CASH'),
      recordTransaction(app, accessToken, created.id, 70, 'CASH'),
    ]);

    const dataSource = app.get(DataSource);
    const transactions = await dataSource.getRepository(Transaction).find({ where: { paymentRequestId: created.id } });

    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(70);
  });

  it('serializes three concurrent transactions that would only fit two at a time', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const results = await Promise.all([
      recordTransaction(app, accessToken, created.id, 50, 'CASH'),
      recordTransaction(app, accessToken, created.id, 50, 'CASH'),
      recordTransaction(app, accessToken, created.id, 50, 'CASH'),
    ]);

    const succeeded = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 400);
    expect(succeeded).toHaveLength(2);
    expect(rejected).toHaveLength(1);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.paidAmount).toBe(100);
    expect(fetched.body.status).toBe('PAID');
  });
});
