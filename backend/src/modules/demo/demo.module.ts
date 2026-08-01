import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PaymentModule } from '../payment/payment.module';
import { PaymentProviderModule } from '../payment-provider/payment-provider.module';
import { DemoProviderAdapter } from './demo-provider.adapter';
import { DemoProviderConfig } from './demo-provider.config';
import { DemoSettlementService } from './demo-settlement.service';

// A self-contained, deletable module for demonstrations. It lives outside payment-provider on
// purpose: the adapter needs PaymentService to simulate the settlement a real provider would
// deliver by webhook, and PaymentModule already imports PaymentProviderModule — putting it
// with the real adapters would create a circular dependency and, worse, would file a fake
// provider alongside the ones that move real money.
//
// The adapter registers itself only when DEMO_PAYMENT_PROVIDER=true.
@Module({
  imports: [ConfigModule, PaymentProviderModule, PaymentModule],
  providers: [DemoProviderConfig, DemoSettlementService, DemoProviderAdapter],
})
export class DemoModule {}
