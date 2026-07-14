import { BadRequestException, Injectable, NotFoundException, NotImplementedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProviderException } from '../../payment-provider/common/exceptions/provider.exception';
import { PaymentProvider } from '../../payment-provider/interfaces/payment-provider.interface';
import { ProviderResolverService } from '../../payment-provider/resolver/provider-resolver.service';
import { TransactionEngineService } from '../../transaction/engine/transaction-engine.service';
import { PaymentRequest } from '../entities/payment-request.entity';
import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStateMachineService } from '../state-machine/payment-state-machine.service';
import { PaymentExecutionContext } from './models/payment-execution-context.model';
import { PaymentExecutionError, PaymentExecutionResult } from './models/payment-execution-result.model';
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
    private readonly providerResolver: ProviderResolverService,
    private readonly stateMachine: PaymentStateMachineService,
    private readonly transactionEngine: TransactionEngineService,
  ) {}

  async createPayment(request: CreatePaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>> {
    const initialState = PaymentLifecycleState.PENDING;

    this.validateInitialLifecycle(initialState);

    const requiresProvider = this.requiresProviderExecution(request.paymentMethod);

    const resolvedProvider = requiresProvider
      ? await this.providerResolver.resolveActiveProvider(request.merchantId)
      : null;

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

    if (!resolvedProvider) {
      return { success: true, data: saved };
    }

    const executionContext: PaymentExecutionContext = {
      paymentRequestId: saved.id,
      amount: saved.totalAmount,
      currency: saved.currency,
      credentialsReference: resolvedProvider.credentialsReference,
    };

    const executionResult = await this.executeWithProvider(
      resolvedProvider.provider,
      request.paymentMethod,
      executionContext,
    );

    if (!executionResult.success) {
      // The PaymentRequest row is already committed (line 62); if provider dispatch fails,
      // it must not be left stuck in PENDING with no record of the failure.
      await this.stateMachine.applyTransition(saved, PaymentLifecycleState.FAILED);
      return { success: false, error: executionResult.error };
    }

    return { success: true, data: saved };
  }

  // CASH has no provider involvement, and NFC completion is reported later through the
  // transaction endpoint rather than triggered at PaymentRequest creation time.
  private requiresProviderExecution(paymentMethod: PaymentMethod): boolean {
    return paymentMethod === PaymentMethod.QR || paymentMethod === PaymentMethod.PAYMENT_LINK;
  }

  // Orchestration only: dispatches to the provider capability that matches the requested
  // PaymentMethod (ADR-007) and normalizes whatever it returns or throws into a
  // provider-agnostic result. No provider-specific logic here.
  private async executeWithProvider(
    provider: PaymentProvider,
    paymentMethod: PaymentMethod,
    context: PaymentExecutionContext,
  ): Promise<PaymentExecutionResult> {
    try {
      switch (paymentMethod) {
        case PaymentMethod.QR:
          await provider.generateBankQR({
            reference: context.paymentRequestId,
            amount: context.amount,
            currency: context.currency,
            credentials: { reference: context.credentialsReference },
          });
          return { success: true };
        case PaymentMethod.PAYMENT_LINK:
          await provider.createPaymentLink({
            reference: context.paymentRequestId,
            amount: context.amount,
            currency: context.currency,
            credentials: { reference: context.credentialsReference },
          });
          return { success: true };
        default:
          return { success: true };
      }
    } catch (error) {
      return { success: false, error: this.toExecutionError(error) };
    }
  }

  private toExecutionError(error: unknown): PaymentExecutionError {
    if (error instanceof ProviderException) {
      return { code: error.name, message: error.message, details: error.details };
    }

    if (error instanceof Error) {
      return { code: 'PROVIDER_EXECUTION_ERROR', message: error.message };
    }

    return { code: 'PROVIDER_EXECUTION_ERROR', message: 'Unknown provider execution error.' };
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

  // Pure lifecycle transition: paidAmount is left exactly as recorded, and no refund is
  // ever created here. Refunding collected amounts is a separate, future capability.
  async cancelPayment(request: CancelPaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>> {
    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: request.paymentRequestId },
    });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
    }

    const updated = await this.stateMachine.applyTransition(paymentRequest, PaymentLifecycleState.CANCELLED);

    return { success: true, data: updated };
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
