import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { Merchant } from '../auth/entities/merchant.entity';
import { PartnerModule } from '../partner/partner.module';
import { PaymentModule } from '../payment/payment.module';
import { MerchantPaymentProvider } from '../payment-provider/entities/merchant-payment-provider.entity';
import { PaymentProviderModule } from '../payment-provider/payment-provider.module';
import { DemoProviderAdapter } from './demo-provider.adapter';
import { DemoProviderConfig } from './demo-provider.config';
import { DemoSeedService } from './demo-seed.service';
import { DemoSettlementService } from './demo-settlement.service';

// A self-contained, deletable module for demonstrations. It lives outside payment-provider on
// purpose: the adapter needs PaymentService to simulate the settlement a real provider would
// deliver by webhook, and PaymentModule already imports PaymentProviderModule — putting it
// with the real adapters would create a circular dependency and, worse, would file a fake
// provider alongside the ones that move real money.
//
// Nothing in here does anything unless DEMO_PAYMENT_PROVIDER=true.
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Merchant, MerchantPaymentProvider]),
    AuthModule,
    PaymentProviderModule,
    PaymentModule,
    PartnerModule,
  ],
  providers: [DemoProviderConfig, DemoSettlementService, DemoProviderAdapter, DemoSeedService],
})
export class DemoModule {}
