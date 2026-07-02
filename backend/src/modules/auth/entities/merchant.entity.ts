import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Employee } from './employee.entity';

@Entity({ name: 'merchants' })
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Employee, (employee) => employee.merchant, { cascade: true })
  employees: Employee[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
