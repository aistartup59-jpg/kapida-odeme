import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MerchantPaymentProvider } from '../../payment-provider/entities/merchant-payment-provider.entity';

@Injectable()
export class MerchantPaymentProviderRepository {
  constructor(
    @InjectRepository(MerchantPaymentProvider)
    private readonly repository: Repository<MerchantPaymentProvider>,
  ) {}

  create(data: Partial<MerchantPaymentProvider>): MerchantPaymentProvider {
    return this.repository.create(data);
  }

  save(entity: MerchantPaymentProvider): Promise<MerchantPaymentProvider> {
    return this.repository.save(entity);
  }

  findAllByMerchant(merchantId: string): Promise<MerchantPaymentProvider[]> {
    return this.repository.find({ where: { merchantId }, order: { priority: 'ASC', createdAt: 'ASC' } });
  }

  findOneByMerchantAndId(merchantId: string, id: string): Promise<MerchantPaymentProvider | null> {
    return this.repository.findOne({ where: { id, merchantId } });
  }

  async remove(entity: MerchantPaymentProvider): Promise<void> {
    await this.repository.remove(entity);
  }

  async deactivateAllForMerchant(merchantId: string): Promise<void> {
    await this.repository.update({ merchantId }, { isActive: false });
  }
}
