import { INestApplication, NotImplementedException } from '@nestjs/common';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { ParamPosAdapter } from '../../../src/modules/payment-provider/adapters/parampos/parampos.adapter';
import { ProviderAuthenticationException } from '../../../src/modules/payment-provider/common/exceptions/provider-authentication.exception';

// ParamPosAdapter is an honest, self-documented skeleton pending the official ParamPOS
// sandbox API contract (see the original backend audit). These tests document its current,
// intentional behavior rather than chase a "bug" — every dispatch method throws
// NotImplementedException, and createPayment additionally gates on the credential
// reference/vault lookup before reaching that stub.
describe('Provider - ParamPOS Adapter (unimplemented stub, documents current behavior)', () => {
  let app: INestApplication;
  let adapter: ParamPosAdapter;

  beforeAll(async () => {
    app = await createTestApp();
    adapter = app.get(ParamPosAdapter);
  });

  afterEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('createPayment rejects a missing credentials reference before reaching the stub', async () => {
    await expect(
      adapter.createPayment({ reference: 'req-1', amount: 100, currency: 'TRY', credentials: {} }),
    ).rejects.toBeInstanceOf(ProviderAuthenticationException);
  });

  it('createPayment rejects an unknown credentials reference before reaching the stub', async () => {
    await expect(
      adapter.createPayment({
        reference: 'req-1',
        amount: 100,
        currency: 'TRY',
        credentials: { reference: 'never-vaulted' },
      }),
    ).rejects.toBeInstanceOf(ProviderAuthenticationException);
  });

  // None of these adapter methods are declared `async` — they throw synchronously despite
  // being typed to return a Promise, so the assertion must be synchronous too.
  it.each([
    ['generateBankQR', () => adapter.generateBankQR({ reference: 'r', amount: 1, currency: 'TRY', credentials: {} })],
    [
      'createPaymentLink',
      () => adapter.createPaymentLink({ reference: 'r', amount: 1, currency: 'TRY', credentials: {} }),
    ],
    ['cancelPayment', () => adapter.cancelPayment({ providerReference: 'r', credentials: {} })],
    ['refundPayment', () => adapter.refundPayment({ providerReference: 'r', amount: 1, credentials: {} })],
    ['getPaymentStatus', () => adapter.getPaymentStatus({ providerReference: 'r', credentials: {} })],
    ['handleWebhook', () => adapter.handleWebhook({ payload: {}, headers: {}, credentials: {} })],
  ])('%s throws NotImplementedException', (_name, invoke) => {
    expect(invoke).toThrow(NotImplementedException);
  });
});
