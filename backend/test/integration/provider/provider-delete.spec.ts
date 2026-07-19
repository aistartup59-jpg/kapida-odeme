import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';

// DELETE /merchant/payment-providers/:id had zero prior test coverage (Phase 2 only
// covered Create/Update/Activate/Resolve) — closing that gap here.
describe('Merchant Provider - Delete', () => {
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

  it('deletes a provider belonging to the authenticated merchant', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);

    const response = await request(app.getHttpServer())
      .delete(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    const list = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(list.body).toHaveLength(0);
  });

  it('returns 401 for an unauthenticated delete', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);

    const response = await request(app.getHttpServer()).delete(`/api/merchant/payment-providers/${provider.id}`);

    expect(response.status).toBe(401);
  });

  it('returns 404 when deleting a different merchant\'s provider', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, ownerA.accessToken);

    const response = await request(app.getHttpServer())
      .delete(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`);

    expect(response.status).toBe(404);

    const stillThere = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${ownerA.accessToken}`);
    expect(stillThere.body).toHaveLength(1);
  });

  it('returns 404 for an unknown provider id', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .delete('/api/merchant/payment-providers/11111111-1111-1111-1111-111111111111')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it('returns 400 (not 500) for a malformed provider id', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .delete('/api/merchant/payment-providers/not-a-uuid')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
  });
});
