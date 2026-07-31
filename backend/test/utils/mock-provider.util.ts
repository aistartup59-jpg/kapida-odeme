import { INestApplication } from '@nestjs/common';

import { PARAM_POS_PROVIDER_ID } from '../../src/modules/payment-provider/adapters/parampos/parampos.adapter';
import { ProviderRegistry } from '../../src/modules/payment-provider/registry/provider.registry';
import {
  PaymentProvider,
  GenerateBankQrRequest,
  GenerateBankQrResponse,
} from '../../src/modules/payment-provider/interfaces/payment-provider.interface';

// The real ParamPosAdapter is an intentionally unimplemented stub (every dispatch method
// throws NotImplementedException, per the Phase 3 audit note), so there is currently no way
// to exercise a *successful* provider dispatch through it. This test-only double implements
// just enough of PaymentProvider to drive the success and failure paths that
// payment-engine.service.ts actually calls — generateBankQR is the only provider capability
// the POS payment flow dispatches to (ADR-013). It is swapped into the real ProviderRegistry
// in place of PARAM_POS for the duration of a test file, and never ships in production code.
export class MockPaymentProvider implements Partial<PaymentProvider> {
  generateBankQRImpl: (request: GenerateBankQrRequest) => Promise<GenerateBankQrResponse> = async () => ({
    qrData: 'mock-qr-payload',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  generateBankQR(request: GenerateBankQrRequest): Promise<GenerateBankQrResponse> {
    return this.generateBankQRImpl(request);
  }
}

export function installMockProvider(app: INestApplication, providerId = PARAM_POS_PROVIDER_ID): MockPaymentProvider {
  const registry = app.get(ProviderRegistry);
  const mock = new MockPaymentProvider();
  registry.register(providerId, mock as unknown as PaymentProvider);
  return mock;
}
