import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import {
  handoffTransaction,
  issuePartnerKey,
  mintHandoffOk,
  verifyAsPartner,
} from '../../utils/partner-flow.util';

// The order platform decides whether a delivery may be completed from what this endpoint says,
// not from what the courier's device claims (ADR-015).
describe('Partner - Payment Verification', () => {
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

  it('reports a hand-off collection by the platform\'s own order id', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    await mintHandoffOk(app, key.apiKey, 'UBER-4471', 250);

    const response = await verifyAsPartner(app, key.apiKey, 'UBER-4471');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      merchantId,
      externalOrderId: 'UBER-4471',
      totalAmount: 250,
      paidAmount: 0,
      remainingAmount: 250,
      status: 'PENDING',
    });
  });

  it('reports the hybrid breakdown so the platform sees what was actually collected', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'GETIR-9', 100);

    await handoffTransaction(app, handoff.handoffToken, 40, 'CASH').expect(201);
    await handoffTransaction(app, handoff.handoffToken, 60, 'QR').expect(201);

    const response = await verifyAsPartner(app, key.apiKey, 'GETIR-9');

    expect(response.body.status).toBe('PAID');
    expect(response.body.paidAmount).toBe(100);
    expect(response.body.remainingAmount).toBe(0);
    expect(response.body.transactions).toHaveLength(2);
    expect(response.body.transactions.map((t: { paymentMethod: string }) => t.paymentMethod).sort()).toEqual([
      'CASH',
      'QR',
    ]);
  });

  it('still reports what is outstanding while only part of the order has been collected', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    const handoff = await mintHandoffOk(app, key.apiKey, 'ORDER-PARTIAL', 100);

    await handoffTransaction(app, handoff.handoffToken, 30).expect(201);

    const response = await verifyAsPartner(app, key.apiKey, 'ORDER-PARTIAL');

    expect(response.body.status).toBe('PARTIALLY_PAID');
    expect(response.body.remainingAmount).toBe(70);
  });

  it('rejects a missing, malformed or unknown key', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    await mintHandoffOk(app, key.apiKey, 'ORDER-1', 100);

    const noKey = await request(app.getHttpServer())
      .get('/api/partner/payments')
      .query({ externalOrderId: 'ORDER-1' });
    expect(noKey.status).toBe(401);

    expect((await verifyAsPartner(app, 'not-a-key', 'ORDER-1')).status).toBe(401);
    expect((await verifyAsPartner(app, `pay_${'a'.repeat(16)}_${'b'.repeat(64)}`, 'ORDER-1')).status).toBe(401);
  });

  it('rejects a key whose secret has been tampered with', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);
    await mintHandoffOk(app, key.apiKey, 'ORDER-1', 100);

    // Same publicId, so the row is found — only the secret check can reject this.
    const tampered = `pay_${key.publicId}_${'0'.repeat(64)}`;

    expect((await verifyAsPartner(app, tampered, 'ORDER-1')).status).toBe(401);
  });

  it('cannot read another merchant\'s order even when the order id matches', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const keyA = await issuePartnerKey(app, ownerA.accessToken);
    const keyB = await issuePartnerKey(app, ownerB.accessToken);

    await mintHandoffOk(app, keyA.apiKey, 'SHARED-ID', 100);

    expect((await verifyAsPartner(app, keyB.apiKey, 'SHARED-ID')).status).toBe(404);
  });

  it('rejects a request with no externalOrderId, and 404s an unknown one', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    const missing = await request(app.getHttpServer())
      .get('/api/partner/payments')
      .set('X-Api-Key', key.apiKey);
    expect(missing.status).toBe(400);

    expect((await verifyAsPartner(app, key.apiKey, 'NEVER-CREATED')).status).toBe(404);
  });
});
