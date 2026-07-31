import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant, inviteAndActivateEmployee } from '../../utils/auth-flow.util';
import { issuePartnerKey, mintHandoffOk, verifyAsPartner } from '../../utils/partner-flow.util';

describe('Partner - API Keys', () => {
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

  it('issues a key and returns the full secret exactly once', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const issued = await issuePartnerKey(app, accessToken, 'Getir');

    expect(issued.label).toBe('Getir');
    expect(issued.apiKey).toMatch(/^pay_[0-9a-f]{16}_[0-9a-f]{64}$/);

    // Listing exposes what the merchant needs to recognise a key, never the secret itself —
    // only its hash is stored, so a lost key is replaced rather than recovered.
    const list = await request(app.getHttpServer())
      .get('/api/merchant/partner-keys')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].publicId).toBe(issued.publicId);
    expect(list.body[0].apiKey).toBeUndefined();
    expect(list.body[0].secretHash).toBeUndefined();
  });

  it('rejects a key with no label', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/partner-keys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ label: '   ' });

    expect(response.status).toBe(400);
  });

  it('rejects an unauthenticated caller', async () => {
    const response = await request(app.getHttpServer()).post('/api/merchant/partner-keys').send({ label: 'X' });

    expect(response.status).toBe(401);
  });

  it('rejects an employee — issuing an integration credential is an owner action', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const employee = await inviteAndActivateEmployee(app, accessToken);

    const response = await request(app.getHttpServer())
      .post('/api/merchant/partner-keys')
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ label: 'Getir' });

    expect(response.status).toBe(401);
  });

  it('lists only the calling merchant\'s own keys', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);

    await issuePartnerKey(app, ownerA.accessToken, 'A platform');
    await issuePartnerKey(app, ownerB.accessToken, 'B platform');

    const list = await request(app.getHttpServer())
      .get('/api/merchant/partner-keys')
      .set('Authorization', `Bearer ${ownerA.accessToken}`);

    expect(list.body).toHaveLength(1);
    expect(list.body[0].label).toBe('A platform');
  });

  it('stops working the moment the key is revoked', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const issued = await issuePartnerKey(app, accessToken);
    await mintHandoffOk(app, issued.apiKey, 'ORDER-1', 100);

    await verifyAsPartner(app, issued.apiKey, 'ORDER-1').expect(200);

    await request(app.getHttpServer())
      .delete(`/api/merchant/partner-keys/${issued.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const afterRevoke = await verifyAsPartner(app, issued.apiKey, 'ORDER-1');
    expect(afterRevoke.status).toBe(401);
  });

  it('cannot revoke another merchant\'s key', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const issued = await issuePartnerKey(app, ownerA.accessToken);

    const response = await request(app.getHttpServer())
      .delete(`/api/merchant/partner-keys/${issued.id}`)
      .set('Authorization', `Bearer ${ownerB.accessToken}`);

    expect(response.status).toBe(404);
  });
});
