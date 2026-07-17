import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NoActiveProviderException } from '../common/exceptions/no-active-provider.exception';
import { MerchantPaymentProvider } from '../entities/merchant-payment-provider.entity';
import { ProviderType } from '../enums/provider-type.enum';
import { PaymentProviderFactory } from '../factory/payment-provider.factory';
import { PaymentProvider } from '../interfaces/payment-provider.interface';

export interface ResolvedProvider {
  provider: PaymentProvider;
  providerType: ProviderType;
  credentialsReference: string;
}

@Injectable()
export class ProviderResolverService {
  constructor(
    @InjectRepository(MerchantPaymentProvider)
    private readonly merchantPaymentProviderRepository: Repository<MerchantPaymentProvider>,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  async resolveActiveProvider(merchantId: string): Promise<ResolvedProvider> {
    const merchantProvider = await this.merchantPaymentProviderRepository.findOne({
      where: { merchantId, isActive: true },
    });

    if (!merchantProvider) {
      throw new NoActiveProviderException(merchantId);
    }

    return {
      provider: this.providerFactory.getProvider(merchantProvider.providerType),
      providerType: merchantProvider.providerType,
      credentialsReference: merchantProvider.credentialsReference,
    };
  }
}
