import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProviderRegistry } from './registry/provider.registry';
import { PaymentProviderFactory } from './factory/payment-provider.factory';
import { ParamPosConfig } from './adapters/parampos/parampos.config';
import { ParamPosClient } from './adapters/parampos/parampos.client';
import { ParamPosAdapter } from './adapters/parampos/parampos.adapter';
import { MerchantPaymentProvider } from './entities/merchant-payment-provider.entity';
import { ProviderResolverService } from './resolver/provider-resolver.service';
import { CredentialEncryptionService } from './security/credential-encryption.service';
import { CredentialVaultService } from './security/credential-vault.service';

@Module({
  imports: [TypeOrmModule.forFeature([MerchantPaymentProvider])],
  controllers: [],
  providers: [
    ProviderRegistry,
    PaymentProviderFactory,
    ProviderResolverService,
    ParamPosConfig,
    ParamPosClient,
    ParamPosAdapter,
    CredentialEncryptionService,
    CredentialVaultService,
  ],
  exports: [ProviderRegistry, PaymentProviderFactory, ProviderResolverService, CredentialVaultService],
})
export class PaymentProviderModule {}
