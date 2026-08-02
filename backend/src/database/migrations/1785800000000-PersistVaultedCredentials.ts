import { MigrationInterface, QueryRunner } from 'typeorm';

// Until now the credential vault kept merchant provider credentials in a process-local Map,
// self-documented as a placeholder. That meant every restart and every deploy silently wiped
// them, and a second instance could not read what the first had stored — so a merchant's
// configured provider would stop working with no error anyone could see coming.
//
// The table stores ciphertext only, keyed by the opaque reference the merchant_payment_providers
// row already points at. There is no foreign key in that direction on purpose: a reference is
// written before the row that will point at it, and the old reference outlives the row that
// used to, so the two lifecycles are ordered rather than constrained.
export class PersistVaultedCredentials1785800000000 implements MigrationInterface {
  name = 'PersistVaultedCredentials1785800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "vaulted_credentials" (
        "reference" character varying NOT NULL,
        "iv" character varying NOT NULL,
        "authTag" character varying NOT NULL,
        "content" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vaulted_credentials" PRIMARY KEY ("reference")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vaulted_credentials"`);
  }
}
