import { BadRequestException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentProvider } from '../../payment-provider/interfaces/payment-provider.interface';
import { PaymentProviderFactory } from '../../payment-provider/factory/payment-provider.factory';
import { MerchantPaymentProvider } from '../../payment-provider/entities/merchant-payment-provider.entity';
import { TransactionEngineService } from '../../transaction/engine/transaction-engine.service';
import { NoActiveProviderException } from './exceptions/no-active-provider.exception';
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
  RecordTransactionEngineRequest,
  RefundPaymentEngineRequest,
} from './payment-engine.interface';
import { PaymentEngineResult } from './payment-engine-result.interface';

@Injectable()
export class PaymentEngineService implements PaymentEngine {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    @InjectRepository(MerchantPaymentProvider)
    private readonly merchantPaymentProviderRepository: Repository<MerchantPaymentProvider>,
    private readonly providerFactory: PaymentProviderFactory,
    private readonly stateMachine: PaymentStateMachineService,
    private readonly transactionEngine: TransactionEngineService,
  ) {}

  async createPayment(request: CreatePaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>> {
    const initialState = PaymentLifecycleState.PENDING;

    this.validateInitialLifecycle(initialState);

    const { provider, credentialsReference } = await this.resolveActiveProvider(request.merchantId);

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

    await provider.createPayment({
      reference: saved.id,
      amount: saved.totalAmount,
      currency: saved.currency,
      credentials: { reference: credentialsReference },
    });

    return { success: true, data: saved };
  }

  // Merchant configuration decides the provider; the engine only resolves it.
  private async resolveActiveProvider(
    merchantId: string,
  ): Promise<{ provider: PaymentProvider; credentialsReference: string }> {
    const merchantProvider = await this.merchantPaymentProviderRepository.findOne({
      where: { merchantId, isActive: true },
      order: { priority: 'ASC' },
    });

    if (!merchantProvider) {
      throw new NoActiveProviderException(merchantId);
    }

    return {
      provider: this.providerFactory.getProvider(merchantProvider.providerType),
      credentialsReference: merchantProvider.credentialsReference,
    };
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

  // Delegates the actual transaction bookkeeping (overpayment checks, lifecycle transitions) to TransactionEngine.
  async recordTransaction(request: RecordTransactionEngineRequest): Promise<PaymentEngineResult<PaymentRequest>> {
    await this.transactionEngine.createTransaction({
      paymentRequestId: request.paymentRequestId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      providerReference: request.providerReference,
    });

    const paymentRequest = await this.paymentRequestRepository.findOne({ where: { id: request.paymentRequestId } });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
    }

    return { success: true, data: paymentRequest };
  }

  getRemainingAmount(paymentRequestId: string): Promise<PaymentEngineResult<number>> {
    return this.transactionEngine.calculateRemainingAmount(paymentRequestId);
  }
}
