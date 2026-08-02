import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';

import { CredentialAwareThrottlerGuard } from './credential-aware-throttler.guard';
import { GLOBAL_RATE_LIMIT } from './rate-limit.policy';

// Registers one guard for the whole application. Routes that need something stricter say so
// with @Throttle at the route, rather than each module deciding for itself whether it is
// protected — the failure mode of the alternative is a new endpoint that quietly has no limit.
//
// Counters live in memory. Two instances therefore allow twice the configured rate, which is
// an acceptable degradation for a limit (unlike, say, a credential store) and avoids adding
// Redis to the deployment for it. Worth revisiting if this ever runs at a scale where the
// limits need to be exact.
@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: GLOBAL_RATE_LIMIT.ttl, limit: GLOBAL_RATE_LIMIT.limit }])],
  providers: [{ provide: APP_GUARD, useClass: CredentialAwareThrottlerGuard }],
})
export class RateLimitModule {}
