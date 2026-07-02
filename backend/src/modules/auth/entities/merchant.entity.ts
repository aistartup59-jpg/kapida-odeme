import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';

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

  @Column({ nullable: true })
  refreshTokenHash?: string;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Employee, (employee) => employee.merchant, { cascade: true })
  employees: Employee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
