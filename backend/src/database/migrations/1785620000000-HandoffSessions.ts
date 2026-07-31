import { MigrationInterface, QueryRunner } from 'typeorm';

// A courier delivering for an order platform never signs in (ADR-015). This table is what
// authorises their device instead: one row grants the right to collect exactly one
// PaymentRequest, for a few hours, and nothing else.
//
// The row is created by the platform's backend — the only party holding the merchant's API
// key — so the amount presented on the courier's device was authorised by a server rather
// than proposed by an app running next to it.
export class HandoffSessions1785620000000 implements MigrationInterface {
  name = 'HandoffSessions1785620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "handoff_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paymentRequestId" uuid NOT NULL,
        "publicId" character varying NOT NULL,
        "secretHash" character varying NOT NULL,
        "expiresAt" timestamp NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_handoff_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_handoff_sessions_payment_request" FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_handoff_sessions_publicId" ON "handoff_sessions" ("publicId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_handoff_sessions_publicId"`);
    await queryRunner.query(`DROP TABLE "handoff_sessions"`);
  }
}
