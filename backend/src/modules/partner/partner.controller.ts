import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { PaymentService } from '../payment/payment.service';
import { PartnerMerchant } from './decorators/partner-merchant.decorator';
import { CreateHandoffDto } from './dto/create-handoff.dto';
import { PartnerApiKeyGuard } from './guards/partner-api-key.guard';
import { HandoffSessionService } from './handoff-session.service';

// What an order platform's backend talks to (ADR-015). Both endpoints are authenticated by
// the merchant's API key, so the merchant is always derived from the credential and never
// read from the request — the rule ADR-005 states for JWT callers, applied here.
@Controller('partner')
@UseGuards(PartnerApiKeyGuard)
export class PartnerController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly handoffSessionService: HandoffSessionService,
  ) {}

  // Mints the token the courier's device presents. Called by the platform's backend when an
  // order is ready to be delivered, because that backend is the only party holding the API
  // key — which is precisely what makes the amount trustworthy. If the courier's app could
  // state the amount itself, any app on that device could too.
  @Post('handoffs')
  async createHandoff(@PartnerMerchant() merchantId: string, @Body() dto: CreateHandoffDto) {
    const paymentRequest = await this.paymentService.createForPartner(
      merchantId,
      dto.externalOrderId.trim(),
      dto.totalAmount,
      dto.currency,
    );

    const handoff = await this.handoffSessionService.issue(paymentRequest.id);

    return {
      paymentRequestId: paymentRequest.id,
      externalOrderId: paymentRequest.externalOrderId,
      totalAmount: paymentRequest.totalAmount,
      currency: paymentRequest.currency,
      status: paymentRequest.status,
      handoffToken: handoff.handoffToken,
      expiresAt: handoff.expiresAt,
    };
  }

  // How the platform establishes what was actually collected before releasing the order. A
  // result travelling back through the courier's device is a claim; this is the fact.
  @Get('payments')
  getByExternalOrderId(@PartnerMerchant() merchantId: string, @Query('externalOrderId') externalOrderId?: string) {
    return this.paymentService.getByExternalOrderId(merchantId, externalOrderId);
  }
}
