import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';
import { SplitCredentialService } from './credentials/split-credential.service';
import { HandoffSession } from './entities/handoff-session.entity';
import { PartnerApiKey } from './entities/partner-api-key.entity';
import { HandoffController } from './handoff.controller';
import { HandoffSessionService } from './handoff-session.service';
import { HandoffTokenGuard } from './guards/handoff-token.guard';
import { MerchantPartnerKeyController } from './merchant-partner-key.controller';
import { PartnerApiKeyService } from './partner-api-key.service';
import { PartnerApiKeyGuard } from './guards/partner-api-key.guard';
import { PartnerController } from './partner.controller';

// Order platform integration (ADR-015). Reads and writes payments through PaymentService
// rather than touching the repositories directly, so both the platform's backend and the
// courier's login-free device inherit the same remaining-amount derivation, the same
// lifecycle rules, and the same ledger guarantees as every other caller.
@Module({
  imports: [TypeOrmModule.forFeature([PartnerApiKey, HandoffSession]), AuthModule, PaymentModule],
  controllers: [PartnerController, HandoffController, MerchantPartnerKeyController],
  providers: [
    SplitCredentialService,
    PartnerApiKeyService,
    PartnerApiKeyGuard,
    HandoffSessionService,
    HandoffTokenGuard,
  ],
  exports: [PartnerApiKeyService, HandoffSessionService],
})
export class PartnerModule {}
