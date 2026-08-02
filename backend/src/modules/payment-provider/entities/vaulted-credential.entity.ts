import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Ciphertext at rest for one merchant's credentials with one provider.
//
// The table knows nothing about which provider the secret belongs to, or what shape it has:
// the caller hands over an opaque reference and an already-serialised string, and gets the
// same string back. That is deliberate (ADR-014) — a provider is a free-form id resolved at
// runtime, so adding one must never require a column here.
//
// Only the ciphertext lives in the database. The key is derived from
// CREDENTIAL_ENCRYPTION_SECRET, which is required at startup and never stored, so a stolen
// database dump on its own does not yield credentials.
@Entity({ name: 'vaulted_credentials' })
export class VaultedCredential {
  // Supplied by the caller, not generated here — the merchant_payment_providers row points
  // at this value, and rotating credentials means writing a new reference and dropping the
  // old one, never rewriting a row in place.
  //
  // Text rather than uuid: the reference is opaque, and callers already mint it in more than
  // one shape (a bare uuid when a merchant registers a provider, a prefixed one when the demo
  // environment seeds itself). Constraining the format here would only move that decision.
  @PrimaryColumn({ type: 'varchar' })
  reference: string;

  @Column({ type: 'varchar' })
  iv: string;

  @Column({ type: 'varchar' })
  authTag: string;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
