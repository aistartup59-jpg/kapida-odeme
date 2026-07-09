import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRequest } from './entities/payment-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRequest])],
  controllers: [],
  providers: [],
})
export class PaymentModule {}
