import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Merchant } from '../../auth/entities/merchant.entity';
import { ProviderId } from '../core/provider-id.model';

@Entity({ name: 'merchant_payment_providers' })
export class MerchantPaymentProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid')
  merchantId: string;

  // Stored as text, not a DB enum (ADR-014): the set of installed providers is owned by
  // ProviderRegistry at runtime, so adding one must never require a schema migration.
  @Column({ type: 'varchar' })
  providerType: ProviderId;

  @Column({ default: false })
  isActive: boolean;

  @Column()
  credentialsReference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
