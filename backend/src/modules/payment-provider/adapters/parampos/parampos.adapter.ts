import { Injectable, NotImplementedException } from '@nestjs/common';

import {
  CancelPaymentRequest,
  CancelPaymentResponse,
  CreatePaymentLinkRequest,
  CreatePaymentLinkResponse,
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
import { ProviderRegistry } from '../../registry/provider.registry';
import { ProviderType } from '../../enums/provider-type.enum';

@Injectable()
export class ParamPosAdapter implements PaymentProvider {
  constructor(private readonly registry: ProviderRegistry) {
    this.registry.register(ProviderType.PARAM_POS, this);
  }

  createPayment(_request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    throw new NotImplementedException('Not implemented');
  }

  generateBankQR(_request: GenerateBankQrRequest): Promise<GenerateBankQrResponse> {
    throw new NotImplementedException('Not implemented');
  }

  createPaymentLink(_request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse> {
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
