import { MigrationInterface, QueryRunner } from 'typeorm';

// Two related schema changes, both of which must preserve every existing row:
//
// 1. ADR-013 reduces PaymentMethod to QR, NFC and CASH and retires PAYMENT_LINK along with
//    the whole DeliveryChannel concept. Financial history is immutable (ADR-012), so no
//    PaymentRequest or Transaction row is rewritten: the enum columns become text, and a
//    CHECK constraint keeps the retired PAYMENT_LINK value legal for the rows that already
//    carry it while still rejecting anything outside the recorded vocabulary. deliveryChannel
//    is renamed rather than dropped so its recorded values survive.
//
// 2. ADR-014 makes the provider vocabulary open: merchant_payment_providers.providerType
//    stops being a DB enum, because which providers exist is decided by ProviderRegistry at
//    runtime. Onboarding iyzico, PayTR or a bank gateway must not require a migration.
export class PosOnlyPaymentMethodsAndOpenProviderRegistry1785456000000 implements MigrationInterface {
  name = 'PosOnlyPaymentMethodsAndOpenProviderRegistry1785456000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The enum-typed default has to go before the column type changes; Postgres cannot cast
    // an existing default across types on its own.
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "paymentMethod" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ALTER COLUMN "paymentMethod" TYPE character varying USING "paymentMethod"::text`,
    );
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "paymentMethod" SET DEFAULT 'QR'`);
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ADD CONSTRAINT "CHK_payment_requests_paymentMethod" CHECK ("paymentMethod" IN ('QR', 'NFC', 'CASH', 'PAYMENT_LINK'))`,
    );
    await queryRunner.query(`DROP TYPE "payment_requests_paymentmethod_enum"`);

    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" TYPE character varying USING "paymentMethod"::text`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" SET DEFAULT 'QR'`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "CHK_transactions_paymentMethod" CHECK ("paymentMethod" IN ('QR', 'NFC', 'CASH', 'PAYMENT_LINK'))`,
    );
    await queryRunner.query(`DROP TYPE "transactions_paymentmethod_enum"`);

    // Renamed, not dropped: the column no longer belongs to the domain model, but the values
    // already recorded against past payment requests are real history. The default and NOT
    // NULL come off so new rows record NULL ("not applicable") instead of a meaningless 'NONE'.
    await queryRunner.query(
      `ALTER TABLE "payment_requests" RENAME COLUMN "deliveryChannel" TO "legacyDeliveryChannel"`,
    );
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "legacyDeliveryChannel" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "legacyDeliveryChannel" DROP NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE "merchant_payment_providers" ALTER COLUMN "providerType" TYPE character varying USING "providerType"::text`,
    );
    await queryRunner.query(`DROP TYPE "merchant_payment_providers_providertype_enum"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverting providerType to the original closed enum only succeeds while every stored
    // value is one of the four it originally held. A merchant configured against a provider
    // onboarded after ADR-014 has to be removed before this migration can be rolled back —
    // that is inherent to reintroducing a closed vocabulary, not a defect in this script.
    await queryRunner.query(
      `CREATE TYPE "merchant_payment_providers_providertype_enum" AS ENUM('PARAM_POS', 'IYZICO', 'PAY_TR', 'SIPAY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "merchant_payment_providers" ALTER COLUMN "providerType" TYPE "merchant_payment_providers_providertype_enum" USING "providerType"::"merchant_payment_providers_providertype_enum"`,
    );

    await queryRunner.query(
      `UPDATE "payment_requests" SET "legacyDeliveryChannel" = 'NONE' WHERE "legacyDeliveryChannel" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "legacyDeliveryChannel" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "legacyDeliveryChannel" SET DEFAULT 'NONE'`);
    await queryRunner.query(
      `ALTER TABLE "payment_requests" RENAME COLUMN "legacyDeliveryChannel" TO "deliveryChannel"`,
    );

    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "CHK_transactions_paymentMethod"`);
    await queryRunner.query(
      `CREATE TYPE "transactions_paymentmethod_enum" AS ENUM('QR', 'PAYMENT_LINK', 'NFC', 'CASH')`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" TYPE "transactions_paymentmethod_enum" USING "paymentMethod"::"transactions_paymentmethod_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "paymentMethod" SET DEFAULT 'QR'`);

    await queryRunner.query(`ALTER TABLE "payment_requests" DROP CONSTRAINT "CHK_payment_requests_paymentMethod"`);
    await queryRunner.query(
      `CREATE TYPE "payment_requests_paymentmethod_enum" AS ENUM('QR', 'PAYMENT_LINK', 'NFC', 'CASH')`,
    );
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "paymentMethod" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "payment_requests" ALTER COLUMN "paymentMethod" TYPE "payment_requests_paymentmethod_enum" USING "paymentMethod"::"payment_requests_paymentmethod_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "payment_requests" ALTER COLUMN "paymentMethod" SET DEFAULT 'QR'`);
  }
}
