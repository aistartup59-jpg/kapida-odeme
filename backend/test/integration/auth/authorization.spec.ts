import { INestApplication } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant, inviteAndActivateEmployee } from '../../utils/auth-flow.util';
import { Employee } from '../../../src/modules/auth/entities/employee.entity';

describe('Auth - Authorization (JwtAuthGuard / RolesGuard)', () => {
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

  it('rejects a protected route with no Authorization header', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/logout');

    expect(response.status).toBe(401);
  });

  it('rejects a malformed bearer token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer this-is-not-a-jwt');

    expect(response.status).toBe(401);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const forgedToken = sign({ sub: 'whoever', type: 'merchant', role: 'OWNER' }, 'wrong-secret', { expiresIn: '15m' });

    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expiredToken = sign(
      { sub: 'whoever', type: 'merchant', role: 'OWNER' },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 },
    );

    const response = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('forbids a non-owner (employee) role from an owner-only route', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, ownerToken);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ email: 'another@test.local' });

    expect(response.status).toBe(403);
  });

  it('allows the owner role through an owner-only route', async () => {
    const { accessToken: ownerToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'yet-another@test.local' });

    expect(response.status).toBe(201);
  });

  it('scopes an employee invite to the acting owner\'s own merchant, never a different tenant', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);

    const inviteResponse = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${ownerA.accessToken}`)
      .send({ email: 'cross-tenant@test.local' })
      .expect(201);

    const dataSource = app.get(DataSource);
    const employee = await dataSource.getRepository(Employee).findOne({
      where: { id: inviteResponse.body.employeeId },
    });

    expect(employee?.merchantId).toBe(ownerA.merchantId);
    expect(employee?.merchantId).not.toBe(ownerB.merchantId);
  });

  it('rejects a client-supplied merchantId on employee invite (whitelist-only DTO)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/auth/employee')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'whitelist-check@test.local', merchantId: '11111111-1111-1111-1111-111111111111' });

    expect(response.status).toBe(400);
  });
});
