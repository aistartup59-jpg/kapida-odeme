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
import { decimalTransformer } from '../../../shared/decimal.transformer';
import { Currency } from '../enums/currency.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentLifecycleState } from '../enums/payment-lifecycle-state.enum';

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

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  paidAmount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.TRY })
  currency: Currency;

  // Text rather than a DB enum: rows created before ADR-013 still carry the retired
  // PAYMENT_LINK value, and financial history is never rewritten (ADR-012). New writes are
  // constrained to PaymentMethod by PaymentService, and by a CHECK constraint in the DB.
  @Column({ type: 'varchar', default: PaymentMethod.QR })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentLifecycleState, default: PaymentLifecycleState.PENDING })
  status: PaymentLifecycleState;

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
