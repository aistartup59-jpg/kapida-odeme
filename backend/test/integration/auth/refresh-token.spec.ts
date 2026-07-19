import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Auth - Refresh Token (Merchant)', () => {
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

  it('issues a new access and refresh token pair', async () => {
    const { refreshToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).not.toBe(refreshToken);
  });

  it('rotates the refresh token so the old one can no longer be used', async () => {
    const { refreshToken } = await registerAndLoginMerchant(app);

    await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken }).expect(201);

    const reuse = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken });

    expect(reuse.status).toBe(401);
  });

  it('rejects an unknown refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken: 'not-a-real-refresh-token' });

    expect(response.status).toBe(401);
  });

  it('rejects a missing refresh token', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/refresh').send({});

    expect(response.status).toBe(400);
  });
});
