import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PasswordHashingService } from './password-hashing.service';
import { Merchant } from './entities/merchant.entity';
import { CreateMerchantDto } from './dto/create-merchant.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly passwordHashingService: PasswordHashingService,
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

  loginMerchant(): Promise<void> {
    // Login logic to be implemented later.
    return Promise.resolve();
  }

  refreshToken(): Promise<void> {
    // Refresh token logic to be implemented later.
    return Promise.resolve();
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
