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

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.QR })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentLifecycleState, default: PaymentLifecycleState.PENDING })
  status: PaymentLifecycleState;

  @Column({ nullable: true })
  providerReference?: string;

  @CreateDateColumn()
  createdAt: Date;
}
