import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Employee } from '../auth/entities/employee.entity';
import { Merchant } from '../auth/entities/merchant.entity';
import { PaymentRequest } from './entities/payment-request.entity';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRequest, Merchant, Employee])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
