import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

// Regression for the pessimistic_write lock payment-engine.service.ts's cancelPayment()
// shares with transaction-engine.service.ts's createTransaction() — the two must serialize
// against the same PaymentRequest row (see that lock's own code comment about racing a
// concurrent createTransaction call and silently overwriting its committed paidAmount).
describe('Race - Concurrent Cancel', () => {
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

  it('two concurrent cancels on a PENDING request both succeed idempotently, ending CANCELLED', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const [resultA, resultB] = await Promise.all([
      request(app.getHttpServer()).post(`/api/payments/${created.id}/cancel`).set('Authorization', `Bearer ${accessToken}`),
      request(app.getHttpServer()).post(`/api/payments/${created.id}/cancel`).set('Authorization', `Bearer ${accessToken}`),
    ]);

    expect(resultA.status).toBe(201);
    expect(resultB.status).toBe(201);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('CANCELLED');
  });

  it('a concurrent cancel and recordTransaction always end CANCELLED, with paidAmount reflecting exactly which one committed first', async () => {
    // Both PENDING->CANCELLED and PARTIALLY_PAID->CANCELLED are legal transitions, so the
    // cancel always eventually succeeds regardless of which request wins the row lock first.
    // If the transaction commits first, cancel runs against PARTIALLY_PAID and preserves
    // paidAmount (ADR-012). If cancel commits first, the transaction's own attempted
    // PENDING(now CANCELLED)->PARTIALLY_PAID transition is illegal and it is rejected —
    // proving the lock genuinely serialized the two rather than letting them interleave.
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const [cancelResult, transactionResult] = await Promise.all([
      request(app.getHttpServer()).post(`/api/payments/${created.id}/cancel`).set('Authorization', `Bearer ${accessToken}`),
      recordTransaction(app, accessToken, created.id, 40, 'CASH'),
    ]);

    expect(cancelResult.status).toBe(201);
    expect([201, 400]).toContain(transactionResult.status);

    const fetched = await request(app.getHttpServer())
      .get(`/api/payments/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(fetched.body.status).toBe('CANCELLED');
    expect(fetched.body.paidAmount).toBe(transactionResult.status === 201 ? 40 : 0);
  });
});
