import { BadRequestException, Injectable, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentProviderFactory } from '../../payment-provider/factory/payment-provider.factory';
import { ProviderType } from '../../payment-provider/enums/provider-type.enum';
import { PaymentRequest } from '../entities/payment-request.entity';
import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';
import { PaymentStateMachineService } from '../state-machine/payment-state-machine.service';
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
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly stateMachine: PaymentStateMachineService,
  ) {}

  async createPayment(request: CreatePaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>> {
    const initialState = PaymentLifecycleState.PENDING;

    this.validateInitialLifecycle(initialState);

    const paymentRequest = this.paymentRequestRepository.create({
      merchantId: request.merchantId,
      employeeId: request.employeeId ?? null,
      totalAmount: request.totalAmount,
      paidAmount: 0,
      currency: request.currency,
      paymentMethod: request.paymentMethod,
      deliveryChannel: request.deliveryChannel,
      status: initialState,
      description: request.description,
      expiresAt: request.expiresAt,
    });

    const saved = await this.paymentRequestRepository.save(paymentRequest);

    // Resolves the active provider adapter; no provider method is invoked yet.
    this.providerFactory.getProvider(ProviderType.PARAM_POS);

    return { success: true, data: saved };
  }

  // No prior persisted state exists at creation, so there is no real from->to transition to perform here.
  private validateInitialLifecycle(state: PaymentLifecycleState): void {
    if (state !== PaymentLifecycleState.PENDING) {
      throw new BadRequestException('A new payment request must start from PaymentLifecycleState.PENDING.');
    }

    const hasOutgoingTransition = Object.values(PaymentLifecycleState).some((candidate) =>
      this.stateMachine.canTransition(state, candidate),
    );

    if (!hasOutgoingTransition) {
      throw new BadRequestException('PaymentLifecycleState.PENDING has no valid outgoing transitions.');
    }
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
