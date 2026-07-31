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

// Every provider — iyzico, PayTR, ParamPOS, or a bank's own gateway — is reached only
// through this interface (ADR-007). generateBankQR is the single provider capability the
// POS payment flow dispatches to today: NFC is captured by the device itself and CASH
// never involves a provider, so both are reported back as Transactions instead (ADR-013).
export interface PaymentProvider {
  createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  generateBankQR(request: GenerateBankQrRequest): Promise<GenerateBankQrResponse>;
  cancelPayment(request: CancelPaymentRequest): Promise<CancelPaymentResponse>;
  refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse>;
  getPaymentStatus(request: GetPaymentStatusRequest): Promise<GetPaymentStatusResponse>;
  handleWebhook(request: HandleWebhookRequest): Promise<HandleWebhookResponse>;
}
