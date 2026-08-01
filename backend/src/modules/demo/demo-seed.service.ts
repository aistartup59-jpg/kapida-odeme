import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Merchant } from '../auth/entities/merchant.entity';
import { PasswordHashingService } from '../auth/password-hashing.service';
import { MerchantPaymentProvider } from '../payment-provider/entities/merchant-payment-provider.entity';
import { CredentialVaultService } from '../payment-provider/security/credential-vault.service';
import { PartnerApiKeyService } from '../partner/partner-api-key.service';
import { DEMO_PROVIDER_ID } from './demo-provider.adapter';
import { DemoProviderConfig } from './demo-provider.config';

// Creates the account a demo is given from, so a freshly deployed demo environment is ready
// to sign into rather than needing a sequence of curl commands first.
//
// Credentials come from the environment and are never defaulted. A known password committed
// to a repository would be a published login to a publicly reachable server — no real money
// moves there, but anyone could still fill the demo with junk right before a sales call.
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(MerchantPaymentProvider)
    private readonly providerRepository: Repository<MerchantPaymentProvider>,
    private readonly passwordHashing: PasswordHashingService,
    private readonly credentialVault: CredentialVaultService,
    private readonly partnerApiKeyService: PartnerApiKeyService,
    private readonly config: DemoProviderConfig,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const email = this.configService.get<string>('DEMO_SEED_EMAIL')?.trim();
    const password = this.configService.get<string>('DEMO_SEED_PASSWORD')?.trim();

    if (!email || !password) {
      this.logger.log('Demo seeding skipped: DEMO_SEED_EMAIL and DEMO_SEED_PASSWORD are not both set.');
      return;
    }

    // Idempotent: every deploy runs this, and a demo environment that reset its own merchant
    // on each restart would lose whatever was set up for the next demo.
    const existing = await this.merchantRepository.findOne({ where: { email } });

    if (existing) {
      this.logger.log(`Demo merchant already present (${email}).`);
      return;
    }

    const merchant = await this.merchantRepository.save(
      this.merchantRepository.create({
        email,
        businessName: this.configService.get<string>('DEMO_SEED_BUSINESS_NAME', 'PayALS Demo'),
        ownerFullName: this.configService.get<string>('DEMO_SEED_OWNER_NAME', 'PayALS Demo'),
        phoneNumber: this.configService.get<string>('DEMO_SEED_PHONE', '+900000000000'),
        passwordHash: this.passwordHashing.hashPassword(password),
      }),
    );

    await this.attachDemoProvider(merchant.id);

    const key = await this.partnerApiKeyService.issue(merchant.id, 'Demo Platform');

    // Printed once, at creation. The full key is never recoverable afterwards — only its hash
    // is stored — and a demo needs it to mint hand-offs. Issue another through
    // POST /merchant/partner-keys if this scrolls past.
    this.logger.warn(`Demo merchant created: ${email}`);
    this.logger.warn(`Demo partner API key (shown once): ${key.apiKey}`);
  }

  private async attachDemoProvider(merchantId: string): Promise<void> {
    const credentialsReference = `demo-${merchantId}`;
    await this.credentialVault.save(credentialsReference, JSON.stringify({ apiKey: 'demo' }));

    await this.providerRepository.save(
      this.providerRepository.create({
        merchantId,
        providerType: DEMO_PROVIDER_ID,
        credentialsReference,
        isActive: true,
      }),
    );
  }
}
