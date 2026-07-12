import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentRequest } from '../../payment/entities/payment-request.entity';
import { PaymentLifecycleState } from '../../payment/enums/payment-lifecycle-state.enum';
import { PaymentStateMachineService } from '../../payment/state-machine/payment-state-machine.service';
import { Transaction } from '../entities/transaction.entity';
import { CreateTransactionEngineRequest, TransactionEngine } from './transaction-engine.interface';
import { TransactionEngineResult } from './transaction-result.interface';

@Injectable()
export class TransactionEngineService implements TransactionEngine {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
    private readonly stateMachine: PaymentStateMachineService,
  ) {}

  async createTransaction(request: CreateTransactionEngineRequest): Promise<TransactionEngineResult<Transaction>> {
    const paymentRequest = await this.paymentRequestRepository.findOne({ where: { id: request.paymentRequestId } });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
    }

    const transaction = this.transactionRepository.create({
      paymentRequestId: paymentRequest.id,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      status: PaymentLifecycleState.PAID,
      providerReference: request.providerReference,
    });

    const savedTransaction = await this.transactionRepository.save(transaction);

    const totalPaid = await this.sumTransactionAmounts(paymentRequest.id);
    const nextState = this.resolveLifecycleState(paymentRequest.totalAmount, totalPaid);

    await this.applyLifecycleState(paymentRequest, nextState, totalPaid);

    return { success: true, data: savedTransaction };
  }

  async calculateRemainingAmount(paymentRequestId: string): Promise<TransactionEngineResult<number>> {
    const paymentRequest = await this.paymentRequestRepository.findOne({ where: { id: paymentRequestId } });

    if (!paymentRequest) {
      throw new NotFoundException(`PaymentRequest ${paymentRequestId} not found.`);
    }

    const totalPaid = await this.sumTransactionAmounts(paymentRequestId);
    const remainingAmount = Math.max(paymentRequest.totalAmount - totalPaid, 0);

    return { success: true, data: remainingAmount };
  }

  // RemainingAmount/paidAmount are always derived from Transaction rows, never trusted as stored state.
  private async sumTransactionAmounts(paymentRequestId: string): Promise<number> {
    const raw = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('COALESCE(SUM(transaction.amount), 0)', 'total')
      .where('transaction.paymentRequestId = :paymentRequestId', { paymentRequestId })
      .getRawOne<{ total: string }>();

    return Number(raw?.total ?? 0);
  }

  private resolveLifecycleState(totalAmount: number, totalPaid: number): PaymentLifecycleState {
    if (totalPaid <= 0) {
      return PaymentLifecycleState.PENDING;
    }

    if (totalPaid >= totalAmount) {
      return PaymentLifecycleState.PAID;
    }

    return PaymentLifecycleState.PARTIALLY_PAID;
  }

  private async applyLifecycleState(
    paymentRequest: PaymentRequest,
    nextState: PaymentLifecycleState,
    totalPaid: number,
  ): Promise<void> {
    if (nextState !== paymentRequest.status && !this.stateMachine.canTransition(paymentRequest.status, nextState)) {
      throw new BadRequestException(
        `Cannot transition payment request ${paymentRequest.id} from ${paymentRequest.status} to ${nextState}.`,
      );
    }

    paymentRequest.status = nextState;
    paymentRequest.paidAmount = totalPaid;

    await this.paymentRequestRepository.save(paymentRequest);
  }
}
