import { INestApplication } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import * as request from 'supertest';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';

// authorization.spec.ts already proves JwtAuthGuard rejects expired/forged/malformed
// tokens on one route (/auth/logout). This confirms the same guard behaves identically
// cross-cutting on unrelated modules (payment, merchant provider) — a single shared
// PassportModule/JwtStrategy should mean this is automatic, but it was never actually
// exercised outside the auth module.
describe('Security - Token Integrity (cross-cutting)', () => {
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

  it('rejects an expired token on the payment module', async () => {
    const expiredToken = sign(
      { sub: 'whoever', type: 'merchant', role: 'OWNER' },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 },
    );

    const response = await request(app.getHttpServer()).get('/api/payments').set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired token on the merchant provider module', async () => {
    const expiredToken = sign(
      { sub: 'whoever', type: 'merchant', role: 'OWNER' },
      process.env.JWT_SECRET as string,
      { expiresIn: -10 },
    );

    const response = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects a token forged with the wrong secret on the payment module', async () => {
    const forgedToken = sign({ sub: 'whoever', type: 'merchant', role: 'OWNER' }, 'wrong-secret', {
      expiresIn: '15m',
    });

    const response = await request(app.getHttpServer()).get('/api/payments').set('Authorization', `Bearer ${forgedToken}`);

    expect(response.status).toBe(401);
  });

  it('rejects a token whose sub does not correspond to any real merchant', async () => {
    // Correctly signed (real secret) but for a merchant id that was never created —
    // exercises resolveIdentity()'s DB lookup failure path, not just signature verification.
    const phantomToken = sign(
      { sub: '99999999-9999-9999-9999-999999999999', type: 'merchant', role: 'OWNER' },
      process.env.JWT_SECRET as string,
      { expiresIn: '15m' },
    );

    const response = await request(app.getHttpServer())
      .get('/api/payments')
      .set('Authorization', `Bearer ${phantomToken}`);

    expect(response.status).toBe(401);
  });

  it('still accepts a valid, unexpired token on both modules (control case)', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);

    const payments = await request(app.getHttpServer()).get('/api/payments').set('Authorization', `Bearer ${accessToken}`);
    expect(payments.status).toBe(200);

    const providers = await request(app.getHttpServer())
      .get('/api/merchant/payment-providers')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(providers.status).toBe(200);
  });
});
