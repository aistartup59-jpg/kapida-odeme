import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Merchant } from '../auth/entities/merchant.entity';
import { MerchantPaymentProvider } from '../payment-provider/entities/merchant-payment-provider.entity';
import { PaymentProviderModule } from '../payment-provider/payment-provider.module';
import { MerchantPaymentProviderController } from './merchant-payment-provider.controller';
import { MerchantPaymentProviderService } from './merchant-payment-provider.service';
import { MerchantPaymentProviderRepository } from './repositories/merchant-payment-provider.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Merchant, MerchantPaymentProvider]), PaymentProviderModule],
  controllers: [MerchantPaymentProviderController],
  providers: [MerchantPaymentProviderService, MerchantPaymentProviderRepository],
})
export class MerchantModule {}
