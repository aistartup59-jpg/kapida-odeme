import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Merchant } from '../../auth/entities/merchant.entity';
import { Employee } from '../../auth/entities/employee.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';
import { Currency } from '../enums/currency.enum';
import { DeliveryChannel } from '../enums/delivery-channel.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity({ name: 'payment_requests' })
export class PaymentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.paymentRequests, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid')
  merchantId: string;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee | null;

  @Column('uuid', { nullable: true })
  employeeId?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  paidAmount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.TRY })
  currency: Currency;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.QR })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: DeliveryChannel, default: DeliveryChannel.NONE })
  deliveryChannel: DeliveryChannel;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.paymentRequest, { cascade: true })
  transactions: Transaction[];
}
