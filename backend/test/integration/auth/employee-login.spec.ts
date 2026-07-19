import { INestApplication } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant, inviteAndActivateEmployee } from '../../utils/auth-flow.util';

describe('Auth - Employee Login, Refresh, Logout', () => {
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

  it('logs in an activated employee and returns an employee-scoped JWT', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, ownerToken);

    const decoded = decode(employee.accessToken) as { type: string; role: string; sub: string };
    expect(decoded.type).toBe('employee');
    expect(decoded.role).toBe('EMPLOYEE');
    expect(decoded.sub).toBe(employee.employeeId);
  });

  it('rejects login before the invitation is activated', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'notyetactive@test.local' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/login')
      .send({ email: 'notyetactive@test.local', password: 'StrongPass123' });

    expect(response.status).toBe(401);
  });

  it('rejects an incorrect employee password', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, ownerToken);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/login')
      .send({ email: employee.email, password: 'WrongPassword123' });

    expect(response.status).toBe(401);
  });

  it('refreshes the employee token and rotates the refresh token', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, ownerToken);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/refresh')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ refreshToken: employee.refreshToken });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).not.toBe(employee.refreshToken);
  });

  it('rejects employee refresh without an access token', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, ownerToken);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee/refresh')
      .send({ refreshToken: employee.refreshToken });

    expect(response.status).toBe(401);
  });

  it('logs out the employee, revoking the session for future refreshes', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, ownerToken);

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/employee/logout')
      .set('Authorization', `Bearer ${employee.accessToken}`);

    expect(logoutResponse.status).toBe(201);

    const refreshAfterLogout = await request(app.getHttpServer())
      .post('/api/auth/employee/refresh')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ refreshToken: employee.refreshToken });

    expect(refreshAfterLogout.status).toBe(401);
  });

  it('does not let an employee session collide with the owner-only merchant session', async () => {
    const { accessToken: ownerToken, refreshToken: ownerRefreshToken } = await registerAndLoginMerchant(app);
    await inviteAndActivateEmployee(app, ownerToken);

    // The merchant's own refresh token must still work after an employee is created and logged in.
    const response = await request(app.getHttpServer()).post('/api/auth/refresh').send({ refreshToken: ownerRefreshToken });

    expect(response.status).toBe(201);
  });
});
