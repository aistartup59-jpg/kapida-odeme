import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentRequest } from '../../payment/entities/payment-request.entity';
import { PaymentMethod } from '../../payment/enums/payment-method.enum';
import { PaymentLifecycleState } from '../../payment/enums/payment-lifecycle-state.enum';
import { decimalTransformer } from '../../../shared/decimal.transformer';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentRequest, (paymentRequest) => paymentRequest.transactions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentRequestId' })
  paymentRequest: PaymentRequest;

  @Column('uuid')
  paymentRequestId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, transformer: decimalTransformer })
  amount: number;

  // Text rather than a DB enum, for the same reason as PaymentRequest.paymentMethod:
  // Transactions are immutable (ADR-012), so pre-ADR-013 PAYMENT_LINK rows stay exactly as
  // they were recorded instead of being rewritten to fit the reduced vocabulary.
  @Column({ type: 'varchar', default: PaymentMethod.QR })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentLifecycleState, default: PaymentLifecycleState.PENDING })
  status: PaymentLifecycleState;

  @Column({ nullable: true })
  providerReference?: string;

  @CreateDateColumn()
  createdAt: Date;
}
