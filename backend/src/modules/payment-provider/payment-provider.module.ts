import { Module } from '@nestjs/common';

import { ProviderRegistry } from './registry/provider.registry';
import { PaymentProviderFactory } from './factory/payment-provider.factory';
import { ParamPosAdapter } from './adapters/parampos/parampos.adapter';

@Module({
  imports: [],
  controllers: [],
  providers: [ProviderRegistry, PaymentProviderFactory, ParamPosAdapter],
  exports: [ProviderRegistry, PaymentProviderFactory],
})
export class PaymentProviderModule {}
