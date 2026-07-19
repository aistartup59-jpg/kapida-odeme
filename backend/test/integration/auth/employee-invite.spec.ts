import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Auth - Employee Invite', () => {
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

  it('lets the owner invite a new employee', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'invitee@test.local' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.invitationToken).toEqual(expect.any(String));
    expect(response.body.employeeId).toEqual(expect.any(String));
    expect(response.body.expiresAt).toEqual(expect.any(String));
  });

  it('rejects a duplicate employee email', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'invitee@test.local' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'invitee@test.local' });

    expect(response.status).toBe(409);
  });

  it('rejects an invalid email format', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'not-an-email' });

    expect(response.status).toBe(400);
  });
});
