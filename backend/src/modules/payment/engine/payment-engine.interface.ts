import { Currency } from '../enums/currency.enum';
import { DeliveryChannel } from '../enums/delivery-channel.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentRequest } from '../entities/payment-request.entity';
import { PaymentEngineResult } from './payment-engine-result.interface';

export interface PaymentEngineRequest {
  paymentRequestId: string;
}

export interface CreatePaymentEngineRequest {
  merchantId: string;
  employeeId?: string | null;
  totalAmount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  deliveryChannel: DeliveryChannel;
  description?: string;
  expiresAt?: Date;
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

export interface RecordTransactionEngineRequest extends PaymentEngineRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  providerReference?: string;
}

export interface PaymentEngine {
  createPayment(request: CreatePaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>>;
  generateQr(request: GenerateQrEngineRequest): Promise<PaymentEngineResult>;
  createPaymentLink(request: CreatePaymentLinkEngineRequest): Promise<PaymentEngineResult>;
  processNfc(request: ProcessNfcEngineRequest): Promise<PaymentEngineResult>;
  cancelPayment(request: CancelPaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>>;
  refundPayment(request: RefundPaymentEngineRequest): Promise<PaymentEngineResult>;
  getPaymentStatus(request: GetPaymentStatusEngineRequest): Promise<PaymentEngineResult>;
  recordTransaction(request: RecordTransactionEngineRequest): Promise<PaymentEngineResult<PaymentRequest>>;
  getRemainingAmount(paymentRequestId: string): Promise<PaymentEngineResult<number>>;
}
