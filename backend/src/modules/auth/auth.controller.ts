import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('merchant/register')
  registerMerchant(@Body() payload: CreateMerchantDto) {
    return this.authService.registerMerchant(payload);
  }

  @Post('merchant/login')
  loginMerchant(@Body() payload: MerchantLoginDto) {
    return this.authService.loginMerchant(payload);
  }

  @Post('refresh')
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.authService.refreshToken(payload);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: { sub?: string; type?: string }) {
    return this.authService.logout(user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() payload: ForgotPasswordDto) {
    return this.authService.forgotPassword();
  }

  @Post('reset-password')
  resetPassword(@Body() payload: ResetPasswordDto) {
    return this.authService.resetPassword();
  }

  @Post('employee')
  createEmployee(@Body() payload: CreateEmployeeDto) {
    return this.authService.createEmployee();
  }

  @Post('employee/accept-invitation')
  acceptInvitation(@Body() payload: AcceptInvitationDto) {
    return this.authService.acceptInvitation();
  }

  @Post('employee/set-password')
  setPassword(@Body() payload: SetPasswordDto) {
    return this.authService.setPassword();
  }

  @Post('employee/login')
  loginEmployee(@Body() payload: EmployeeLoginDto) {
    return this.authService.loginEmployee();
  }
}
