export interface CreatePaymentRequest {
  reference: string;
  amount: number;
  currency: string;
  credentials: Record<string, string>;
}

export interface CreatePaymentResponse {
  providerReference: string;
  status: string;
  rawResponse?: Record<string, unknown>;
}

export interface GenerateBankQrRequest {
  reference: string;
  amount: number;
  currency: string;
  credentials: Record<string, string>;
}

export interface GenerateBankQrResponse {
  qrData: string;
  expiresAt?: Date;
}

export interface CreatePaymentLinkRequest {
  reference: string;
  amount: number;
  currency: string;
  credentials: Record<string, string>;
  expiresAt?: Date;
}

export interface CreatePaymentLinkResponse {
  url: string;
  expiresAt?: Date;
}

export interface CancelPaymentRequest {
  providerReference: string;
  credentials: Record<string, string>;
}

export interface CancelPaymentResponse {
  success: boolean;
  rawResponse?: Record<string, unknown>;
}

export interface RefundPaymentRequest {
  providerReference: string;
  amount: number;
  credentials: Record<string, string>;
}

export interface RefundPaymentResponse {
  success: boolean;
  refundReference?: string;
  rawResponse?: Record<string, unknown>;
}

export interface GetPaymentStatusRequest {
  providerReference: string;
  credentials: Record<string, string>;
}

export interface GetPaymentStatusResponse {
  status: string;
  paidAmount?: number;
  rawResponse?: Record<string, unknown>;
}

export interface HandleWebhookRequest {
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  credentials: Record<string, string>;
}

export interface HandleWebhookResponse {
  providerReference: string;
  status: string;
  paidAmount?: number;
  rawResponse?: Record<string, unknown>;
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
