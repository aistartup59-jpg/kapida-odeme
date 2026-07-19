import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

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

  // Optional `manager` lets a caller run this within its own DB transaction (e.g.
  // MerchantPaymentProviderService.activate, which must commit deactivateAllForMerchant
  // and this save together). Omitting it preserves the exact prior behavior.
  save(entity: MerchantPaymentProvider, manager?: EntityManager): Promise<MerchantPaymentProvider> {
    const repository = manager ? manager.getRepository(MerchantPaymentProvider) : this.repository;
    return repository.save(entity);
  }

  findAllByMerchant(merchantId: string): Promise<MerchantPaymentProvider[]> {
    return this.repository.find({ where: { merchantId }, order: { createdAt: 'ASC' } });
  }

  findOneByMerchantAndId(merchantId: string, id: string): Promise<MerchantPaymentProvider | null> {
    return this.repository.findOne({ where: { id, merchantId } });
  }

  async remove(entity: MerchantPaymentProvider): Promise<void> {
    await this.repository.remove(entity);
  }

  async deactivateAllForMerchant(merchantId: string, manager?: EntityManager): Promise<void> {
    const repository = manager ? manager.getRepository(MerchantPaymentProvider) : this.repository;
    await repository.update({ merchantId }, { isActive: false });
  }

  // Locks every row for the merchant in a fixed order (id ASC) before deactivateAllForMerchant's
  // bulk UPDATE runs. Without this, two concurrent activate() calls each running their own
  // multi-row UPDATE can acquire per-row locks in different orders and deadlock (Postgres
  // error 40P01) once the merchant has 3+ provider rows — always locking in the same order
  // is the standard deadlock-avoidance technique for concurrent multi-row updates.
  async lockAllForMerchant(merchantId: string, manager: EntityManager): Promise<void> {
    await manager
      .getRepository(MerchantPaymentProvider)
      .createQueryBuilder('provider')
      .setLock('pessimistic_write')
      .where('provider.merchantId = :merchantId', { merchantId })
      .orderBy('provider.id', 'ASC')
      .getMany();
  }
}
