import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { installMockProvider } from '../../utils/mock-provider.util';
import {
  handoffQr,
  handoffTransaction,
  issuePartnerKey,
  mintHandoff,
  mintHandoffOk,
  readHandoffPayment,
  verifyAsPartner,
} from '../../utils/partner-flow.util';
import { HandoffSession } from '../../../src/modules/partner/entities/handoff-session.entity';
import { PaymentRequest } from '../../../src/modules/payment/entities/payment-request.entity';

// An order platform's courier never signs in (ADR-015). Their whole authorisation is a token
// their platform's backend minted, and it reaches exactly one payment request.
describe('Partner - Login-free Hand-off Collection', () => {
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

  it('mints a token the courier can read the payment with, without any account', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    const handoff = await mintHandoffOk(app, key.apiKey, 'UBER-4471', 250);

    expect(handoff.handoffToken).toMatch(/^hof_[0-9a-f]{16}_[0-9a-f]{64}$/);
    expect(handoff.totalAmount).toBe(250);

    const payment = await readHandoffPayment(app, handoff.handoffToken);

    expect(payment.status).toBe(200);
    expect(payment.body).toMatchObject({
      id: handoff.paymentRequestId,
      merchantId,
      externalOrderId: 'UBER-4471',
      totalAmount: 250,
      remainingAmount: 250,
      status: 'PENDING',
    });
  });

  it('opens the collection with no employee attached — no courier account exists', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    await mintHandoffOk(app, key.apiKey, 'UBER-1', 100);

    const dataSource = app.get(DataSource);
    const stored = await dataSource.getRepository(PaymentRequest).findOne({ where: { merchantId } });
    expect(stored?.employeeId).toBeNull();
  });

  it('collects cash, including in parts, and the platform sees the result', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'GETIR-9', 100);

    const partial = await handoffTransaction(app, handoff.handoffToken, 40);
    expect(partial.status).toBe(201);
    expect(partial.body.status).toBe('PARTIALLY_PAID');
    expect(partial.body.remainingAmount).toBe(60);

    const rest = await handoffTransaction(app, handoff.handoffToken, 60);
    expect(rest.body.status).toBe('PAID');

    const verified = await verifyAsPartner(app, key.apiKey, 'GETIR-9');
    expect(verified.body.status).toBe('PAID');
    expect(verified.body.paidAmount).toBe(100);
  });

  it('issues a bank QR for the remaining amount', async () => {
    const mock = installMockProvider(app);
    let requestedAmount: number | undefined;
    mock.generateBankQRImpl = async (qrRequest) => {
      requestedAmount = qrRequest.amount;
      return { qrData: 'mock-qr-payload' };
    };

    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'ORDER-QR', 100);

    await handoffTransaction(app, handoff.handoffToken, 30).expect(201);

    const qr = await handoffQr(app, handoff.handoffToken);

    expect(qr.status).toBe(201);
    expect(qr.body.qrData).toBe('mock-qr-payload');
    expect(requestedAmount).toBe(70);
  });

  it('mints the same collection for a repeated hand-off instead of a second charge', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    const first = await mintHandoffOk(app, key.apiKey, 'UBER-2', 100);
    await handoffTransaction(app, first.handoffToken, 40).expect(201);

    // The courier backed out and the platform app relaunched the hand-off.
    const second = await mintHandoffOk(app, key.apiKey, 'UBER-2', 100);

    expect(second.paymentRequestId).toBe(first.paymentRequestId);

    const payment = await readHandoffPayment(app, second.handoffToken);
    expect(payment.body.paidAmount).toBe(40);
    expect(payment.body.remainingAmount).toBe(60);

    const dataSource = app.get(DataSource);
    const stored = await dataSource.getRepository(PaymentRequest).find({ where: { merchantId } });
    expect(stored).toHaveLength(1);
  });

  it('rejects a missing, malformed, unknown or tampered token', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'ORDER-1', 100);

    const noToken = await request(app.getHttpServer()).get('/api/handoff/payment');
    expect(noToken.status).toBe(401);

    expect((await readHandoffPayment(app, 'garbage')).status).toBe(401);
    expect((await readHandoffPayment(app, `hof_${'a'.repeat(16)}_${'b'.repeat(64)}`)).status).toBe(401);

    // Same publicId so the row is found — only the secret check can reject this.
    const publicId = handoff.handoffToken.split('_')[1];
    expect((await readHandoffPayment(app, `hof_${publicId}_${'0'.repeat(64)}`)).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'ORDER-EXPIRY', 100);

    const dataSource = app.get(DataSource);
    await dataSource
      .getRepository(HandoffSession)
      .update({ paymentRequestId: handoff.paymentRequestId }, { expiresAt: new Date(Date.now() - 1000) });

    expect((await readHandoffPayment(app, handoff.handoffToken)).status).toBe(401);
    expect((await handoffTransaction(app, handoff.handoffToken, 10)).status).toBe(401);
  });

  it('cannot reach another order — the token carries its own scope', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    const first = await mintHandoffOk(app, key.apiKey, 'ORDER-A', 100);
    const second = await mintHandoffOk(app, key.apiKey, 'ORDER-B', 500);

    const payment = await readHandoffPayment(app, first.handoffToken);

    // There is no id anywhere in the request for a caller to substitute; the token decides.
    expect(payment.body.id).toBe(first.paymentRequestId);
    expect(payment.body.id).not.toBe(second.paymentRequestId);
    expect(payment.body.totalAmount).toBe(100);
  });

  it('refuses to mint without a valid partner API key', async () => {
    const noKey = await request(app.getHttpServer())
      .post('/api/partner/handoffs')
      .send({ externalOrderId: 'X', totalAmount: 100 });
    expect(noKey.status).toBe(401);

    const badKey = await mintHandoff(app, 'kpd_bad_key', 'X', 100);
    expect(badKey.status).toBe(401);
  });

  it('refuses to mint an order with no id or a non-positive amount', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    expect((await mintHandoff(app, key.apiKey, '', 100)).status).toBe(400);
    expect((await mintHandoff(app, key.apiKey, 'ORDER-1', 0)).status).toBe(400);
    expect((await mintHandoff(app, key.apiKey, 'ORDER-1', -5)).status).toBe(400);
  });

  it('stops the courier once the collection is complete', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'ORDER-DONE', 50);

    await handoffTransaction(app, handoff.handoffToken, 50).expect(201);

    const overpay = await handoffTransaction(app, handoff.handoffToken, 10);
    expect(overpay.status).toBe(400);
  });
});
