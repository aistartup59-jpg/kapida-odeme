import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { CreateTransactionRequestDto } from '../payment/dto/create-transaction-request.dto';
import { PaymentService } from '../payment/payment.service';
import { HandoffPaymentRequestId } from './decorators/handoff-payment.decorator';
import { HandoffTokenGuard } from './guards/handoff-token.guard';

// What the courier's device talks to during a hand-off (ADR-015). There is no account behind
// these calls and no id in any path: the token names the one PaymentRequest it may act on, so
// a courier cannot reach another order even by tampering with the request.
@Controller('handoff')
@UseGuards(HandoffTokenGuard)
export class HandoffController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('payment')
  getPayment(@HandoffPaymentRequestId() paymentRequestId: string) {
    return this.paymentService.getPaymentRequest(paymentRequestId);
  }

  @Post('payment/qr')
  generateQr(@HandoffPaymentRequestId() paymentRequestId: string) {
    return this.paymentService.generateQrOn(paymentRequestId);
  }

  @Post('payment/transactions')
  recordTransaction(
    @HandoffPaymentRequestId() paymentRequestId: string,
    @Body() dto: CreateTransactionRequestDto,
  ) {
    return this.paymentService.recordTransactionOn(paymentRequestId, dto);
  }
}
