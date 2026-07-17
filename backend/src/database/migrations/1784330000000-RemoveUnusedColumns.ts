import { MigrationInterface, QueryRunner } from 'typeorm';

// Drops columns that were never written or read by any code path (dead, speculative state
// left over from earlier scaffolding) and fixes a stale default that no code path ever
// actually exercises. Mirrors the corresponding @Entity changes column-for-column.
export class RemoveUnusedColumns1784330000000 implements MigrationInterface {
  name = 'RemoveUnusedColumns1784330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "merchants" DROP COLUMN "isVerified"`);

    await queryRunner.query(`ALTER TABLE "merchant_sessions" DROP COLUMN "deviceName"`);
    await queryRunner.query(`ALTER TABLE "merchant_sessions" DROP COLUMN "ipAddress"`);
    await queryRunner.query(`ALTER TABLE "merchant_sessions" DROP COLUMN "userAgent"`);

    await queryRunner.query(`ALTER TABLE "merchant_payment_providers" DROP COLUMN "priority"`);
    // register() always sets isActive: false explicitly; the DB default of true was never
    // actually exercised by any code path and misrepresented the real behavior.
    await queryRunner.query(`ALTER TABLE "merchant_payment_providers" ALTER COLUMN "isActive" SET DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "merchant_payment_providers" ALTER COLUMN "isActive" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "merchant_payment_providers" ADD COLUMN "priority" integer NOT NULL DEFAULT 0`);

    await queryRunner.query(`ALTER TABLE "merchant_sessions" ADD COLUMN "userAgent" character varying`);
    await queryRunner.query(`ALTER TABLE "merchant_sessions" ADD COLUMN "ipAddress" character varying`);
    await queryRunner.query(`ALTER TABLE "merchant_sessions" ADD COLUMN "deviceName" character varying`);

    await queryRunner.query(`ALTER TABLE "merchants" ADD COLUMN "isVerified" boolean NOT NULL DEFAULT false`);
  }
}
