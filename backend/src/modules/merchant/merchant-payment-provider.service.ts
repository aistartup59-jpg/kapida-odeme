import { randomUUID } from 'crypto';

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Merchant } from '../auth/entities/merchant.entity';
import { MerchantPaymentProvider } from '../payment-provider/entities/merchant-payment-provider.entity';
import { ProviderType } from '../payment-provider/enums/provider-type.enum';
import { CredentialVaultService } from '../payment-provider/security/credential-vault.service';
import { CreateMerchantPaymentProviderDto } from './dto/create-merchant-payment-provider.dto';
import { MerchantPaymentProviderResponseDto } from './dto/merchant-payment-provider-response.dto';
import { UpdateMerchantPaymentProviderDto } from './dto/update-merchant-payment-provider.dto';
import { MerchantPaymentProviderRepository } from './repositories/merchant-payment-provider.repository';

interface AuthenticatedUser {
  sub?: string;
  type?: string;
}

@Injectable()
export class MerchantPaymentProviderService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly providerRepository: MerchantPaymentProviderRepository,
    private readonly credentialVault: CredentialVaultService,
  ) {}

  async register(
    user: AuthenticatedUser,
    dto: CreateMerchantPaymentProviderDto,
  ): Promise<MerchantPaymentProviderResponseDto> {
    const merchantId = await this.resolveMerchantId(user);

    const providerType = this.validateProviderType(dto?.providerType);
    this.validateCredentials(dto?.credentials);

    const credentialsReference = randomUUID();
    await this.credentialVault.save(credentialsReference, JSON.stringify(dto.credentials));

    const entity = this.providerRepository.create({
      merchantId,
      providerType,
      credentialsReference,
      isActive: false,
    });

    const saved = await this.providerRepository.save(entity);
    return this.toResponse(saved);
  }

  async findAll(user: AuthenticatedUser): Promise<MerchantPaymentProviderResponseDto[]> {
    const merchantId = await this.resolveMerchantId(user);
    const providers = await this.providerRepository.findAllByMerchant(merchantId);
    return providers.map((provider) => this.toResponse(provider));
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateMerchantPaymentProviderDto,
  ): Promise<MerchantPaymentProviderResponseDto> {
    const merchantId = await this.resolveMerchantId(user);
    const entity = await this.findOwnedProvider(merchantId, id);

    if (dto?.credentials !== undefined) {
      this.validateCredentials(dto.credentials);
      const previousReference = entity.credentialsReference;
      const nextReference = randomUUID();
      await this.credentialVault.save(nextReference, JSON.stringify(dto.credentials));
      entity.credentialsReference = nextReference;
      await this.credentialVault.delete(previousReference);
    }

    const saved = await this.providerRepository.save(entity);
    return this.toResponse(saved);
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const merchantId = await this.resolveMerchantId(user);
    const entity = await this.findOwnedProvider(merchantId, id);

    await this.credentialVault.delete(entity.credentialsReference);
    await this.providerRepository.remove(entity);
  }

  async activate(user: AuthenticatedUser, id: string): Promise<MerchantPaymentProviderResponseDto> {
    const merchantId = await this.resolveMerchantId(user);
    const entity = await this.findOwnedProvider(merchantId, id);

    await this.providerRepository.deactivateAllForMerchant(merchantId);
    entity.isActive = true;
    const saved = await this.providerRepository.save(entity);
    return this.toResponse(saved);
  }

  private async findOwnedProvider(merchantId: string, id: string): Promise<MerchantPaymentProvider> {
    const entity = await this.providerRepository.findOneByMerchantAndId(merchantId, id);
    if (!entity) {
      throw new NotFoundException('Payment provider configuration not found.');
    }
    return entity;
  }

  private async resolveMerchantId(user: AuthenticatedUser): Promise<string> {
    if (!user?.sub || user.type !== 'merchant') {
      throw new UnauthorizedException('Authentication required.');
    }

    const merchant = await this.merchantRepository.findOne({ where: { id: user.sub } });
    if (!merchant) {
      throw new UnauthorizedException('Merchant not found.');
    }

    return merchant.id;
  }

  private validateProviderType(value?: string): ProviderType {
    if (!value || !Object.values(ProviderType).includes(value as ProviderType)) {
      throw new BadRequestException('A valid providerType is required.');
    }
    return value as ProviderType;
  }

  private validateCredentials(credentials?: Record<string, string>): void {
    if (!credentials || typeof credentials !== 'object' || Object.keys(credentials).length === 0) {
      throw new BadRequestException('credentials must be a non-empty object.');
    }

    for (const value of Object.values(credentials)) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new BadRequestException('credentials values must be non-empty strings.');
      }
    }
  }

  private toResponse(entity: MerchantPaymentProvider): MerchantPaymentProviderResponseDto {
    return {
      id: entity.id,
      providerType: entity.providerType,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
