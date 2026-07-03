import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { PasswordHashingService } from './password-hashing.service';
import { Merchant } from './entities/merchant.entity';
import { MerchantSession } from './entities/merchant-session.entity';
import { JwtConfigService } from './jwt-config.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { MerchantLoginDto } from './dto/merchant-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(MerchantSession)
    private readonly merchantSessionRepository: Repository<MerchantSession>,
    private readonly passwordHashingService: PasswordHashingService,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  async registerMerchant(payload: CreateMerchantDto): Promise<{ success: true }> {
    if (!payload.businessName?.trim()) {
      throw new BadRequestException('Business name is required.');
    }

    if (!payload.ownerFullName?.trim()) {
      throw new BadRequestException('Owner full name is required.');
    }

    if (!payload.phoneNumber?.trim()) {
      throw new BadRequestException('Phone number is required.');
    }

    if (!payload.email?.trim()) {
      throw new BadRequestException('Email is required.');
    }

    if (!payload.password?.trim()) {
      throw new BadRequestException('Password is required.');
    }

    const existingMerchant = await this.merchantRepository.findOne({
      where: [
        { email: payload.email },
        { phoneNumber: payload.phoneNumber },
      ],
    });

    if (existingMerchant) {
      if (existingMerchant.email === payload.email) {
        throw new ConflictException('Email already exists.');
      }
      throw new ConflictException('Phone number already exists.');
    }

    const merchant = this.merchantRepository.create({
      email: payload.email,
      businessName: payload.businessName,
      ownerFullName: payload.ownerFullName,
      phoneNumber: payload.phoneNumber,
      passwordHash: this.passwordHashingService.hashPassword(payload.password),
    });

    await this.merchantRepository.save(merchant);
    return { success: true };
  }

  async loginMerchant(payload: MerchantLoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    if (!payload.email?.trim() || !payload.password?.trim()) {
      throw new BadRequestException('Email and password are required.');
    }

    const merchant = await this.merchantRepository.findOne({ where: { email: payload.email } });
    if (!merchant || !merchant.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = this.passwordHashingService.verifyPassword(payload.password, merchant.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = this.passwordHashingService.hashPassword(refreshToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.getRefreshTokenExpiryMs());

    const session = this.merchantSessionRepository.create({
      merchantId: merchant.id,
      refreshTokenHash,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    });

    await this.merchantSessionRepository.save(session);

    const accessToken = this.jwtService.sign({
      sub: merchant.id,
      type: 'merchant',
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(payload: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    if (!payload?.refreshToken?.trim()) {
      throw new BadRequestException('Refresh token is required.');
    }

    const sessions = await this.merchantSessionRepository.find();
    const now = new Date();

    for (const session of sessions) {
      const isValidRefreshToken = this.passwordHashingService.verifyPassword(payload.refreshToken, session.refreshTokenHash);
      if (!isValidRefreshToken) {
        continue;
      }

      const newRefreshToken = randomBytes(32).toString('hex');
      const newRefreshTokenHash = this.passwordHashingService.hashPassword(newRefreshToken);

      session.refreshTokenHash = newRefreshTokenHash;
      session.lastUsedAt = now;
      await this.merchantSessionRepository.save(session);

      const accessToken = this.jwtService.sign({ sub: session.merchantId, type: 'merchant' });

      return { accessToken, refreshToken: newRefreshToken };
    }

    throw new UnauthorizedException('Invalid refresh token.');
  }

  private getRefreshTokenExpiryMs(): number {
    const value = this.jwtConfigService.refreshTokenExpiresIn?.toLowerCase();

    if (!value) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    switch (match[2]) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

  logout(): Promise<void> {
    // Logout logic to be implemented later.
    return Promise.resolve();
  }

  forgotPassword(): Promise<void> {
    // Forgot password logic to be implemented later.
    return Promise.resolve();
  }

  resetPassword(): Promise<void> {
    // Reset password logic to be implemented later.
    return Promise.resolve();
  }

  createEmployee(): Promise<void> {
    // Employee creation logic to be implemented later.
    return Promise.resolve();
  }

  acceptInvitation(): Promise<void> {
    // Invitation acceptance logic to be implemented later.
    return Promise.resolve();
  }

  setPassword(): Promise<void> {
    // Employee password setup logic to be implemented later.
    return Promise.resolve();
  }

  loginEmployee(): Promise<void> {
    // Employee login logic to be implemented later.
    return Promise.resolve();
  }
}
