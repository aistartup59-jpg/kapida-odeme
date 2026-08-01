import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

import { PaymentService } from '../payment/payment.service';
import { PaymentMethod } from '../payment/enums/payment-method.enum';
import { DemoProviderConfig } from './demo-provider.config';

// Stands in for the part of a real integration that does not exist yet: the provider telling
// us, out of band, that the customer paid the QR. A live provider does that with a webhook.
//
// The settlement goes through PaymentService like any other, rather than writing rows
// directly, so a demo payment obeys the same overpayment checks, the same lifecycle
// transitions (ADR-011) and the same append-only ledger (ADR-012) as a real one. A demo that
// took a shortcut here would prove nothing about the system being demonstrated.
@Injectable()
export class DemoSettlementService implements OnModuleDestroy {
  private readonly logger = new Logger(DemoSettlementService.name);
  private readonly pending = new Set<NodeJS.Timeout>();

  constructor(
    private readonly paymentService: PaymentService,
    private readonly config: DemoProviderConfig,
  ) {}

  schedule(paymentRequestId: string, amount: number, providerReference: string): void {
    const timer = setTimeout(() => {
      this.pending.delete(timer);
      void this.settle(paymentRequestId, amount, providerReference);
    }, this.config.settlementDelayMs);

    // Tracked so shutdown can cancel them. A pending timer keeps the Node event loop alive,
    // which would hang application shutdown and test teardown.
    this.pending.add(timer);
  }

  private async settle(paymentRequestId: string, amount: number, providerReference: string): Promise<void> {
    try {
      await this.paymentService.recordTransactionOn(paymentRequestId, {
        amount,
        paymentMethod: PaymentMethod.QR,
        providerReference,
      });
      this.logger.log(`Demo QR settled: ${amount} on payment request ${paymentRequestId}`);
    } catch (error) {
      // The payment may have been cancelled, or collected in cash while the QR was on screen.
      // That is a legitimate outcome, not a crash — an unhandled rejection here would take the
      // process down mid-demo.
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Demo QR settlement skipped for ${paymentRequestId}: ${message}`);
    }
  }

  onModuleDestroy(): void {
    for (const timer of this.pending) {
      clearTimeout(timer);
    }
    this.pending.clear();
  }
}
