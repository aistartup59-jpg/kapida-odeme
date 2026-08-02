# The permanent demo environment

A always-on backend with a stable HTTPS address, so the app can be demonstrated from a phone
without a laptop, a tunnel, or anything running locally.

This is a demo environment. It runs a payment provider that settles payments nobody made. It
must never hold real merchant data.

## What you do once

Railway needs an account and a card; that part cannot be automated from here.

1. Sign in at railway.app with the GitHub account that owns this repository.
2. **New Project → Deploy from GitHub repo → this repository.**
3. In the service settings, set **Root Directory** to `backend`. Without it Railway tries to
   build the repository root, which holds four projects. The symptom when this is missed is a
   build that fails in about two seconds at "Build image" — not a compile error, because there
   was never anything found to compile.
4. Add the database **before** deploying: right-click the empty canvas → **Database** →
   **PostgreSQL** (there is no button for this in a menu; `Ctrl+K` and typing `postgres` also
   works). The `${{Postgres.*}}` variables below cannot resolve until this exists.
5. Paste the variables below into the service's **Variables** tab — use **Raw Editor** and paste
   the whole block at once rather than adding them one at a time.
6. Settings → Networking → **Generate Domain**. It asks for a *port*, not a name; Railway picks
   the name. Enter `3000`, matching the `PORT` variable below. If the two disagree the domain
   resolves but every request returns 502.

Railway rebuilds on every push to `main` from then on.

## Variables

The `${{Postgres.*}}` forms are Railway references — it substitutes the database's real values,
so no credential is ever typed or stored in this repository.

```
DATABASE_HOST=${{Postgres.PGHOST}}
DATABASE_PORT=${{Postgres.PGPORT}}
DATABASE_USER=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
DATABASE_NAME=${{Postgres.PGDATABASE}}

JWT_SECRET=<64 hex characters, freshly generated>
CREDENTIAL_ENCRYPTION_SECRET=<64 hex characters, freshly generated>

PORT=3000
TRUST_PROXY=1

DEMO_PAYMENT_PROVIDER=true
DEMO_PAYMENT_SETTLE_MS=7000
DEMO_SEED_EMAIL=demo@payals.app
DEMO_SEED_PASSWORD=<pick one, this is a public server>
DEMO_SEED_BUSINESS_NAME=PayALS Demo
```

Generate the two secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use new values. The ones in `backend/.env` are development secrets and must not be reused for
anything reachable from the internet.

`DATABASE_SSL` stays unset: Railway's `PGHOST` is an internal address, and the database is not
crossing the public internet. Set it to `true` on a host where it does.

`TRUST_PROXY=1` matters more than it looks. Railway puts one router in front of the service, so
without it every request appears to come from that router — rate limiting would then count the
whole world against a single allowance and the first busy minute would lock everyone out. The
`1` is the number of proxies to trust, and it has to be a number rather than "yes": trusting
blindly lets a caller set `X-Forwarded-For` itself and pick a fresh identity per request.

`PORT` is supplied by Railway and the app already honours it.

## What happens on first boot

Migrations run automatically. The demo module then creates the merchant from `DEMO_SEED_*`,
attaches the DEMO payment provider, activates it, and issues a partner API key — printed once
in the deploy logs:

```
Demo partner API key (shown once): pay_xxxxxxxxxxxxxxxx_xxxx...
```

Save it. Only its hash is stored, so it cannot be read back. If it scrolls past, sign in as
the demo merchant and issue another with `POST /merchant/partner-keys`.

Seeding is idempotent — later deploys leave the existing merchant alone.

## Point the app at it

```bash
cd mobile
flutter build apk --release --dart-define=API_BASE_URL=https://<railway-domain>/api
```

Install `build/app/outputs/flutter-apk/app-release.apk` on the phone. No tunnel, no laptop.

When a real domain is in place, put `api.payals.app` in front of the Railway service and
rebuild once with that address.

## Demonstrating the platform hand-off from a phone

The courier side needs no sign-in, so the only thing to prepare is the token:

```bash
API=https://<railway-domain>/api

curl -s -X POST $API/partner/handoffs \
  -H "X-Api-Key: <the key from the logs>" -H 'Content-Type: application/json' \
  -d '{"externalOrderId":"DEMO-2001","totalAmount":250}'
```

```
payals://collect?token=<handoffToken>&returnUrl=https://payals.app
```

The app opens straight on the collection, with no login — which is the part worth showing.

**Getting that link to fire is the hard part, and it is the custom scheme's fault.** Unresolved
as of 2026-08-03: with the app installed, none of pasting the link into Chrome's address bar
(Chrome treats an unknown scheme as a search query), tapping a real anchor on a hosted page, or
scanning it as a QR code opened the app on the test device. Not yet diagnosed with `adb`, which
is the one delivery path that bypasses every intermediary:

```bash
adb shell am start -a android.intent.action.VIEW -d "payals://collect?token=<handoffToken>"
```

That command separates the two possible faults — if it opens the app, the intent filter is fine
and only delivery is broken; if it does not, the fault is in the app.

None of this survives the move to a verified App Link. Once a domain exists,
`https://<domain>/collect?token=...` is an ordinary link that WhatsApp, notes apps and the
address bar all treat as a link, and the whole problem disappears. It is the clearest practical
argument for settling the domain question.

## Things to know about running this publicly

- **Registration is open.** Anyone with the URL can create a merchant account. That is
  deliberate, so a prospect can sign up in front of you, but it also means the demo database
  accumulates strangers' accounts. Wipe it before an important demo if it gets noisy.
- **Rate limiting is on**, which is why `TRUST_PROXY=1` is not optional here. Signups are capped
  at 5/minute per client, so a scripted flood cannot fill the database — but a person sitting in
  front of you can still sign up as often as a demo needs.
- **The demo provider settles payments nobody made.** That is the entire point here and
  entirely unacceptable anywhere else. Production must leave `DEMO_PAYMENT_PROVIDER` unset.
