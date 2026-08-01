import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DemoProviderConfig {
  constructor(private readonly configService: ConfigService) {}

  // Off unless explicitly switched on. This provider settles payments nobody actually made,
  // so it is opt-in rather than opt-out: an environment that simply forgets to configure it
  // ends up without the adapter, not with a live one.
  get enabled(): boolean {
    return this.configService.get<string>('DEMO_PAYMENT_PROVIDER', 'false').trim().toLowerCase() === 'true';
  }

  // How long the QR stays on screen before the simulated customer pays it. Long enough to
  // show the QR and talk over it, short enough not to stall a demo.
  get settlementDelayMs(): number {
    const configured = Number(this.configService.get<string>('DEMO_PAYMENT_SETTLE_MS', '7000'));
    return Number.isFinite(configured) && configured >= 0 ? configured : 7000;
  }
}
