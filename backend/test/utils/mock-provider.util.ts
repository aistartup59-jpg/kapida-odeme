import { INestApplication } from '@nestjs/common';

import { ProviderRegistry } from '../../src/modules/payment-provider/registry/provider.registry';
import { ProviderType } from '../../src/modules/payment-provider/enums/provider-type.enum';
import {
  PaymentProvider,
  GenerateBankQrRequest,
  GenerateBankQrResponse,
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
} from '../../src/modules/payment-provider/interfaces/payment-provider.interface';

// The real ParamPosAdapter is an intentionally unimplemented stub (every dispatch method
// throws NotImplementedException, per the Phase 3 audit note), so there is currently no way
// to exercise a *successful* provider dispatch through it. This test-only double implements
// just enough of PaymentProvider to drive the success and failure paths that
// payment-engine.service.ts actually calls (generateBankQR, createPaymentLink), and is
// swapped into the real ProviderRegistry in place of PARAM_POS for the duration of a test
// file. It never ships in production code.
export class MockPaymentProvider implements Partial<PaymentProvider> {
  generateBankQRImpl: (request: GenerateBankQrRequest) => Promise<GenerateBankQrResponse> = async () => ({
    qrData: 'mock-qr-payload',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  createPaymentLinkImpl: (request: CreatePaymentLinkRequest) => Promise<CreatePaymentLinkResponse> = async () => ({
    url: 'https://pay.example.test/mock-link',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  generateBankQR(request: GenerateBankQrRequest): Promise<GenerateBankQrResponse> {
    return this.generateBankQRImpl(request);
  }

  createPaymentLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse> {
    return this.createPaymentLinkImpl(request);
  }
}

export function installMockProvider(app: INestApplication, providerType = ProviderType.PARAM_POS): MockPaymentProvider {
  const registry = app.get(ProviderRegistry);
  const mock = new MockPaymentProvider();
  registry.register(providerType, mock as unknown as PaymentProvider);
  return mock;
}
