import { Injectable, Logger, NotImplementedException, OnModuleInit } from '@nestjs/common';

import {
  CancelPaymentRequest,
  CancelPaymentResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GenerateBankQrRequest,
  GenerateBankQrResponse,
  GetPaymentStatusRequest,
  GetPaymentStatusResponse,
  HandleWebhookRequest,
  HandleWebhookResponse,
  PaymentProvider,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-provider/interfaces/payment-provider.interface';
import { ProviderRegistry } from '../payment-provider/registry/provider.registry';
import { DemoProviderConfig } from './demo-provider.config';
import { DemoSettlementService } from './demo-settlement.service';

export const DEMO_PROVIDER_ID = 'DEMO';

@Injectable()
export class DemoProviderAdapter implements PaymentProvider, OnModuleInit {
  private readonly logger = new Logger(DemoProviderAdapter.name);

  constructor(
    private readonly registry: ProviderRegistry,
    private readonly config: DemoProviderConfig,
    private readonly settlement: DemoSettlementService,
  ) {}

  // Registers itself only when explicitly enabled. This is ADR-014 working as intended: an
  // adapter plus a registration line makes a provider selectable, with no enum to edit and no
  // migration to run — and leaving it unregistered removes it just as completely.
  onModuleInit(): void {
    if (!this.config.enabled) {
      return;
    }

    this.registry.register(DEMO_PROVIDER_ID, this);
    this.logger.warn(
      'Demo payment provider is ENABLED. It settles payments nobody made — never run this in production.',
    );
  }

  async generateBankQR(request: GenerateBankQrRequest): Promise<GenerateBankQrResponse> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // A real provider hands the payload to the customer's bank and tells us separately when it
    // was paid. Nothing on the courier's device knows the difference, which is the point:
    // scheduling the settlement here exercises the same polling and lifecycle the real
    // integration will.
    this.settlement.schedule(request.reference, request.amount, `demo-${request.reference}`);

    return { qrData: buildDemoQrPayload(request), expiresAt };
  }

  createPayment(_request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    throw new NotImplementedException('The demo provider only implements generateBankQR.');
  }

  cancelPayment(_request: CancelPaymentRequest): Promise<CancelPaymentResponse> {
    throw new NotImplementedException('The demo provider only implements generateBankQR.');
  }

  refundPayment(_request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    throw new NotImplementedException('The demo provider only implements generateBankQR.');
  }

  getPaymentStatus(_request: GetPaymentStatusRequest): Promise<GetPaymentStatusResponse> {
    throw new NotImplementedException('The demo provider only implements generateBankQR.');
  }

  handleWebhook(_request: HandleWebhookRequest): Promise<HandleWebhookResponse> {
    throw new NotImplementedException('The demo provider only implements generateBankQR.');
  }
}

// Shaped like an EMV / TR Karekod payload so it renders as a convincing QR on screen, but
// deliberately not a valid one: the merchant identifier is the literal string PAYALS DEMO and
// there is no CRC, so a real banking app rejects it instead of attempting to move money.
// A demo QR that a customer could actually pay would be a far worse problem than an ugly one.
function buildDemoQrPayload(request: GenerateBankQrRequest): string {
  const amount = request.amount.toFixed(2);

  return [
    '000201',
    '010212',
    '26200016PAYALS DEMO ONLY',
    '52045499',
    `5303${currencyCode(request.currency)}`,
    `54${String(amount.length).padStart(2, '0')}${amount}`,
    '5802TR',
    '5911PAYALS DEMO',
    '6008ISTANBUL',
    `62${String(request.reference.length + 4).padStart(2, '0')}05${String(request.reference.length).padStart(2, '0')}${request.reference}`,
    '6304DEMO',
  ].join('');
}

function currencyCode(currency: string): string {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '840';
    case 'EUR':
      return '978';
    default:
      return '949';
  }
}
