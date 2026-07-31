import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { installMockProvider } from '../../utils/mock-provider.util';
import { createCashPayment, recordTransaction } from '../../utils/payment-flow.util';
import { PaymentRequest } from '../../../src/modules/payment/entities/payment-request.entity';
import { ProviderAuthenticationException } from '../../../src/modules/payment-provider/common/exceptions/provider-authentication.exception';

// A collection is opened before anyone knows how the customer will pay, so the bank QR has to
// be issuable afterwards — and after a partial cash payment it must cover what is actually
// left, never the original total.
describe('Payment - On-demand Bank QR', () => {
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

  const issueQr = (accessToken: string, paymentRequestId: string) =>
    request(app.getHttpServer())
      .post(`/api/payments/${paymentRequestId}/qr`)
      .set('Authorization', `Bearer ${accessToken}`);

  it('issues a bank QR for a collection that was opened as CASH', async () => {
    installMockProvider(app);
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const created = await createCashPayment(app, accessToken, 100);

    const response = await issueQr(accessToken, created.id);

    expect(response.status).toBe(201);
    expect(response.body.qrData).toBe('mock-qr-payload');
    expect(response.body.qrExpiresAt).toEqual(expect.any(String));
  });

  it('asks the provider for the remaining amount, not the original total', async () => {
    const mock = installMockProvider(app);
    let requestedAmount: number | undefined;
    mock.generateBankQRImpl = async (qrRequest) => {
      requestedAmount = qrRequest.amount;
      return { qrData: 'mock-qr-payload' };
    };

    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 40, 'CASH').expect(201);

    await issueQr(accessToken, created.id).expect(201);

    expect(requestedAmount).toBe(60);
  });

  it('refuses once nothing is left to collect', async () => {
    installMockProvider(app);
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const created = await createCashPayment(app, accessToken, 100);
    await recordTransaction(app, accessToken, created.id, 100, 'CASH').expect(201);

    const response = await issueQr(accessToken, created.id);

    expect(response.status).toBe(400);
  });

  it('refuses on a cancelled collection', async () => {
    installMockProvider(app);
    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const created = await createCashPayment(app, accessToken, 100);

    await request(app.getHttpServer())
      .post(`/api/payments/${created.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const response = await issueQr(accessToken, created.id);
    expect(response.status).toBe(400);
  });

  // Unlike creation-time QR, a failure here must not kill the collection: the request was not
  // born for QR, and the courier can still take the money in cash.
  it('leaves the collection collectable when the provider rejects the QR', async () => {
    const mock = installMockProvider(app);
    mock.generateBankQRImpl = async () => {
      throw new ProviderAuthenticationException('Mock credentials rejected by provider.');
    };

    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });
    const created = await createCashPayment(app, accessToken, 100);

    const response = await issueQr(accessToken, created.id);
    expect(response.status).toBe(400);

    const dataSource = app.get(DataSource);
    const stored = await dataSource.getRepository(PaymentRequest).findOne({ where: { merchantId } });
    expect(stored?.status).toBe('PENDING');

    await recordTransaction(app, accessToken, created.id, 100, 'CASH').expect(201);
  });

  it('404s when the merchant has no active provider', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const response = await issueQr(accessToken, created.id);
    expect(response.status).toBe(404);
  });

  it('cannot issue a QR against another merchant\'s collection', async () => {
    installMockProvider(app);
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, ownerA.accessToken, 100);

    const response = await issueQr(ownerB.accessToken, created.id);
    expect(response.status).toBe(401);
  });

  it('rejects an unauthenticated caller', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const created = await createCashPayment(app, accessToken, 100);

    const response = await request(app.getHttpServer()).post(`/api/payments/${created.id}/qr`);
    expect(response.status).toBe(401);
  });
});
