import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

describe('Auth - Employee Accept Invitation & Set Password', () => {
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

  async function invite(email: string) {
    const { accessToken } = await registerAndLoginMerchant(app);
    const inviteResponse = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email })
      .expect(201);
    return inviteResponse.body.invitationToken as string;
  }

  it('accepts a valid invitation token', async () => {
    const invitationToken = await invite('accept1@test.local');

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/accept-invitation')
      .send({ invitationToken, password: 'StrongPass123' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
  });

  it('rejects accepting the same invitation twice', async () => {
    const invitationToken = await invite('accept2@test.local');

    await request(app.getHttpServer())
      .post('/api/auth/employee/accept-invitation')
      .send({ invitationToken, password: 'StrongPass123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/accept-invitation')
      .send({ invitationToken, password: 'StrongPass123' });

    expect(response.status).toBe(400);
  });

  it('rejects an unknown invitation token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/accept-invitation')
      .send({ invitationToken: 'not-a-real-token', password: 'StrongPass123' });

    expect(response.status).toBe(401);
  });

  it('rejects setting a password before the invitation is accepted', async () => {
    const invitationToken = await invite('accept3@test.local');

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/set-password')
      .send({ invitationToken, password: 'StrongPass123' });

    expect(response.status).toBe(400);
  });

  it('sets the password after acceptance, activating the employee', async () => {
    const invitationToken = await invite('accept4@test.local');

    await request(app.getHttpServer())
      .post('/api/auth/employee/accept-invitation')
      .send({ invitationToken, password: 'StrongPass123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/set-password')
      .send({ invitationToken, password: 'StrongPass123' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true });
  });

  it('rejects a password shorter than 8 characters on set-password', async () => {
    const invitationToken = await invite('accept5@test.local');

    await request(app.getHttpServer())
      .post('/api/auth/employee/accept-invitation')
      .send({ invitationToken, password: 'StrongPass123' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/set-password')
      .send({ invitationToken, password: 'short' });

    expect(response.status).toBe(400);
  });
});
