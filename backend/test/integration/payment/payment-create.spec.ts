import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';

describe('Payment - Create', () => {
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

  it('creates a CASH payment request with no provider involved', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      merchantId,
      employeeId: null,
      totalAmount: 100,
      paidAmount: 0,
      remainingAmount: 100,
      currency: 'TRY',
      paymentMethod: 'CASH',
      deliveryChannel: 'NONE',
      status: 'PENDING',
    });
    expect(response.body.qrData).toBeUndefined();
  });

  it('creates an NFC payment request with no provider involved', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 50, paymentMethod: 'NFC' });

    expect(response.status).toBe(201);
    expect(response.body.paymentMethod).toBe('NFC');
    expect(response.body.status).toBe('PENDING');
  });

  it('rejects QR payment creation when the merchant has no active provider', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' });

    expect(response.status).toBe(404);
  });

  it('fails a QR payment gracefully when the active provider does not implement bank QR generation yet', async () => {
    // ParamPosAdapter.generateBankQR is an honest NotImplementedException stub pending the
    // real sandbox contract (see Phase 3 audit notes) — this documents current expected
    // behavior (a controlled 400, not a crash), not a bug to fix here.
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' });

    expect(response.status).toBe(400);
  });

  it('applies default currency (TRY) and deliveryChannel (NONE) when omitted', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 75, paymentMethod: 'CASH' });

    expect(response.body.currency).toBe('TRY');
    expect(response.body.deliveryChannel).toBe('NONE');
  });

  it('accepts an explicit currency and deliveryChannel', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 75, paymentMethod: 'CASH', currency: 'USD', deliveryChannel: 'SMS' });

    expect(response.body.currency).toBe('USD');
    expect(response.body.deliveryChannel).toBe('SMS');
  });
});
