import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { PaymentRequest } from '../../payment/entities/payment-request.entity';

// Grants a courier's device the right to collect exactly one payment, without signing in
// (ADR-015). The token is minted by the order platform's backend — the only party that holds
// the merchant's API key — so the amount the courier's device presents was authorised by a
// server, not proposed by an app on that device.
//
// Scope is deliberately as narrow as it can be: one PaymentRequest, for a few hours. There is
// no session to steal beyond a single collection that is about to happen anyway.
@Entity({ name: 'handoff_sessions' })
export class HandoffSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentRequest, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentRequestId' })
  paymentRequest: PaymentRequest;

  @Column('uuid')
  paymentRequestId: string;

  @Index({ unique: true })
  @Column()
  publicId: string;

  @Column()
  secretHash: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
