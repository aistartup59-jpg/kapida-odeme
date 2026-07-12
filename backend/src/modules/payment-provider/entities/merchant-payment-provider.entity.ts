import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { Merchant } from '../../auth/entities/merchant.entity';
import { ProviderType } from '../enums/provider-type.enum';

@Entity({ name: 'merchant_payment_providers' })
export class MerchantPaymentProvider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid')
  merchantId: string;

  @Column({ type: 'enum', enum: ProviderType })
  providerType: ProviderType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column()
  credentialsReference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
