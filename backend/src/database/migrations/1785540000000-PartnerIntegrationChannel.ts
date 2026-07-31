import { MigrationInterface, QueryRunner } from 'typeorm';

// Order platform integration (ADR-015). Two additions:
//
// 1. partner_api_keys — the credential a platform (Uber Eats, Getir, Yemeksepeti, Trendyol
//    Go, ...) presents to verify that a payment was really collected. publicId is stored in
//    the clear so a presented key can be found in one indexed lookup; only the secret half
//    is hashed.
//
// 2. payment_requests.externalOrderId — the platform's own order id, carried in by the
//    hand-off deep link. The unique index is partial, covering only rows that actually have
//    one, so ordinary in-app payments are unaffected while a repeated hand-off for the same
//    order resolves to the existing PaymentRequest instead of charging the customer twice.
export class PartnerIntegrationChannel1785540000000 implements MigrationInterface {
  name = 'PartnerIntegrationChannel1785540000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "partner_api_keys" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "label" character varying NOT NULL,
        "publicId" character varying NOT NULL,
        "secretHash" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_partner_api_keys" PRIMARY KEY ("id"),
        CONSTRAINT "FK_partner_api_keys_merchant" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_partner_api_keys_publicId" ON "partner_api_keys" ("publicId")`);

    await queryRunner.query(`ALTER TABLE "payment_requests" ADD COLUMN "externalOrderId" character varying`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_payment_requests_merchant_external_order"
      ON "payment_requests" ("merchantId", "externalOrderId")
      WHERE "externalOrderId" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_payment_requests_merchant_external_order"`);
    await queryRunner.query(`ALTER TABLE "payment_requests" DROP COLUMN "externalOrderId"`);

    await queryRunner.query(`DROP INDEX "IDX_partner_api_keys_publicId"`);
    await queryRunner.query(`DROP TABLE "partner_api_keys"`);
  }
}
