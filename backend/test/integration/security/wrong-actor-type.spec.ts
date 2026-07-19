import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant, inviteAndActivateEmployee } from '../../utils/auth-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';

// merchant-payment-provider.service.ts's resolveMerchantId() rejects anything but
// user.type === 'merchant' outright — payment provider management is owner-only by
// identity type, not just by role. This was never exercised with an employee token in
// Phase 2 (only owner and cross-tenant-owner scenarios were tested there).
describe('Security - Wrong Actor Type (employee token on provider-management routes)', () => {
  let app: INestApplication;
  let employeeToken: string;
  let providerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const owner = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, owner.accessToken);
    employeeToken = employee.accessToken;
    const provider = await registerProvider(app, owner.accessToken);
    providerId = provider.id;
  });

  afterAll(async () => {
    await clearDatabase(app);
    await app.close();
  });

  it('rejects an employee creating a payment provider', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ providerType: 'PARAM_POS', credentials: { apiKey: 'x' } });

    expect(response.status).toBe(401);
  });

  it('rejects an employee listing payment providers', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects an employee updating a payment provider', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${providerId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ credentials: { apiKey: 'y' } });

    expect(response.status).toBe(401);
  });

  it('rejects an employee activating a payment provider', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/merchant/payment-providers/${providerId}/activate`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects an employee deleting a payment provider', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/merchant/payment-providers/${providerId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(response.status).toBe(401);
  });
});
