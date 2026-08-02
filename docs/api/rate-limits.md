# Rate limits

Every route is limited. A caller over its allowance gets `429 Too Many Requests`.

## What a request is counted against

Not the address it arrived from, wherever a credential says who is calling:

| Caller | Counted by |
|---|---|
| Order platform backend (`X-Api-Key`) | the API key |
| Courier device (`X-Handoff-Token`) | the hand-off token |
| Everything else | client address |

The address is the wrong unit for the first two. An order platform's backend is one machine
placing every hand-off for every courier it employs, so counting it by address would throttle
the whole platform as if it were one shop — and would let two platforms behind one address
exhaust each other's allowance. In the other direction, a shop's POS devices share a single
public address behind NAT, so an address-based count attributes one device's behaviour to all
of them.

## The allowances

Per caller, per minute:

| Scope | Limit |
|---|---|
| Merchant registration (`POST /auth/merchant/register`) | 5 |
| Anything accepting a secret — login, refresh, password reset, invitation acceptance | 20 |
| Partner channel (`/partner/*`) | 300 |
| Everything else | 600 |

The global figure is deliberately high. The collection screen polls every three seconds while
a payment is open, and several devices in one shop share one address, so a limit tuned for a
single client would take the shop offline. It is there to stop a script, not to shape traffic.

Every value is overridable per deployment — `RATE_LIMIT_GLOBAL_PER_MINUTE`,
`RATE_LIMIT_AUTH_PER_MINUTE`, `RATE_LIMIT_SIGNUP_PER_MINUTE`, `RATE_LIMIT_PARTNER_PER_MINUTE`.

## Deploying behind a proxy

Set `TRUST_PROXY` to the number of proxies in front of the process (`1` behind a single load
balancer). Without it every request appears to come from the balancer and the whole deployment
shares one counter, so the first busy minute locks everyone out.

It takes a hop count rather than a boolean on purpose: reading `X-Forwarded-For` blindly would
let a caller set the header itself, pick a fresh identity per request, and never be limited.

## What a client should do with a 429

Back off and retry — the window is a minute. The counters are per instance, so a deployment
running more than one instance permits proportionally more than the figures above.
