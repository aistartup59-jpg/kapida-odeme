import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface CreatedPaymentRequest {
  id: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
}

export async function createCashPayment(
  app: INestApplication,
  accessToken: string,
  totalAmount: number,
): Promise<CreatedPaymentRequest> {
  const response = await request(app.getHttpServer())
    .post('/api/payments')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ totalAmount, paymentMethod: 'CASH' })
    .expect(201);

  return response.body as CreatedPaymentRequest;
}

export function recordTransaction(
  app: INestApplication,
  accessToken: string,
  paymentRequestId: string,
  amount: number,
  paymentMethod = 'CASH',
) {
  return request(app.getHttpServer())
    .post(`/api/payments/${paymentRequestId}/transactions`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ amount, paymentMethod });
}
