import { Module } from '@nestjs/common';

import { ProviderRegistry } from './registry/provider.registry';
import { PaymentProviderFactory } from './factory/payment-provider.factory';

@Module({
  imports: [],
  controllers: [],
  providers: [ProviderRegistry, PaymentProviderFactory],
  exports: [ProviderRegistry, PaymentProviderFactory],
})
export class PaymentProviderModule {}
