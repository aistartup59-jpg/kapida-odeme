import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { registerAndLoginMerchant } from '../../utils/auth-flow.util';
import { registerProvider } from '../../utils/provider-flow.util';
import { CredentialVaultService } from '../../../src/modules/payment-provider/security/credential-vault.service';

// The vault used to be a process-local Map, so a restart silently emptied it and a second
// instance could not read what the first had written. These tests assert the property that
// change was made for: credentials outlive the process that stored them.
describe('Credential Vault - Persistence', () => {
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

  async function referenceFor(providerId: string): Promise<string> {
    const [row] = await app
      .get(DataSource)
      .query('SELECT "credentialsReference" FROM "merchant_payment_providers" WHERE "id" = $1', [providerId]);

    return row.credentialsReference as string;
  }

  it('survives a full application restart', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken, {
      credentials: { apiKey: 'persisted-key', apiSecret: 'persisted-secret' },
    });
    const reference = await referenceFor(provider.id);

    // A restart, as far as the vault is concerned: the process that held the Map is gone.
    await app.close();
    app = await createTestApp();

    const loaded = await app.get(CredentialVaultService).load(reference);

    expect(loaded).not.toBeNull();
    expect(JSON.parse(loaded as string)).toEqual({ apiKey: 'persisted-key', apiSecret: 'persisted-secret' });
  });

  it('stores ciphertext, never the plaintext credentials', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken, {
      credentials: { apiKey: 'super-secret-value' },
    });
    const reference = await referenceFor(provider.id);

    const [row] = await app
      .get(DataSource)
      .query('SELECT "iv", "authTag", "content" FROM "vaulted_credentials" WHERE "reference" = $1', [reference]);

    expect(row.content).not.toContain('super-secret-value');
    expect(row.content).not.toContain('apiKey');
    expect(row.iv).toBeTruthy();
    expect(row.authTag).toBeTruthy();
  });

  it('gives every write a distinct iv, so identical credentials do not produce identical ciphertext', async () => {
    const ownerA = await registerAndLoginMerchant(app);
    const ownerB = await registerAndLoginMerchant(app);
    const credentials = { apiKey: 'identical-key' };

    const providerA = await registerProvider(app, ownerA.accessToken, { credentials });
    const providerB = await registerProvider(app, ownerB.accessToken, { credentials });

    const rows = await app
      .get(DataSource)
      .query('SELECT "iv", "content" FROM "vaulted_credentials" WHERE "reference" IN ($1, $2)', [
        await referenceFor(providerA.id),
        await referenceFor(providerB.id),
      ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].iv).not.toBe(rows[1].iv);
    expect(rows[0].content).not.toBe(rows[1].content);
  });

  it('rotating credentials writes a new reference and removes the superseded row', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken, { credentials: { apiKey: 'original' } });
    const originalReference = await referenceFor(provider.id);

    await request(app.getHttpServer())
      .patch(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ credentials: { apiKey: 'rotated' } })
      .expect(200);

    const rotatedReference = await referenceFor(provider.id);
    expect(rotatedReference).not.toBe(originalReference);

    const vault = app.get(CredentialVaultService);
    expect(await vault.load(originalReference)).toBeNull();
    expect(JSON.parse((await vault.load(rotatedReference)) as string)).toEqual({ apiKey: 'rotated' });
  });

  it('deleting a provider leaves no credentials behind', async () => {
    const { accessToken } = await registerAndLoginMerchant(app);
    const provider = await registerProvider(app, accessToken);
    const reference = await referenceFor(provider.id);

    await request(app.getHttpServer())
      .delete(`/api/merchant/payment-providers/${provider.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const rows = await app
      .get(DataSource)
      .query('SELECT 1 FROM "vaulted_credentials" WHERE "reference" = $1', [reference]);

    expect(rows).toHaveLength(0);
    expect(await app.get(CredentialVaultService).load(reference)).toBeNull();
  });

  it('returns null for a reference that was never stored', async () => {
    expect(await app.get(CredentialVaultService).load('never-written')).toBeNull();
  });
});
