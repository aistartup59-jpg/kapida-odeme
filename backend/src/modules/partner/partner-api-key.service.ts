import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SplitCredentialService } from './credentials/split-credential.service';
import { PartnerApiKey } from './entities/partner-api-key.entity';

export interface IssuedPartnerApiKey {
  id: string;
  label: string;
  publicId: string;
  isActive: boolean;
  createdAt: Date;
  // The full key, returned exactly once at issue time. Only its hash is stored, so it can
  // never be recovered afterwards — a merchant who loses it issues a new one.
  apiKey: string;
}

export interface PartnerApiKeySummary {
  id: string;
  label: string;
  publicId: string;
  isActive: boolean;
  createdAt: Date;
}

// Parsing is prefix-exact, so changing this invalidates every key already handed to a
// platform. It is settled before any key is issued, not after.
export const PARTNER_API_KEY_PREFIX = 'pay';

@Injectable()
export class PartnerApiKeyService {
  constructor(
    @InjectRepository(PartnerApiKey)
    private readonly partnerApiKeyRepository: Repository<PartnerApiKey>,
    private readonly credentials: SplitCredentialService,
  ) {}

  async issue(merchantId: string, label?: string): Promise<IssuedPartnerApiKey> {
    const normalizedLabel = label?.trim();

    if (!normalizedLabel) {
      throw new BadRequestException('label is required.');
    }

    const credential = this.credentials.issue(PARTNER_API_KEY_PREFIX);

    const saved = await this.partnerApiKeyRepository.save(
      this.partnerApiKeyRepository.create({
        merchantId,
        label: normalizedLabel,
        publicId: credential.publicId,
        secretHash: this.credentials.hash(credential.secret),
        isActive: true,
      }),
    );

    return { ...this.toSummary(saved), apiKey: credential.token };
  }

  findAllByMerchant(merchantId: string): Promise<PartnerApiKey[]> {
    return this.partnerApiKeyRepository.find({ where: { merchantId }, order: { createdAt: 'ASC' } });
  }

  async revoke(merchantId: string, id: string): Promise<void> {
    const key = await this.partnerApiKeyRepository.findOne({ where: { id, merchantId } });

    if (!key) {
      throw new NotFoundException('Partner API key not found.');
    }

    await this.partnerApiKeyRepository.remove(key);
  }

  // Returns the merchant the presented key belongs to, or null when the key is malformed,
  // unknown, revoked, or its secret does not match. Callers must not distinguish between
  // those cases to the client — every one of them is simply an unauthenticated request.
  async resolveMerchantId(presentedKey?: string): Promise<string | null> {
    const parsed = this.credentials.parse(presentedKey, PARTNER_API_KEY_PREFIX);

    if (!parsed) {
      return null;
    }

    const key = await this.partnerApiKeyRepository.findOne({ where: { publicId: parsed.publicId } });

    if (!key || !key.isActive) {
      return null;
    }

    return this.credentials.verify(parsed.secret, key.secretHash) ? key.merchantId : null;
  }

  toSummary(key: PartnerApiKey): PartnerApiKeySummary {
    return {
      id: key.id,
      label: key.label,
      publicId: key.publicId,
      isActive: key.isActive,
      createdAt: key.createdAt,
    };
  }
}
