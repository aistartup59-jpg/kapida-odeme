import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentRequest } from '../payment/entities/payment-request.entity';
import { PaymentModule } from '../payment/payment.module';
import { TransactionEngineService } from './engine/transaction-engine.service';
import { Transaction } from './entities/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, PaymentRequest]), PaymentModule],
  controllers: [],
  providers: [TransactionEngineService],
  exports: [TransactionEngineService],
})
export class TransactionModule {}
