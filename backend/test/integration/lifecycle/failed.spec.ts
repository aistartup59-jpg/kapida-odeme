import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerAndActivateProvider } from '../../utils/provider-flow.util';
import { PaymentRequest } from '../../../src/modules/payment/entities/payment-request.entity';

describe('Payment Lifecycle - Failed', () => {
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

  it('transitions the PaymentRequest to FAILED when provider dispatch fails, rather than leaving it stuck at PENDING', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    await registerAndActivateProvider(app, accessToken, { providerType: 'PARAM_POS' });

    const createResponse = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'QR' });

    expect(createResponse.status).toBe(400);

    const dataSource = app.get(DataSource);
    const paymentRequests = await dataSource.getRepository(PaymentRequest).find({ where: { merchantId } });

    expect(paymentRequests).toHaveLength(1);
    expect(paymentRequests[0].status).toBe('FAILED');
  });
});
