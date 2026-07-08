import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';

import { PasswordHashingService } from './password-hashing.service';
import { Merchant } from './entities/merchant.entity';
import { MerchantSession } from './entities/merchant-session.entity';
import { Employee } from './entities/employee.entity';
import { JwtConfigService } from './jwt-config.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { MerchantLoginDto } from './dto/merchant-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { EmployeeLoginDto } from './dto/employee-login.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(MerchantSession)
    private readonly merchantSessionRepository: Repository<MerchantSession>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
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

      if (session.revokedAt) {
        throw new UnauthorizedException('Invalid refresh token.');
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

  async logout(user?: { sub?: string; type?: string }): Promise<{ success: true }> {
    if (!user?.sub || user.type !== 'merchant') {
      throw new UnauthorizedException('Authentication required.');
    }

    const session = await this.merchantSessionRepository.findOne({
      where: { merchantId: user.sub, revokedAt: IsNull() },
      order: { lastUsedAt: 'DESC', createdAt: 'DESC' },
    });

    if (!session) {
      throw new UnauthorizedException('Session is already revoked.');
    }

    const now = new Date();
    session.revokedAt = now;
    session.lastUsedAt = now;

    await this.merchantSessionRepository.save(session);

    return { success: true };
  }

  forgotPassword(): Promise<void> {
    // Forgot password logic to be implemented later.
    return Promise.resolve();
  }

  resetPassword(): Promise<void> {
    // Reset password logic to be implemented later.
    return Promise.resolve();
  }

  async createEmployee(
    payload: CreateEmployeeDto,
    actingUser?: { sub?: string; type?: string; role?: string },
  ): Promise<{ success: true; invitationToken: string; expiresAt: string; employeeId: string }> {
    if (actingUser?.role !== Role.OWNER) {
      throw new ForbiddenException('Only owners can create employees.');
    }

    if (!payload?.merchantId?.trim()) {
      throw new BadRequestException('Merchant ID is required.');
    }

    if (!payload?.email?.trim()) {
      throw new BadRequestException('Email is required.');
    }

    const merchant = await this.merchantRepository.findOne({ where: { id: payload.merchantId } });
    if (!merchant) {
      throw new BadRequestException('Merchant not found.');
    }

    const existingEmployee = await this.employeeRepository.findOne({ where: { email: payload.email } });
    if (existingEmployee) {
      throw new ConflictException('Email already exists.');
    }

    const invitationToken = randomBytes(32).toString('hex');
    const invitationTokenHash = this.passwordHashingService.hashPassword(invitationToken);
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const employee = this.employeeRepository.create({
      merchantId: merchant.id,
      email: payload.email,
      isActive: false,
      invitationAccepted: false,
      invitationTokenHash,
      invitationExpiresAt,
    });

    await this.employeeRepository.save(employee);

    return {
      success: true,
      invitationToken,
      expiresAt: invitationExpiresAt.toISOString(),
      employeeId: employee.id,
    };
  }

  async acceptInvitation(payload: AcceptInvitationDto): Promise<{ success: true }> {
    if (!payload?.invitationToken?.trim()) {
      throw new BadRequestException('Invitation token is required.');
    }

    const employee = await this.findEmployeeByInvitationToken(payload.invitationToken);
    if (!employee) {
      throw new UnauthorizedException('Invalid invitation token.');
    }

    if (employee.isActive) {
      throw new BadRequestException('Invitation has already been used.');
    }

    if (employee.invitationAccepted) {
      throw new BadRequestException('Invitation has already been consumed.');
    }

    if (employee.invitationExpiresAt && employee.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Invitation token has expired.');
    }

    employee.invitationAccepted = true;
    await this.employeeRepository.save(employee);

    return { success: true };
  }

  async setPassword(payload: SetPasswordDto): Promise<{ success: true }> {
    if (!payload?.invitationToken?.trim()) {
      throw new BadRequestException('Invitation token is required.');
    }

    if (!payload?.password?.trim()) {
      throw new BadRequestException('Password is required.');
    }

    const employee = await this.findEmployeeByInvitationToken(payload.invitationToken);
    if (!employee) {
      throw new UnauthorizedException('Invalid invitation token.');
    }

    if (employee.isActive) {
      throw new BadRequestException('Invitation has already been used.');
    }

    if (employee.invitationExpiresAt && employee.invitationExpiresAt < new Date()) {
      throw new BadRequestException('Invitation token has expired.');
    }

    if (!employee.invitationAccepted) {
      throw new BadRequestException('Invitation must be accepted before setting a password.');
    }

    employee.passwordHash = this.passwordHashingService.hashPassword(payload.password);
    employee.isActive = true;
    employee.invitationAccepted = true;
    employee.invitationTokenHash = null;
    employee.invitationExpiresAt = null;

    await this.employeeRepository.save(employee);

    return { success: true };
  }

  private async findEmployeeByInvitationToken(invitationToken: string): Promise<Employee | null> {
    const employees = await this.employeeRepository.find();
    const now = new Date();

    for (const employee of employees) {
      if (!employee.invitationTokenHash || employee.isActive) {
        continue;
      }

      if (employee.invitationExpiresAt && employee.invitationExpiresAt < now) {
        continue;
      }

      const isValidToken = this.passwordHashingService.verifyPassword(invitationToken, employee.invitationTokenHash);
      if (isValidToken) {
        return employee;
      }
    }

    return null;
  }

  async loginEmployee(payload: EmployeeLoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    if (!payload?.email?.trim() || !payload?.password?.trim()) {
      throw new BadRequestException('Email and password are required.');
    }

    const employee = await this.employeeRepository.findOne({ where: { email: payload.email } });
    if (!employee || !employee.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!employee.isActive || !employee.invitationAccepted) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = this.passwordHashingService.verifyPassword(payload.password, employee.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const refreshToken = randomBytes(32).toString('hex');
    const refreshTokenHash = this.passwordHashingService.hashPassword(refreshToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.getRefreshTokenExpiryMs());

    const session = this.merchantSessionRepository.create({
      merchantId: employee.merchantId,
      refreshTokenHash,
      createdAt: now,
      lastUsedAt: now,
      expiresAt,
    });

    await this.merchantSessionRepository.save(session);

    const accessToken = this.jwtService.sign({
      sub: employee.id,
      type: 'employee',
    });

    return { accessToken, refreshToken };
  }
}
