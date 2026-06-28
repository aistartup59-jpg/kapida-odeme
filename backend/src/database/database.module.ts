import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: Number(process.env.DATABASE_PORT) || 5432,
        username: process.env.DATABASE_USER || 'kapida',
        password: process.env.DATABASE_PASSWORD || 'kapida',
        database: process.env.DATABASE_NAME || 'kapida_dev',
        entities: [],
        synchronize: false,
      }),
    }),
  ],
  providers: [],
  exports: [],
})
export class DatabaseModule {}
