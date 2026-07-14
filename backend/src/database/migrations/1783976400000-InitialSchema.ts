import { MigrationInterface, QueryRunner } from 'typeorm';

// Baseline schema for every entity that exists today: Merchant, Employee, MerchantSession,
// MerchantPaymentProvider, PaymentRequest, Transaction. Mirrors the current @Entity
// definitions column-for-column; introduces no schema beyond what they already declare.
export class InitialSchema1783976400000 implements MigrationInterface {
  name = 'InitialSchema1783976400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "merchants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "businessName" character varying NOT NULL,
        "ownerFullName" character varying NOT NULL,
        "phoneNumber" character varying NOT NULL,
        "passwordHash" character varying,
        "isVerified" boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_merchants_email" UNIQUE ("email"),
        CONSTRAINT "UQ_merchants_phoneNumber" UNIQUE ("phoneNumber")
      )
    `);

    await queryRunner.query(`CREATE TYPE "employees_role_enum" AS ENUM('OWNER', 'MANAGER', 'EMPLOYEE')`);
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying,
        "invitationTokenHash" character varying,
        "invitationExpiresAt" timestamp,
        "isActive" boolean NOT NULL DEFAULT false,
        "invitationAccepted" boolean NOT NULL DEFAULT false,
        "role" "employees_role_enum" NOT NULL DEFAULT 'EMPLOYEE',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employees" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_employees_email" UNIQUE ("email"),
        CONSTRAINT "FK_employees_merchant" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "merchant_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "employeeId" uuid,
        "refreshTokenHash" character varying NOT NULL,
        "deviceName" character varying,
        "ipAddress" character varying,
        "userAgent" character varying,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "lastUsedAt" timestamp,
        "expiresAt" timestamp NOT NULL,
        "revokedAt" timestamp,
        CONSTRAINT "PK_merchant_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_merchant_sessions_merchant" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "merchant_payment_providers_providertype_enum" AS ENUM('PARAM_POS', 'IYZICO', 'PAY_TR', 'SIPAY')`,
    );
    await queryRunner.query(`
      CREATE TABLE "merchant_payment_providers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "providerType" "merchant_payment_providers_providertype_enum" NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "priority" integer NOT NULL DEFAULT 0,
        "credentialsReference" character varying NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_payment_providers" PRIMARY KEY ("id"),
        CONSTRAINT "FK_merchant_payment_providers_merchant" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE TYPE "payment_requests_currency_enum" AS ENUM('TRY', 'USD', 'EUR')`);
    await queryRunner.query(
      `CREATE TYPE "payment_requests_paymentmethod_enum" AS ENUM('QR', 'PAYMENT_LINK', 'NFC', 'CASH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_requests_deliverychannel_enum" AS ENUM('NONE', 'SMS', 'WHATSAPP', 'COPY_LINK')`,
    );
    await queryRunner.query(
      `CREATE TYPE "payment_requests_status_enum" AS ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'REFUNDED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "payment_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "merchantId" uuid NOT NULL,
        "employeeId" uuid,
        "totalAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "paidAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "currency" "payment_requests_currency_enum" NOT NULL DEFAULT 'TRY',
        "paymentMethod" "payment_requests_paymentmethod_enum" NOT NULL DEFAULT 'QR',
        "deliveryChannel" "payment_requests_deliverychannel_enum" NOT NULL DEFAULT 'NONE',
        "status" "payment_requests_status_enum" NOT NULL DEFAULT 'PENDING',
        "description" character varying,
        "expiresAt" timestamp,
        "paidAt" timestamp,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_requests_merchant" FOREIGN KEY ("merchantId") REFERENCES "merchants"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payment_requests_employee" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "transactions_paymentmethod_enum" AS ENUM('QR', 'PAYMENT_LINK', 'NFC', 'CASH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "transactions_status_enum" AS ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'REFUNDED')`,
    );
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paymentRequestId" uuid NOT NULL,
        "amount" numeric(12,2) NOT NULL DEFAULT 0,
        "paymentMethod" "transactions_paymentmethod_enum" NOT NULL DEFAULT 'QR',
        "status" "transactions_status_enum" NOT NULL DEFAULT 'PENDING',
        "providerReference" character varying,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_transactions_payment_request" FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "transactions_status_enum"`);
    await queryRunner.query(`DROP TYPE "transactions_paymentmethod_enum"`);

    await queryRunner.query(`DROP TABLE "payment_requests"`);
    await queryRunner.query(`DROP TYPE "payment_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE "payment_requests_deliverychannel_enum"`);
    await queryRunner.query(`DROP TYPE "payment_requests_paymentmethod_enum"`);
    await queryRunner.query(`DROP TYPE "payment_requests_currency_enum"`);

    await queryRunner.query(`DROP TABLE "merchant_payment_providers"`);
    await queryRunner.query(`DROP TYPE "merchant_payment_providers_providertype_enum"`);

    await queryRunner.query(`DROP TABLE "merchant_sessions"`);

    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(`DROP TYPE "employees_role_enum"`);

    await queryRunner.query(`DROP TABLE "merchants"`);
  }
}
