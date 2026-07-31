import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { issuePartnerKey, mintHandoff, mintHandoffOk } from '../../utils/partner-flow.util';
import { PaymentRequest } from '../../../src/modules/payment/entities/payment-request.entity';

// A hand-off can be minted more than once for the same delivery — the courier backs out, the
// platform retries, the link is tapped twice (ADR-015). Every one of those paths has to land
// on the same PaymentRequest, because the alternative is charging the customer twice.
describe('Payment - External Order Id', () => {
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

  it('opens exactly one PaymentRequest when the same order is minted concurrently', async () => {
    const { accessToken, merchantId } = await registerAndLoginMerchant(app);
    const key = await issuePartnerKey(app, accessToken);

    const results = await Promise.all([
      mintHandoff(app, key.apiKey, 'UBER-RACE', 100),
      mintHandoff(app, key.apiKey, 'UBER-RACE', 100),
      mintHandoff(app, key.apiKey, 'UBER-RACE', 100),
    ]);

    for (const result of results) {
      expect(result.status).toBe(201);
    }

    const ids = new Set(results.map((result) => result.body.paymentRequestId));
    expect(ids.size).toBe(1);

    const dataSource = app.get(DataSource);
    const stored = await dataSource.getRepository(PaymentRequest).find({ where: { merchantId } });
    expect(stored).toHaveLength(1);
  });

  it('scopes the order id per merchant, so two platforms\' identical ids never collide', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const keyA = await issuePartnerKey(app, ownerA.accessToken);
    const keyB = await issuePartnerKey(app, ownerB.accessToken);

    const a = await mintHandoffOk(app, keyA.apiKey, 'ORDER-7', 100);
    const b = await mintHandoffOk(app, keyB.apiKey, 'ORDER-7', 300);

    expect(a.paymentRequestId).not.toBe(b.paymentRequestId);
    expect(b.totalAmount).toBe(300);
  });

  it('leaves ordinary in-app collections unconstrained', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    // A business keying an amount in carries no order id at all: two walk-up collections for
    // the same amount are two separate payments, and the partial unique index must not treat
    // them as duplicates.
    const first = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 50, paymentMethod: 'CASH' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 50, paymentMethod: 'CASH' })
      .expect(201);

    expect(first.body.id).not.toBe(second.body.id);
    expect(first.body.externalOrderId).toBeNull();
  });

  it('does not let a signed-in caller claim a platform order id', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    // externalOrderId belongs to the partner channel, where the amount is authorised by the
    // platform's backend. Accepting it here would let a client attach itself to an order it
    // does not own.
    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ totalAmount: 50, paymentMethod: 'CASH', externalOrderId: 'UBER-1' });

    expect(response.status).toBe(400);
  });
});
