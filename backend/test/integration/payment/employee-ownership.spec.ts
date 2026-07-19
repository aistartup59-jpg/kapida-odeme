import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant, inviteAndActivateEmployee } from '../../utils/auth-flow.util';

describe('Payment - Employee Ownership', () => {
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

  it('stamps a payment created by an employee with both the merchantId and the employeeId from the JWT', async () => {
    const owner = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, owner.accessToken);

    const response = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' });

    expect(response.status).toBe(201);
    expect(response.body.merchantId).toBe(owner.merchantId);
    expect(response.body.employeeId).toBe(employee.employeeId);
  });

  it('lets the owner see every employee\'s payment requests', async () => {
    const owner = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, owner.accessToken);

    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].employeeId).toBe(employee.employeeId);
  });

  it('restricts an employee\'s payment list to only their own payment requests', async () => {
    const owner = await registerAndLoginMerchant(app);
    const employeeA = await inviteAndActivateEmployee(app, owner.accessToken);
    const employeeB = await inviteAndActivateEmployee(app, owner.accessToken);

    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${employeeA.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${employeeB.accessToken}`)
      .send({ totalAmount: 200, paymentMethod: 'CASH' })
      .expect(201);

    const listA = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${employeeA.accessToken}`);

    expect(listA.body).toHaveLength(1);
    expect(listA.body[0].employeeId).toBe(employeeA.employeeId);
  });

  it('rejects an employee reading a different employee\'s payment request by id', async () => {
    const owner = await registerAndLoginMerchant(app);
    const employeeA = await inviteAndActivateEmployee(app, owner.accessToken);
    const employeeB = await inviteAndActivateEmployee(app, owner.accessToken);

    const created = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${employeeA.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/payments/${created.body.id}`)
      .set('Authorization', `Bearer ${employeeB.accessToken}`);

    expect(response.status).toBe(401);
  });

  it('lets the owner read a payment request created by any of their employees', async () => {
    const owner = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, owner.accessToken);

    const created = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ totalAmount: 100, paymentMethod: 'CASH' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/api/payments/${created.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(response.status).toBe(200);
  });
});
