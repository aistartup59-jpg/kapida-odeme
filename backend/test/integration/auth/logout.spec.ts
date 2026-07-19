import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Auth - Logout (Merchant)', () => {
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

  it('revokes the merchant session so its refresh token stops working', async () => {
    const { accessToken, refreshToken } = await registerAndLoginMerchant(app);

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutResponse.status).toBe(201);
    expect(logoutResponse.body).toEqual({ success: true });

    const refreshAfterLogout = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });

  it('rejects logout without an access token', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/logout');

    expect(response.status).toBe(401);
  });

  it('rejects a second logout of an already-revoked session', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const secondLogout = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(secondLogout.status).toBe(401);
  });
});
