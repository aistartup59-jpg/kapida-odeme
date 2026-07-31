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

  // QR is the only method that reaches the provider at creation time (ADR-013): CASH never
  // involves one, and an NFC card is read by the POS device and reported afterwards as a
  // Transaction, so neither may carry a provider-issued QR payload back to the caller.
  it.each(['CASH', 'NFC'])('does not dispatch to the provider or return qrData for %s', async (paymentMethod) => {
    const mock = installMockProvider(app);
    const generateBankQR = jest.spyOn(mock, 'generateBankQRImpl');
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod });

    expect(response.status).toBe(201);
    expect(response.body.qrData).toBeUndefined();
    expect(generateBankQR).not.toHaveBeenCalled();
  });
});
