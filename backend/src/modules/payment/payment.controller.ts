import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import { CreateTransactionRequestDto } from './dto/create-transaction-request.dto';
import { ListPaymentRequestsQueryDto } from './dto/list-payment-requests-query.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  createPaymentRequest(
    @Body() dto: CreatePaymentRequestDto,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.createPaymentRequest(dto, user);
  }

  @Get()
  listPaymentRequests(
    @Query() query: ListPaymentRequestsQueryDto,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.listPaymentRequests(query, user);
  }

  @Get(':paymentRequestId')
  getPaymentRequest(
    @Param('paymentRequestId', ParseUUIDPipe) paymentRequestId: string,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.getPaymentRequestById(paymentRequestId, user);
  }

  // Issues a bank QR for whatever is still owed on an existing request (ADR-003), which is
  // what the courier shows the customer at the door.
  @Post(':paymentRequestId/qr')
  generateQr(
    @Param('paymentRequestId', ParseUUIDPipe) paymentRequestId: string,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.generateQr(paymentRequestId, user);
  }

  @Post(':paymentRequestId/transactions')
  recordTransaction(
    @Param('paymentRequestId', ParseUUIDPipe) paymentRequestId: string,
    @Body() dto: CreateTransactionRequestDto,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.recordTransaction(paymentRequestId, dto, user);
  }

  @Post(':paymentRequestId/cancel')
  cancelPaymentRequest(
    @Param('paymentRequestId', ParseUUIDPipe) paymentRequestId: string,
    @CurrentUser() user: { sub?: string; type?: string },
  ) {
    return this.paymentService.cancelPaymentRequest(paymentRequestId, user);
  }
}
