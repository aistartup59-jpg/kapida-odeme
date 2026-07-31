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
  CreatePaymentEngineResult,
  GenerateQrEngineRequest,
  GenerateQrEngineResult,
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

  async createPayment(request: CreatePaymentEngineRequest): Promise<CreatePaymentEngineResult> {
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
      externalOrderId: request.externalOrderId ?? null,
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

    return {
      success: true,
      data: saved,
      qrData: executionResult.qrData,
      qrExpiresAt: executionResult.qrExpiresAt,
    };
  }

  // QR is the only method that needs the provider up front, because the bank QR payload has
  // to be issued before the customer can scan it. CASH has no provider involvement at all,
  // and an NFC card is read by the POS device itself — both are reported afterwards through
  // the transaction endpoint rather than triggered at PaymentRequest creation time.
  private requiresProviderExecution(paymentMethod: PaymentMethod): boolean {
    return paymentMethod === PaymentMethod.QR;
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
        case PaymentMethod.QR: {
          const qrResponse = await provider.generateBankQR({
            reference: context.paymentRequestId,
            amount: context.amount,
            currency: context.currency,
            credentials: { reference: context.credentialsReference },
          });
          return { success: true, qrData: qrResponse.qrData, qrExpiresAt: qrResponse.expiresAt };
        }
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

  // Issues a bank QR against a PaymentRequest that already exists, for the remaining amount.
  // Creation-time QR (createPayment) cannot serve the courier flow on its own: a request may
  // be opened before the customer has chosen how to pay, and after a partial cash payment the
  // QR must cover what is actually left rather than the original total.
  //
  // Unlike createPayment, a provider failure here does not move the PaymentRequest to FAILED.
  // The request was not born for QR — the courier can still collect it in cash — so a failed
  // QR attempt must leave the payment collectable.
  async generateQr(request: GenerateQrEngineRequest): Promise<GenerateQrEngineResult> {
    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: request.paymentRequestId },
    });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
    }

    if (
      paymentRequest.status !== PaymentLifecycleState.PENDING &&
      paymentRequest.status !== PaymentLifecycleState.PARTIALLY_PAID
    ) {
      throw new BadRequestException(
        `A bank QR can only be issued while a payment request is collectable (current status: ${paymentRequest.status}).`,
      );
    }

    const remainingAmountResult = await this.transactionEngine.calculateRemainingAmount(paymentRequest.id);

    if (!remainingAmountResult.success || remainingAmountResult.data === undefined) {
      return { success: false, error: remainingAmountResult.error };
    }

    if (remainingAmountResult.data <= 0) {
      throw new BadRequestException('Nothing is left to collect on this payment request.');
    }

    const resolvedProvider = await this.providerResolver.resolveActiveProvider(paymentRequest.merchantId);

    const executionResult = await this.executeWithProvider(resolvedProvider.provider, PaymentMethod.QR, {
      paymentRequestId: paymentRequest.id,
      amount: remainingAmountResult.data,
      currency: paymentRequest.currency,
      credentialsReference: resolvedProvider.credentialsReference,
    });

    if (!executionResult.success) {
      return { success: false, error: executionResult.error };
    }

    return {
      success: true,
      data: paymentRequest,
      qrData: executionResult.qrData,
      qrExpiresAt: executionResult.qrExpiresAt,
    };
  }

  processNfc(_request: ProcessNfcEngineRequest): Promise<PaymentEngineResult> {
    throw new NotImplementedException('PaymentEngine.processNfc is not implemented yet.');
  }

  // Pure lifecycle transition: paidAmount is left exactly as recorded, and no refund is
  // ever created here. Refunding collected amounts is a separate, future capability.
  //
  // The read and the transition must share a locked transaction with TransactionEngine's
  // createTransaction: an unlocked read here could race a concurrent createTransaction call
  // on the same PaymentRequest, then this method's save() (writing every field on its stale
  // in-memory copy) would silently overwrite that transaction's already-committed paidAmount.
  async cancelPayment(request: CancelPaymentEngineRequest): Promise<PaymentEngineResult<PaymentRequest>> {
    const updated = await this.paymentRequestRepository.manager.transaction(async (manager) => {
      const paymentRequest = await manager.getRepository(PaymentRequest).findOne({
        where: { id: request.paymentRequestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!paymentRequest) {
        throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
      }

      return this.stateMachine.applyTransition(paymentRequest, PaymentLifecycleState.CANCELLED, manager);
    });

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

    const paymentRequest = await this.paymentRequestRepository.findOne({
      where: { id: request.paymentRequestId },
      relations: ['transactions'],
    });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
    }

    return { success: true, data: paymentRequest };
  }

  getRemainingAmount(paymentRequestId: string): Promise<PaymentEngineResult<number>> {
    return this.transactionEngine.calculateRemainingAmount(paymentRequestId);
  }
}
