import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { installMockProvider } from '../../utils/mock-provider.util';

// The real ParamPosAdapter is an intentionally unimplemented stub (Phase 3 audit note),
// so a *successful* provider dispatch can only be exercised with a test-only mock provider
// swapped into the ProviderRegistry — see test/utils/mock-provider.util.ts.
describe('Provider - Dispatch', () => {
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

  it('dispatches a successful QR payment and returns the bank QR payload', async () => {
    installMockProvider(app);
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING');
    expect(response.body.qrData).toBe('mock-qr-payload');
    expect(response.body.qrExpiresAt).toEqual(expect.any(String));
  });

  it('dispatches a successful PAYMENT_LINK payment and returns the link URL', async () => {
    // Regression for the same class of bug fixed for QR in 92dc4bb: the provider's
    // createPaymentLink() result was being silently discarded (payment-engine.service.ts
    // only returned { success: true }), so a completed Payment Link could never actually
    // reach the merchant/employee app to deliver via SMS/WhatsApp/Copy Link.
    installMockProvider(app);
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'PAYMENT_LINK' });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('PENDING');
    expect(response.body.linkUrl).toBe('https://pay.example.test/mock-link');
    expect(response.body.linkExpiresAt).toEqual(expect.any(String));
  });

  it('does not leak qrData/linkUrl on a CASH payment', async () => {
    installMockProvider(app);
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' });

    expect(response.body.qrData).toBeUndefined();
    expect(response.body.linkUrl).toBeUndefined();
  });
});
