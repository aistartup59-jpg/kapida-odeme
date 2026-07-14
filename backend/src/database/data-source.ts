import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { getDatabaseConnectionOptions } from './database-connection.options';

config();

// CLI-only entry point for `migration:generate` / `migration:run` / `migration:revert`.
// The running application uses TypeOrmModule (database.module.ts) instead; both share
// the same connection options via getDatabaseConnectionOptions().
export default new DataSource({
  ...getDatabaseConnectionOptions(),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
