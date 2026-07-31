import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface IssuedPartnerKey {
  id: string;
  label: string;
  publicId: string;
  apiKey: string;
}

export interface MintedHandoff {
  paymentRequestId: string;
  externalOrderId: string;
  totalAmount: number;
  handoffToken: string;
  expiresAt: string;
}

export async function issuePartnerKey(
  app: INestApplication,
  merchantAccessToken: string,
  label = 'Test Platform',
): Promise<IssuedPartnerKey> {
  const response = await request(app.getHttpServer())
    .post('/api/merchant/partner-keys')
    .set('Authorization', `Bearer ${merchantAccessToken}`)
    .send({ label })
    .expect(201);

  return response.body as IssuedPartnerKey;
}

// What the order platform's backend does when an order is ready for delivery (ADR-015): mints
// a token for its courier's device. The API key is what makes the amount trustworthy.
export function mintHandoff(
  app: INestApplication,
  apiKey: string,
  externalOrderId: string,
  totalAmount: number,
  currency?: string,
) {
  return request(app.getHttpServer())
    .post('/api/partner/handoffs')
    .set('X-Api-Key', apiKey)
    .send({ externalOrderId, totalAmount, ...(currency ? { currency } : {}) });
}

export async function mintHandoffOk(
  app: INestApplication,
  apiKey: string,
  externalOrderId: string,
  totalAmount: number,
): Promise<MintedHandoff> {
  const response = await mintHandoff(app, apiKey, externalOrderId, totalAmount).expect(201);
  return response.body as MintedHandoff;
}

// The courier's device. No account, no payment id — the token carries the entire scope.
export function readHandoffPayment(app: INestApplication, handoffToken: string) {
  return request(app.getHttpServer()).get('/api/handoff/payment').set('X-Handoff-Token', handoffToken);
}

export function handoffQr(app: INestApplication, handoffToken: string) {
  return request(app.getHttpServer()).post('/api/handoff/payment/qr').set('X-Handoff-Token', handoffToken);
}

export function handoffTransaction(
  app: INestApplication,
  handoffToken: string,
  amount: number,
  paymentMethod = 'CASH',
) {
  return request(app.getHttpServer())
    .post('/api/handoff/payment/transactions')
    .set('X-Handoff-Token', handoffToken)
    .send({ amount, paymentMethod });
}

export function verifyAsPartner(app: INestApplication, apiKey: string, externalOrderId: string) {
  return request(app.getHttpServer())
    .get('/api/partner/payments')
    .set('X-Api-Key', apiKey)
    .query({ externalOrderId });
}
