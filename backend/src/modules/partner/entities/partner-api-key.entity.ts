import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Merchant } from '../../auth/entities/merchant.entity';

// Credential an order platform (Uber Eats, Getir, Yemeksepeti, Trendyol Go, ...) presents to
// open payment requests for one merchant (ADR-015). The issued key reads
// `kpd_<publicId>_<secret>`: publicId is stored in the clear so a presented key can be looked
// up in one indexed query, and only the secret half is hashed — the same split the auth
// module already relies on for refresh and invitation tokens, which are looked up by their
// owning row rather than by the token itself.
@Entity({ name: 'partner_api_keys' })
export class PartnerApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  @Column('uuid')
  merchantId: string;

  // Names the integration this key was issued to, so a merchant can revoke one platform
  // without cutting off the others.
  @Column()
  label: string;

  @Index({ unique: true })
  @Column()
  publicId: string;

  @Column()
  secretHash: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
