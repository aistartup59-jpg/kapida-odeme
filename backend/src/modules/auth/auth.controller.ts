import { Body, Controller, Post } from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('merchant/register')
  registerMerchant(@Body() payload: CreateMerchantDto) {
    return this.authService.registerMerchant();
  }

  @Post('merchant/login')
  loginMerchant(@Body() payload: MerchantLoginDto) {
    return this.authService.loginMerchant();
  }

  @Post('refresh')
  refreshToken(@Body() payload: RefreshTokenDto) {
    return this.authService.refreshToken();
  }

  @Post('logout')
  logout() {
    return this.authService.logout();
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
