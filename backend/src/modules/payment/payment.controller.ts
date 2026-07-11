import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createPaymentRequest(
    @Body() dto: CreatePaymentRequestDto,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.createPaymentRequest(dto, user);
  }
}
