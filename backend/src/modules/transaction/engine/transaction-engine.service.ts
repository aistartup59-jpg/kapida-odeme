import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PaymentRequest } from '../../payment/entities/payment-request.entity';
import { PaymentLifecycleState } from '../../payment/enums/payment-lifecycle-state.enum';
import { PaymentStateMachineService } from '../../payment/state-machine/payment-state-machine.service';
import { Transaction } from '../entities/transaction.entity';
import { OverpaymentException } from './exceptions/overpayment.exception';
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
    // The read (current paid total), the overpayment check, and the write must all happen
    // within one locked transaction: reading and checking outside the transaction let two
    // concurrent calls for the same PaymentRequest each see the same stale paidAmount, pass
    // the overpayment check independently, and together exceed totalAmount.
    const savedTransaction = await this.transactionRepository.manager.transaction(async (manager) => {
      const paymentRequest = await manager.getRepository(PaymentRequest).findOne({
        where: { id: request.paymentRequestId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!paymentRequest) {
        throw new NotFoundException(`PaymentRequest ${request.paymentRequestId} not found.`);
      }

      if (request.amount <= 0) {
        throw new BadRequestException('Transaction amount must be greater than 0.');
      }

      if (request.providerReference) {
        // Idempotent replay protection: a retried submission of the same reported payment
        // event (e.g. a client retry after a lost response) must not be recorded twice.
        const existing = await manager.getRepository(Transaction).findOne({
          where: { paymentRequestId: paymentRequest.id, providerReference: request.providerReference },
        });

        if (existing) {
          if (existing.amount !== request.amount || existing.paymentMethod !== request.paymentMethod) {
            throw new BadRequestException(
              `providerReference ${request.providerReference} was already recorded with a different amount or paymentMethod.`,
            );
          }

          return existing;
        }
      }

      const currentPaid = await this.sumTransactionAmounts(paymentRequest.id, manager);
      const projectedPaid = currentPaid + request.amount;

      if (projectedPaid > paymentRequest.totalAmount) {
        throw new OverpaymentException(paymentRequest.id);
      }

      const transaction = manager.getRepository(Transaction).create({
        paymentRequestId: paymentRequest.id,
        amount: request.amount,
        paymentMethod: request.paymentMethod,
        status: PaymentLifecycleState.PAID,
        providerReference: request.providerReference,
      });

      const saved = await manager.getRepository(Transaction).save(transaction);

      const nextState = this.resolveLifecycleState(paymentRequest.totalAmount, projectedPaid);
      paymentRequest.paidAmount = projectedPaid;
      await this.stateMachine.applyTransition(paymentRequest, nextState, manager);

      return saved;
    });

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
  private async sumTransactionAmounts(paymentRequestId: string, manager?: EntityManager): Promise<number> {
    const repository = manager ? manager.getRepository(Transaction) : this.transactionRepository;
    const raw = await repository
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
}
