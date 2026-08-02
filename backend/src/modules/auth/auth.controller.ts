import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { AUTH_RATE_LIMIT, SIGNUP_RATE_LIMIT } from '../../shared/rate-limit/rate-limit.policy';
import { AuthService } from './auth.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { EmployeeLoginDto } from './dto/employee-login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MerchantLoginDto } from './dto/merchant-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { Role } from './enums/role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

// Every route here either accepts a secret or creates an account, so each one is rate limited
// below the application-wide backstop. They are also the only routes an attacker can reach
// without already holding a credential, which is what makes them worth guessing against.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('merchant/register')
  @Throttle({ default: SIGNUP_RATE_LIMIT })
  registerMerchant(@Body() payload: CreateMerchantDto) {
    return this.authService.registerMerchant(payload);
  }

  @Post('merchant/login')
  @Throttle({ default: AUTH_RATE_LIMIT })
  loginMerchant(@Body() payload: MerchantLoginDto) {
    return this.authService.loginMerchant(payload);
  }

  @Post('refresh')
  @Throttle({ default: AUTH_RATE_LIMIT })
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.authService.refreshToken(payload);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { sub?: string; type?: string }) {
    return this.authService.logout(user);
  }

  @Post('forgot-password')
  @Throttle({ default: AUTH_RATE_LIMIT })
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword();
  }

  @Post('reset-password')
  @Throttle({ default: AUTH_RATE_LIMIT })
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword();
  }

  @Post('employee')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OWNER)
  createEmployee(
    @Body() payload: CreateEmployeeDto,
    @CurrentUser() user: { sub?: string; type?: string; role?: string },
  ) {
    return this.authService.createEmployee(payload, user);
  }

  @Post('employee/accept-invitation')
  @Throttle({ default: AUTH_RATE_LIMIT })
  acceptInvitation(@Body() payload: AcceptInvitationDto) {
    return this.authService.acceptInvitation(payload);
  }

  @Post('employee/set-password')
  @Throttle({ default: AUTH_RATE_LIMIT })
  setPassword(@Body() payload: SetPasswordDto) {
    return this.authService.setPassword(payload);
  }

  @Post('employee/login')
  @Throttle({ default: AUTH_RATE_LIMIT })
  loginEmployee(@Body() payload: EmployeeLoginDto) {
    return this.authService.loginEmployee(payload);
  }

  @Post('employee/refresh')
  @Throttle({ default: AUTH_RATE_LIMIT })
  @UseGuards(JwtAuthGuard)
  refreshEmployeeToken(
    @Body() payload: RefreshTokenDto,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.authService.refreshEmployeeToken(payload, user);
  }

  @Post('employee/logout')
  @UseGuards(JwtAuthGuard)
  logoutEmployee(@CurrentUser() user: { sub?: string; type?: string }) {
    return this.authService.logoutEmployee(user);
  }
}
