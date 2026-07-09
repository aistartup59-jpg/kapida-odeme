import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PaymentRequest } from '../../payment/entities/payment-request.entity';
import { PaymentMethod } from '../../payment/enums/payment-method.enum';
import { PaymentStatus } from '../../payment/enums/payment-status.enum';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentRequest, (paymentRequest) => paymentRequest.transactions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentRequestId' })
  paymentRequest: PaymentRequest;

  @Column('uuid')
  paymentRequestId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.QR })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  providerReference?: string;

  @CreateDateColumn()
  createdAt: Date;
}
