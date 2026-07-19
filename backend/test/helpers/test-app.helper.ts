import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import { AppModule } from '../../src/app.module';

// All tables in FK-safe order is unnecessary thanks to CASCADE, but listed for clarity.
const ALL_TABLES = [
  'transactions',
  'payment_requests',
  'merchant_payment_providers',
  'merchant_sessions',
  'employees',
  'merchants',
];

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();

  return app;
}

export async function clearDatabase(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  await dataSource.query(`TRUNCATE TABLE ${ALL_TABLES.map((table) => `"${table}"`).join(', ')} RESTART IDENTITY CASCADE`);
}
