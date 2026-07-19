import { INestApplication } from '@nestjs/common';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';

// One PaymentRequest may be completed by multiple Transactions of different PaymentMethods
// (ADR-001, CLAUDE.md's Hybrid Payments examples: QR + Cash, NFC + Cash, QR + NFC, Cash +
// Payment Link). recordTransaction never dispatches to a provider, so every combination
// below is testable today even though the QR/PAYMENT_LINK *creation-time* provider
// dispatch itself is still an unimplemented ParamPOS stub (see Phase 3 notes) — the
// PaymentRequest here is created as CASH purely as a provider-free vehicle; what's under
// test is that a single PaymentRequest correctly accumulates Transactions of differing
// PaymentMethods.
describe('Transaction - Hybrid Payments', () => {
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

  it.each([
    ['QR', 'CASH'],
    ['NFC', 'CASH'],
    ['QR', 'NFC'],
    ['CASH', 'PAYMENT_LINK'],
  ])('completes a payment with %s + %s', async (methodA, methodB) => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    await recordTransaction(app, accessToken, created.id, 60, methodA).expect(201);
    const final = await recordTransaction(app, accessToken, created.id, 40, methodB);

    expect(final.status).toBe(201);
    expect(final.body.status).toBe('PAID');
    expect(final.body.paidAmount).toBe(100);
    expect(final.body.transactions).toHaveLength(2);

    const methods = final.body.transactions.map((t: { paymentMethod: string }) => t.paymentMethod).sort();
    expect(methods).toEqual([methodA, methodB].sort());
  });

  it('completes a three-way hybrid payment (QR + NFC + Cash)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 90);

    await recordTransaction(app, accessToken, created.id, 30, 'QR').expect(201);
    await recordTransaction(app, accessToken, created.id, 30, 'NFC').expect(201);
    const final = await recordTransaction(app, accessToken, created.id, 30, 'CASH');

    expect(final.body.status).toBe('PAID');
    expect(final.body.paidAmount).toBe(90);
    expect(final.body.transactions).toHaveLength(3);
  });

  it('keeps each transaction\'s own paymentMethod independent of the PaymentRequest\'s original paymentMethod', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 50); // PaymentRequest.paymentMethod = CASH

    const response = await recordTransaction(app, accessToken, created.id, 50, 'QR');

    expect(response.body.paymentMethod).toBe('CASH'); // unchanged original method on the PaymentRequest
    expect(response.body.transactions[0].paymentMethod).toBe('QR'); // the transaction's own method
  });
});
