import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Merchant } from './merchant.entity';

@Entity({ name: 'merchant_sessions' })
export class MerchantSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  merchantId: string;

  @Column('uuid', { nullable: true })
  employeeId?: string;

  @Column()
  refreshTokenHash: string;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @ManyToOne(() => Merchant, (merchant) => merchant.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;
}
