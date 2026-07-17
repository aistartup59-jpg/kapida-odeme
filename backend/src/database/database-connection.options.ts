import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { getRequiredDatabasePassword } from './database-password';

type BaseConnectionOptions = Pick<
  PostgresConnectionOptions,
  'type' | 'host' | 'port' | 'username' | 'password' | 'database'
>;

// Shared by the runtime TypeOrmModule (database.module.ts) and the CLI DataSource
// (data-source.ts) so the connection is configured from the same env vars in one place.
export function getDatabaseConnectionOptions(): BaseConnectionOptions {
  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'kapida',
    password: getRequiredDatabasePassword(),
    database: process.env.DATABASE_NAME || 'kapida_dev',
  };
}
