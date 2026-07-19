import { INestApplication } from '@nestjs/common';
import { decode } from 'jsonwebtoken';
import * as request from 'supertest';

import { buildMerchantPayload, MerchantRegisterPayload } from '../factories/merchant.factory';

export interface RegisteredMerchant {
  payload: MerchantRegisterPayload;
  merchantId: string;
  accessToken: string;
  refreshToken: string;
}

export async function registerAndLoginMerchant(
  app: INestApplication,
  overrides: Partial<MerchantRegisterPayload> = {},
): Promise<RegisteredMerchant> {
  const payload = buildMerchantPayload(overrides);
  const server = app.getHttpServer();

  await request(server).post('/api/auth/merchant/register').send(payload).expect(201);

  const loginResponse = await request(server)
    .post('/api/auth/merchant/login')
    .send({ email: payload.email, password: payload.password })
    .expect(201);

  const { accessToken, refreshToken } = loginResponse.body;
  const decoded = decode(accessToken) as { sub: string };

  return { payload, merchantId: decoded.sub, accessToken, refreshToken };
}

export interface ActivatedEmployee {
  employeeId: string;
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export async function inviteAndActivateEmployee(
  app: INestApplication,
  ownerAccessToken: string,
  overrides: { email?: string; password?: string } = {},
): Promise<ActivatedEmployee> {
  const server = app.getHttpServer();
  const email = overrides.email ?? `employee${Date.now()}${Math.random().toString(16).slice(2)}@test.local`;
  const password = overrides.password ?? 'StrongPass123';

  const inviteResponse = await request(server)
    .post('/api/auth/employee')
    .set('Authorization', `Bearer ${ownerAccessToken}`)
    .send({ email })
    .expect(201);

  const { invitationToken, employeeId } = inviteResponse.body;

  await request(server)
    .post('/api/auth/employee/accept-invitation')
    .send({ invitationToken, password })
    .expect(201);

  await request(server)
    .post('/api/auth/employee/set-password')
    .send({ invitationToken, password })
    .expect(201);

  const loginResponse = await request(server)
    .post('/api/auth/employee/login')
    .send({ email, password })
    .expect(201);

  const { accessToken, refreshToken } = loginResponse.body;

  return { employeeId, email, password, accessToken, refreshToken };
}
