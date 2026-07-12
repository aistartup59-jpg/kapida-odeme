import { Injectable, NotImplementedException } from '@nestjs/common';

import { PaymentProviderFactory } from '../../payment-provider/factory/payment-provider.factory';
import {
  CancelPaymentEngineRequest,
  CreatePaymentEngineRequest,
  CreatePaymentLinkEngineRequest,
  GenerateQrEngineRequest,
  GetPaymentStatusEngineRequest,
  PaymentEngine,
  ProcessNfcEngineRequest,
  RefundPaymentEngineRequest,
} from './payment-engine.interface';
import { PaymentEngineResult } from './payment-engine-result.interface';

@Injectable()
export class PaymentEngineService implements PaymentEngine {
  constructor(private readonly providerFactory: PaymentProviderFactory) {}

  createPayment(_request: CreatePaymentEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.createPayment is not implemented yet.');
  }

  generateQr(_request: GenerateQrEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.generateQr is not implemented yet.');
  }

  createPaymentLink(_request: CreatePaymentLinkEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.createPaymentLink is not implemented yet.');
  }

  processNfc(_request: ProcessNfcEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.processNfc is not implemented yet.');
  }

  cancelPayment(_request: CancelPaymentEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.cancelPayment is not implemented yet.');
  }

  refundPayment(_request: RefundPaymentEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.refundPayment is not implemented yet.');
  }

  getPaymentStatus(_request: GetPaymentStatusEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.getPaymentStatus is not implemented yet.');
  }
}
