import { INestApplication } from '@nestjs/common';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

// recordTransaction never dispatches to a provider (that only happens at PaymentRequest
// creation time for QR/PAYMENT_LINK, per payment-engine.service.ts's
// requiresProviderExecution) — it purely books a reported payment event against a
// PaymentRequest. Any of the four PaymentMethod values can be recorded here regardless of
// which provider is (or isn't) configured, which is what makes Hybrid Payments possible.
describe('Transaction - Payment Methods', () => {
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

  it.each(['CASH', 'NFC', 'QR', 'PAYMENT_LINK'])('records a %s transaction', async (paymentMethod) => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const response = await recordTransaction(app, accessToken, created.id, 100, paymentMethod);

    expect(response.status).toBe(201);
    expect(response.body.transactions).toHaveLength(1);
    expect(response.body.transactions[0].paymentMethod).toBe(paymentMethod);
    expect(response.body.status).toBe('PAID');
  });

  it('rejects an invalid transaction paymentMethod', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const response = await recordTransaction(app, accessToken, created.id, 100, 'BITCOIN');

    expect(response.status).toBe(400);
  });

  it('rejects a missing or non-positive amount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const zero = await recordTransaction(app, accessToken, created.id, 0, 'CASH');
    expect(zero.status).toBe(400);

    const negative = await recordTransaction(app, accessToken, created.id, -10, 'CASH');
    expect(negative.status).toBe(400);
  });

  it('returns 404 when recording a transaction against an unknown payment request', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await recordTransaction(app, accessToken, '11111111-1111-1111-1111-111111111111', 50, 'CASH');

    expect(response.status).toBe(404);
  });

  it('replays an idempotent providerReference instead of double-recording it', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    const providerReference = 'provider-ref-idempotency-check';

    await recordTransaction(app, accessToken, created.id, 40, 'CASH').expect(201);

    const attempt1 = await recordTransaction(app, accessToken, created.id, 20, 'QR', providerReference);
    expect(attempt1.status).toBe(201);

    const attempt2 = await recordTransaction(app, accessToken, created.id, 20, 'QR', providerReference);
    expect(attempt2.status).toBe(201);

    expect(attempt2.body.paidAmount).toBe(60);
    expect(attempt2.body.transactions).toHaveLength(2);
  });

  it('rejects replaying a providerReference with a different amount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);
    const providerReference = 'provider-ref-conflict-check';

    await recordTransaction(app, accessToken, created.id, 20, 'QR', providerReference).expect(201);

    const conflicting = await recordTransaction(app, accessToken, created.id, 30, 'QR', providerReference);
    expect(conflicting.status).toBe(400);
  });
});
