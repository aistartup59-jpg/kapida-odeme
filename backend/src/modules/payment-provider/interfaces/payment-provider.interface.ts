import { ProviderRequest } from '../common/types/provider-request.interface';
import { ProviderResponse } from '../common/types/provider-response.interface';

export interface CreatePaymentRequest extends ProviderRequest {
  reference: string;
  amount: number;
  currency: string;
}

export interface CreatePaymentResponse extends ProviderResponse {
  providerReference: string;
  status: string;
}

export interface GenerateBankQrRequest extends ProviderRequest {
  reference: string;
  amount: number;
  currency: string;
}

export interface GenerateBankQrResponse extends ProviderResponse {
  qrData: string;
  expiresAt?: Date;
}

export interface CreatePaymentLinkRequest extends ProviderRequest {
  reference: string;
  amount: number;
  currency: string;
  expiresAt?: Date;
}

export interface CreatePaymentLinkResponse extends ProviderResponse {
  url: string;
  expiresAt?: Date;
}

export interface CancelPaymentRequest extends ProviderRequest {
  providerReference: string;
}

export interface CancelPaymentResponse extends ProviderResponse {
  success: boolean;
}

export interface RefundPaymentRequest extends ProviderRequest {
  providerReference: string;
  amount: number;
}

export interface RefundPaymentResponse extends ProviderResponse {
  success: boolean;
  refundReference?: string;
}

export interface GetPaymentStatusRequest extends ProviderRequest {
  providerReference: string;
}

export interface GetPaymentStatusResponse extends ProviderResponse {
  status: string;
  paidAmount?: number;
}

export interface HandleWebhookRequest extends ProviderRequest {
  payload: Record<string, unknown>;
  headers: Record<string, string>;
}

export interface HandleWebhookResponse extends ProviderResponse {
  providerReference: string;
  status: string;
  paidAmount?: number;
}

export interface PaymentProvider {
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  generateBankQR(request: GenerateBankQrRequest): Promise<GenerateBankQrResponse>;
  createPaymentLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse>;
  cancelPayment(request: CancelPaymentRequest): Promise<CancelPaymentResponse>;
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
  getPaymentStatus(request: GetPaymentStatusRequest): Promise<GetPaymentStatusResponse>;
  handleWebhook(request: HandleWebhookRequest): Promise<HandleWebhookResponse>;
}
