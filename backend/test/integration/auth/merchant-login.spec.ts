import { INestApplication } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { buildMerchantPayload } from '../../factories/merchant.factory';

describe('Auth - Merchant Login', () => {
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

  it('logs in with correct credentials and returns a merchant-scoped JWT', async () => {
    const payload = buildMerchantPayload();
    await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload).expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/merchant/login')
      .send({ email: payload.email, password: payload.password });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));

    const decoded = decode(response.body.accessToken) as { type: string; role: string; sub: string };
    expect(decoded.type).toBe('merchant');
    expect(decoded.role).toBe('OWNER');
    expect(decoded.sub).toEqual(expect.any(String));
  });

  it('rejects an incorrect password', async () => {
    const payload = buildMerchantPayload();
    await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload).expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/merchant/login')
      .send({ email: payload.email, password: 'WrongPassword123' });

    expect(response.status).toBe(401);
  });

  it('rejects an email that does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/merchant/login')
      .send({ email: 'no-such-merchant@test.local', password: 'StrongPass123' });

    expect(response.status).toBe(401);
  });

  it('rejects a missing password', async () => {
    const payload = buildMerchantPayload();
    await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload).expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/merchant/login')
      .send({ email: payload.email });

    expect(response.status).toBe(400);
  });
});
