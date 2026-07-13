import { NotFoundException } from '@nestjs/common';

export class NoActiveProviderException extends NotFoundException {
  constructor(merchantId: string) {
    super(`No active payment provider configured for merchant ${merchantId}.`);
  }
}
