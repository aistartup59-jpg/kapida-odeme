import { BadRequestException } from '@nestjs/common';

export class OverpaymentException extends BadRequestException {
  constructor(paymentRequestId: string) {
    super(`Recording this transaction would exceed the total amount for payment request ${paymentRequestId}.`);
  }
}
