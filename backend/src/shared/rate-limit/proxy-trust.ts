import { NestExpressApplication } from '@nestjs/platform-express';

// Rate limiting counts requests per client, and behind a load balancer every request arrives
// from the balancer's address unless Express is told otherwise — which would make one shared
// counter for the entire deployment.
//
// The correction is opt-in and states how many proxies to trust, because the alternative
// reads X-Forwarded-For blindly: a client that sets the header itself would then choose its
// own identity and never be limited at all. Set TRUST_PROXY=1 behind a single load balancer
// (Railway, Fly, a Cloud Run service); leave it unset when the process is reached directly.
export function configureProxyTrust(app: NestExpressApplication): void {
  const configured = process.env.TRUST_PROXY?.trim();
  if (!configured) {
    return;
  }

  const hops = Number(configured);
  app.set('trust proxy', Number.isFinite(hops) && hops > 0 ? hops : configured);
}
