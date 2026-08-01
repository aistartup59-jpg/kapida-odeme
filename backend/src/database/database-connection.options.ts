import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

import { getRequiredDatabasePassword } from './database-password';

type BaseConnectionOptions = Pick<
  PostgresConnectionOptions,
  'type' | 'host' | 'port' | 'username' | 'password' | 'database' | 'ssl'
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
    ...resolveSsl(),
  };
}

// Off by default, which is what a database reached over a private network wants — docker
// compose here, and a managed host's internal address in a deployment. A database exposed
// over the public internet needs it on, so this is a deliberate switch rather than something
// guessed from the hostname.
//
// 'no-verify' additionally stops the certificate being checked. Some managed databases front
// themselves with self-signed certificates and offer no alternative, but it gives up the
// protection SSL was there to provide, so it has to be asked for by name.
function resolveSsl(): Pick<BaseConnectionOptions, 'ssl'> {
  const mode = process.env.DATABASE_SSL?.trim().toLowerCase();

  if (mode === 'no-verify') {
    return { ssl: { rejectUnauthorized: false } };
  }

  if (mode === 'true') {
    return { ssl: { rejectUnauthorized: true } };
  }

  return {};
}
