import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';
import { Transaction } from '../../../src/modules/transaction/entities/transaction.entity';

// Regression for #11 "Add idempotency protection for provider references" (c5273b7),
// specifically under real concurrency rather than the sequential replay already covered in
// Phase 5's transaction-methods.spec.ts. The idempotency check (find-by-providerReference)
// happens inside the same pessimistic_write-locked section as the insert, so two truly
// concurrent submissions of the same providerReference must still only produce one row.
describe('Race - Concurrent Idempotent providerReference', () => {
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

  it('records only one transaction when the same providerReference is submitted concurrently', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    const providerReference = 'concurrent-idempotency-check';

    const results = await Promise.all([
      recordTransaction(app, accessToken, created.id, 40, 'QR', providerReference),
      recordTransaction(app, accessToken, created.id, 40, 'QR', providerReference),
    ]);

    expect(results[0].status).toBe(201);
    expect(results[1].status).toBe(201);

    const dataSource = app.get(DataSource);
    const transactions = await dataSource.getRepository(Transaction).find({
      where: { paymentRequestId: created.id, providerReference },
    });

    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(40);
  });
});
