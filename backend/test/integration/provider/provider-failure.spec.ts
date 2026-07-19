import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { installMockProvider } from '../../utils/mock-provider.util';
import { PaymentRequest } from '../../../src/modules/payment/entities/payment-request.entity';
import { ProviderException } from '../../../src/modules/payment-provider/common/exceptions/provider.exception';
import { ProviderAuthenticationException } from '../../../src/modules/payment-provider/common/exceptions/provider-authentication.exception';

describe('Provider - Failure', () => {
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

  it('marks the payment request FAILED and returns a structured error when the provider throws a ProviderException', async () => {
    const mock = installMockProvider(app);
    mock.generateBankQRImpl = async () => {
      throw new ProviderAuthenticationException('Mock credentials rejected by provider.', 'AUTH_REJECTED');
    };

    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Mock credentials rejected by provider.');

    const dataSource = app.get(DataSource);
    const paymentRequests = await dataSource.getRepository(PaymentRequest).find({ where: { merchantId } });
    expect(paymentRequests).toHaveLength(1);
    expect(paymentRequests[0].status).toBe('FAILED');
  });

  it('marks the payment request FAILED when the provider throws a generic error (not a ProviderException)', async () => {
    const mock = installMockProvider(app);
    mock.createPaymentLinkImpl = async () => {
      throw new Error('Unexpected network timeout.');
    };

    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'PAYMENT_LINK' });

    expect(response.status).toBe(400);

    const dataSource = app.get(DataSource);
    const paymentRequests = await dataSource.getRepository(PaymentRequest).find({ where: { merchantId } });
    expect(paymentRequests[0].status).toBe('FAILED');
  });

  it('surfaces the ProviderException\'s providerCode and details in the execution error', async () => {
    const mock = installMockProvider(app);
    mock.generateBankQRImpl = async () => {
      throw new ProviderException('Amount exceeds provider limit.', 'AMOUNT_LIMIT_EXCEEDED', { limit: 5000 });
    };

    const { accessToken } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Amount exceeds provider limit.');
  });
});
