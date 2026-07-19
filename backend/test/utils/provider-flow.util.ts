import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface RegisteredProvider {
  id: string;
  providerType: string;
  isActive: boolean;
}

export async function registerProvider(
  app: INestApplication,
  accessToken: string,
  overrides: { providerType?: string; credentials?: Record<string, string> } = {},
): Promise<RegisteredProvider> {
  const response = await request(app.getHttpServer())
    .post('/api/merchant/payment-providers')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      providerType: overrides.providerType ?? 'PARAM_POS',
      credentials: overrides.credentials ?? { apiKey: 'test-api-key', apiSecret: 'test-api-secret' },
    })
    .expect(201);

  return response.body as RegisteredProvider;
}

export async function registerAndActivateProvider(
  app: INestApplication,
  accessToken: string,
  overrides: { providerType?: string; credentials?: Record<string, string> } = {},
): Promise<RegisteredProvider> {
  const provider = await registerProvider(app, accessToken, overrides);

  const response = await request(app.getHttpServer())
    .post(`/api/merchant/payment-providers/${provider.id}/activate`)
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(201);

  return response.body as RegisteredProvider;
}
