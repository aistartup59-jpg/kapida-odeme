import { PaymentEngineResult } from './payment-engine-result.interface';

export interface PaymentEngineRequest {
  paymentRequestId: string;
}

export interface CreatePaymentEngineRequest extends PaymentEngineRequest {
  amount: number;
  currency: string;
}

export interface GenerateQrEngineRequest extends PaymentEngineRequest {
  amount: number;
  currency: string;
}

export interface CreatePaymentLinkEngineRequest extends PaymentEngineRequest {
  amount: number;
  currency: string;
  expiresAt?: Date;
}

export interface ProcessNfcEngineRequest extends PaymentEngineRequest {
  amount: number;
  currency: string;
}

export interface CancelPaymentEngineRequest extends PaymentEngineRequest {}

export interface RefundPaymentEngineRequest extends PaymentEngineRequest {
  amount: number;
}

export interface GetPaymentStatusEngineRequest extends PaymentEngineRequest {}

export interface PaymentEngine {
  createPayment(request: CreatePaymentEngineRequest): Promise<PaymentEngineResult>;
  generateQr(request: GenerateQrEngineRequest): Promise<PaymentEngineResult>;
  createPaymentLink(request: CreatePaymentLinkEngineRequest): Promise<PaymentEngineResult>;
  processNfc(request: ProcessNfcEngineRequest): Promise<PaymentEngineResult>;
  cancelPayment(request: CancelPaymentEngineRequest): Promise<PaymentEngineResult>;
  refundPayment(request: RefundPaymentEngineRequest): Promise<PaymentEngineResult>;
  getPaymentStatus(request: GetPaymentStatusEngineRequest): Promise<PaymentEngineResult>;
}
