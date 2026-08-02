// How many requests one client may make, and over what window.
//
// The numbers are read once, at import, because the per-route limits below are applied with
// @Throttle — a decorator, evaluated when the controller class is defined. That is early
// enough: process.env is populated before Nest bootstraps in production, and by
// test/setup-env.ts before any spec is loaded.
//
// Every value is overridable so a test run, a load test, or a busy deployment does not need a
// code change to move a limit.

const SECOND = 1000;
const MINUTE = 60 * SECOND;

function limitFrom(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export interface RateLimitPolicy {
  ttl: number;
  limit: number;
}

// The backstop on everything. Deliberately high: the collection screen polls every 3 seconds
// while a payment is open, and several POS devices in one shop share a single public address,
// so a limit tuned for one client would take the shop offline. This is here to stop a script,
// not to shape normal traffic.
export const GLOBAL_RATE_LIMIT: RateLimitPolicy = {
  ttl: MINUTE,
  limit: limitFrom('RATE_LIMIT_GLOBAL_PER_MINUTE', 600),
};

// Anything that accepts a password, a refresh token or an invitation token. Low enough that
// guessing is pointless, high enough that a shop's employees can all sign in at the start of
// a shift from behind one address.
export const AUTH_RATE_LIMIT: RateLimitPolicy = {
  ttl: MINUTE,
  limit: limitFrom('RATE_LIMIT_AUTH_PER_MINUTE', 20),
};

// Merchant registration is open — anyone can create an account. Until that changes, this is
// what stands between the signup endpoint and a script filling the database.
export const SIGNUP_RATE_LIMIT: RateLimitPolicy = {
  ttl: MINUTE,
  limit: limitFrom('RATE_LIMIT_SIGNUP_PER_MINUTE', 5),
};

// The hand-off channel, keyed by API key rather than address (see PartnerThrottlerGuard). An
// order platform's backend is a single machine making many legitimate calls, so an
// address-based limit would be both useless and harmful here.
export const PARTNER_RATE_LIMIT: RateLimitPolicy = {
  ttl: MINUTE,
  limit: limitFrom('RATE_LIMIT_PARTNER_PER_MINUTE', 300),
};
