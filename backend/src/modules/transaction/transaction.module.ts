import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentRequest } from '../payment/entities/payment-request.entity';
import { PaymentStateMachineService } from '../payment/state-machine/payment-state-machine.service';
import { TransactionEngineService } from './engine/transaction-engine.service';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, PaymentRequest])],
  controllers: [],
  providers: [TransactionEngineService, PaymentStateMachineService],
  exports: [TransactionEngineService],
})
export class TransactionModule {}
