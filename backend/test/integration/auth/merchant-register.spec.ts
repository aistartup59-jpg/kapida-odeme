import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { buildMerchantPayload } from '../../factories/merchant.factory';

describe('Auth - Merchant Register', () => {
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

  it('registers a new merchant', async () => {
    const payload = buildMerchantPayload();

    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
  });

  it('rejects a duplicate email', async () => {
    const payload = buildMerchantPayload();
    await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload).expect(201);

    const duplicate = buildMerchantPayload({ email: payload.email });
    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(duplicate);

    expect(response.status).toBe(409);
  });

  it('rejects a duplicate phone number', async () => {
    const payload = buildMerchantPayload();
    await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload).expect(201);

    const duplicate = buildMerchantPayload({ phoneNumber: payload.phoneNumber });
    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(duplicate);

    expect(response.status).toBe(409);
  });

  it('rejects a missing required field', async () => {
    const payload = buildMerchantPayload();
    delete (payload as Partial<typeof payload>).businessName;

    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload);

    expect(response.status).toBe(400);
  });

  it('rejects a password shorter than 8 characters', async () => {
    const payload = buildMerchantPayload({ password: 'short' });

    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload);

    expect(response.status).toBe(400);
  });

  it('rejects an invalid email format', async () => {
    const payload = buildMerchantPayload({ email: 'not-an-email' });

    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload);

    expect(response.status).toBe(400);
  });

  it('rejects unknown fields due to whitelist validation', async () => {
    const payload = { ...buildMerchantPayload(), merchantId: 'client-supplied-id' };

    const response = await request(app.getHttpServer()).post('/api/auth/merchant/register').send(payload);

    expect(response.status).toBe(400);
  });
});
