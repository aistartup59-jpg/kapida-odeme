import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Merchant } from './merchant.entity';

@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, (merchant) => merchant.employees, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid')
  merchantId: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: false })
  invitationAccepted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
