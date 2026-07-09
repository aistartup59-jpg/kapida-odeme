import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { MerchantSession } from './merchant-session.entity';
import { PaymentRequest } from '../../payment/entities/payment-request.entity';

@Entity({ name: 'merchants' })
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  businessName: string;

  @Column()
  ownerFullName: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Employee, (employee) => employee.merchant, { cascade: true })
  employees: Employee[];

  @OneToMany(() => MerchantSession, (session) => session.merchant, { cascade: true })
  sessions: MerchantSession[];

  @OneToMany(() => PaymentRequest, (paymentRequest) => paymentRequest.merchant, { cascade: true })
  paymentRequests: PaymentRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
