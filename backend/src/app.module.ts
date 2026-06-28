import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule } from './database/database.module';
import { SharedModule } from './shared/shared.module';

// Feature modules (skeletons)
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { PaymentModule } from './modules/payment/payment.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { PaymentProviderModule } from './modules/payment-provider/payment-provider.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SharedModule,
    AuthModule,
    MerchantModule,
    PaymentModule,
    TransactionModule,
    PaymentProviderModule,
    NotificationModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
