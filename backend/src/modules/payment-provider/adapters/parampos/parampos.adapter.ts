import { Injectable, NotImplementedException } from '@nestjs/common';

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
} from '../../interfaces/payment-provider.interface';
import { ProviderAuthenticationException } from '../../common/exceptions/provider-authentication.exception';
import { ProviderRegistry } from '../../registry/provider.registry';
import { CredentialVaultService } from '../../security/credential-vault.service';
import { ParamPosClient } from './parampos.client';

// The id this adapter registers itself under. It lives with the adapter rather than in a
// shared enum (ADR-014) so that a new provider is added by dropping in a sibling directory.
export const PARAM_POS_PROVIDER_ID = 'PARAM_POS';

@Injectable()
export class ParamPosAdapter implements PaymentProvider {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly client: ParamPosClient,
    private readonly credentialVault: CredentialVaultService,
  ) {
    this.registry.register(PARAM_POS_PROVIDER_ID, this);
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const reference = request.credentials?.reference;

    if (!reference) {
      throw new ProviderAuthenticationException('ParamPOS credentials reference is missing.');
    }

    const credentials = await this.credentialVault.load(reference);

    if (!credentials) {
      throw new ProviderAuthenticationException('No ParamPOS credentials found for the configured reference.');
    }

    // The sandbox request/response contract is pending the official ParamPOS documentation.
    throw new NotImplementedException('ParamPosAdapter.createPayment is awaiting the ParamPOS sandbox API contract.');
  }

  generateBankQR(_request: GenerateBankQrRequest): Promise<GenerateBankQrResponse> {
    throw new NotImplementedException('Not implemented');
  }

  cancelPayment(_request: CancelPaymentRequest): Promise<CancelPaymentResponse> {
    throw new NotImplementedException('Not implemented');
  }

  refundPayment(_request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    throw new NotImplementedException('Not implemented');
  }

  getPaymentStatus(_request: GetPaymentStatusRequest): Promise<GetPaymentStatusResponse> {
    throw new NotImplementedException('Not implemented');
  }

  handleWebhook(_request: HandleWebhookRequest): Promise<HandleWebhookResponse> {
    throw new NotImplementedException('Not implemented');
  }
}
