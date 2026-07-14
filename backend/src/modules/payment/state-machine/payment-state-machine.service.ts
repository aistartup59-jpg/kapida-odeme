import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PaymentRequest } from '../entities/payment-request.entity';
import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';
import { PaymentTransition } from './payment-transition.interface';
import { PaymentTransitionResult } from './payment-transition-result.interface';

const ALLOWED_TRANSITIONS: Record<PaymentLifecycleState, PaymentLifecycleState[]> = {
  [PaymentLifecycleState.PENDING]: [
    PaymentLifecycleState.PARTIALLY_PAID,
    PaymentLifecycleState.PAID,
    PaymentLifecycleState.CANCELLED,
    PaymentLifecycleState.EXPIRED,
    PaymentLifecycleState.FAILED,
  ],
  [PaymentLifecycleState.PARTIALLY_PAID]: [
    PaymentLifecycleState.PAID,
    PaymentLifecycleState.CANCELLED,
    PaymentLifecycleState.EXPIRED,
    PaymentLifecycleState.REFUNDED,
  ],
  [PaymentLifecycleState.PAID]: [PaymentLifecycleState.REFUNDED],
  [PaymentLifecycleState.CANCELLED]: [],
  [PaymentLifecycleState.EXPIRED]: [],
  [PaymentLifecycleState.FAILED]: [],
  [PaymentLifecycleState.REFUNDED]: [],
};

@Injectable()
export class PaymentStateMachineService {
  constructor(
    @InjectRepository(PaymentRequest)
    private readonly paymentRequestRepository: Repository<PaymentRequest>,
  ) {}

  canTransition(from: PaymentLifecycleState, to: PaymentLifecycleState): boolean {
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(transition: PaymentTransition): PaymentTransitionResult {
    const { from, to } = transition;
    const allowed = this.canTransition(from, to);

    return {
      allowed,
      from,
      to,
      reason: allowed ? undefined : `Transition from ${from} to ${to} is not allowed.`,
    };
  }

  // The only place allowed to write PaymentRequest.status. Every status change
  // must go through here so validation and persistence stay centralized.
  //
  // The optional `manager` lets a caller that already opened a DB transaction (e.g.
  // TransactionEngineService.createTransaction, which must commit its Transaction insert
  // and this PaymentRequest update together) persist through that same transaction instead
  // of this service's own connection. Omitting it preserves the exact prior behavior.
  async applyTransition(
    paymentRequest: PaymentRequest,
    to: PaymentLifecycleState,
    manager?: EntityManager,
  ): Promise<PaymentRequest> {
    const from = paymentRequest.status;

    if (to !== from) {
      const result = this.transition({ from, to });

      if (!result.allowed) {
        throw new BadRequestException(
          `Cannot transition payment request ${paymentRequest.id} from ${from} to ${to}.`,
        );
      }

      paymentRequest.status = to;
    }

    const repository = manager ? manager.getRepository(PaymentRequest) : this.paymentRequestRepository;
    return repository.save(paymentRequest);
  }
}
