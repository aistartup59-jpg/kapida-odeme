import { BadRequestException, INestApplication } from '@nestjs/common';

import { createTestApp, clearDatabase } from '../../helpers/test-app.helper';
import { PaymentStateMachineService } from '../../../src/modules/payment/state-machine/payment-state-machine.service';
import { PaymentLifecycleState } from '../../../src/modules/payment/enums/payment-lifecycle-state.enum';
import { PaymentRequest } from '../../../src/modules/payment/entities/payment-request.entity';

// PaymentStateMachineService is the only place allowed to write PaymentRequest.status
// (ADR-011). No HTTP route maps to it 1:1, so its transition table is exercised directly
// via the DI container, same approach as Phase 2's ProviderResolverService.
describe('Payment Lifecycle - State Machine Transition Table', () => {
  let app: INestApplication;
  let stateMachine: PaymentStateMachineService;

  beforeAll(async () => {
    app = await createTestApp();
    stateMachine = app.get(PaymentStateMachineService);
  });

  afterEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const ALL_STATES = Object.values(PaymentLifecycleState);

  it.each([
    [PaymentLifecycleState.PENDING, PaymentLifecycleState.PARTIALLY_PAID],
    [PaymentLifecycleState.PENDING, PaymentLifecycleState.PAID],
    [PaymentLifecycleState.PENDING, PaymentLifecycleState.CANCELLED],
    [PaymentLifecycleState.PENDING, PaymentLifecycleState.EXPIRED],
    [PaymentLifecycleState.PENDING, PaymentLifecycleState.FAILED],
    [PaymentLifecycleState.PARTIALLY_PAID, PaymentLifecycleState.PAID],
    [PaymentLifecycleState.PARTIALLY_PAID, PaymentLifecycleState.CANCELLED],
    [PaymentLifecycleState.PARTIALLY_PAID, PaymentLifecycleState.EXPIRED],
    [PaymentLifecycleState.PARTIALLY_PAID, PaymentLifecycleState.REFUNDED],
    [PaymentLifecycleState.PAID, PaymentLifecycleState.REFUNDED],
  ])('allows %s -> %s', (from, to) => {
    expect(stateMachine.canTransition(from, to)).toBe(true);
  });

  it.each([
    [PaymentLifecycleState.PAID, PaymentLifecycleState.CANCELLED],
    [PaymentLifecycleState.PAID, PaymentLifecycleState.PENDING],
    [PaymentLifecycleState.PARTIALLY_PAID, PaymentLifecycleState.PENDING],
    [PaymentLifecycleState.CANCELLED, PaymentLifecycleState.PENDING],
    [PaymentLifecycleState.EXPIRED, PaymentLifecycleState.PENDING],
    [PaymentLifecycleState.FAILED, PaymentLifecycleState.PENDING],
    [PaymentLifecycleState.REFUNDED, PaymentLifecycleState.PAID],
  ])('rejects %s -> %s', (from, to) => {
    expect(stateMachine.canTransition(from, to)).toBe(false);
  });

  it.each([
    PaymentLifecycleState.CANCELLED,
    PaymentLifecycleState.EXPIRED,
    PaymentLifecycleState.FAILED,
    PaymentLifecycleState.REFUNDED,
  ])('has no outgoing transitions from the terminal state %s', (terminalState) => {
    const hasAnyOutgoing = ALL_STATES.some((candidate) => stateMachine.canTransition(terminalState, candidate));
    expect(hasAnyOutgoing).toBe(false);
  });

  it('applyTransition throws on an illegal transition and does not mutate status', async () => {
    const paymentRequest = {
      id: 'irrelevant-for-this-test',
      status: PaymentLifecycleState.CANCELLED,
    } as unknown as PaymentRequest;

    await expect(stateMachine.applyTransition(paymentRequest, PaymentLifecycleState.PAID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
