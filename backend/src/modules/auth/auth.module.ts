import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtConfigService } from './jwt-config.service';
import { PasswordHashingService } from './password-hashing.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Merchant } from './entities/merchant.entity';
import { Employee } from './entities/employee.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Merchant, Employee])],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtConfigService,
    PasswordHashingService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService, JwtConfigService, PasswordHashingService],
})
export class AuthModule {}
