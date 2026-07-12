import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Employee } from '../auth/entities/employee.entity';
import { Merchant } from '../auth/entities/merchant.entity';
import { MerchantPaymentProvider } from '../payment-provider/entities/merchant-payment-provider.entity';
import { PaymentProviderModule } from '../payment-provider/payment-provider.module';
import { TransactionModule } from '../transaction/transaction.module';
import { PaymentEngineService } from './engine/payment-engine.service';
import { PaymentRequest } from './entities/payment-request.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentStateMachineService } from './state-machine/payment-state-machine.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentRequest, Merchant, Employee, MerchantPaymentProvider]),
    PaymentProviderModule,
    TransactionModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentEngineService, PaymentStateMachineService],
  exports: [PaymentEngineService, PaymentStateMachineService],
})
export class PaymentModule {}
