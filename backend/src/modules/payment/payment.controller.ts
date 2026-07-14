import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { CreateTransactionRequestDto } from './dto/create-transaction-request.dto';
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

  @Post(':paymentRequestId/transactions')
  @UseGuards(JwtAuthGuard)
  recordTransaction(
    @Param('paymentRequestId') paymentRequestId: string,
    @Body() dto: CreateTransactionRequestDto,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.recordTransaction(paymentRequestId, dto, user);
  }
}
