# Running a PayALS demo

Everything below runs locally. Nothing here is production configuration.

## What can and cannot be shown

| Flow | Works |
|---|---|
| Business sign-up, sign-in, key an amount in | yes |
| Cash collection, partial payments, remaining amount, PAID | yes |
| Bank QR — shown, then settled a few seconds later | yes, with the demo provider below |
| Order platform hand-off: no sign-in, collect, return to the platform app | yes |
| NFC | no — needs a PCI-certified SoftPOS SDK from the provider |

The demo provider settles payments nobody made. It registers itself only when
`DEMO_PAYMENT_PROVIDER=true`, and logs a warning when it does. Never set that variable in
production.

## 1. Backend

```bash
cd backend
docker compose up -d postgres

DATABASE_HOST=localhost \
DEMO_PAYMENT_PROVIDER=true \
npm run start:dev
```

`DEMO_PAYMENT_SETTLE_MS` controls how long the QR stays on screen before the simulated
customer pays it (default 7000).

## 2. Emulator

The app's default backend address is `http://10.0.2.2:3000/api` — 10.0.2.2 is the Android
emulator's alias for the host machine — so no build argument is needed for an emulator demo.

```bash
cd mobile
flutter run --release
```

## 3. Seed a merchant with the demo provider

QR needs an active provider, so a freshly registered business cannot show one until this is
done. Register through the app, or with the API:

```bash
API=http://localhost:3000/api

curl -s -X POST $API/auth/merchant/register -H 'Content-Type: application/json' -d '{
  "businessName":"Demo Restoran","ownerFullName":"Demo Sahibi",
  "email":"demo@payals.test","phoneNumber":"+905550000001","password":"DemoPass123"
}'

TOKEN=$(curl -s -X POST $API/auth/merchant/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@payals.test","password":"DemoPass123"}' | jq -r .accessToken)

# Attach the demo provider and make it the active one.
PROVIDER=$(curl -s -X POST $API/merchant/payment-providers \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"providerType":"DEMO","credentials":{"apiKey":"demo"}}' | jq -r .id)

curl -s -X POST $API/merchant/payment-providers/$PROVIDER/activate -H "Authorization: Bearer $TOKEN"
```

Sign in as `demo@payals.test` / `DemoPass123`, enter an amount, and both **Nakit tahsil et**
and **Banka QR göster** work. A partial cash payment followed by a QR shows the QR covering
only what is left.

## 4. Demonstrating the order platform hand-off

This is the flow a courier sees: no sign-in at all.

```bash
# The merchant issues the platform a key (once).
KEY=$(curl -s -X POST $API/merchant/partner-keys \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"label":"Demo Platform"}' | jq -r .apiKey)

# What the platform's backend does when an order is ready for delivery.
HANDOFF=$(curl -s -X POST $API/partner/handoffs \
  -H "X-Api-Key: $KEY" -H 'Content-Type: application/json' \
  -d '{"externalOrderId":"DEMO-1001","totalAmount":250}' | jq -r .handoffToken)

# What the platform's app does — opens PayALS on the courier's device.
# The inner quotes matter: adb hands the argument to a shell on the device, which would
# otherwise treat & as a command separator and silently truncate the link at the token.
adb shell am start -a android.intent.action.VIEW \
  -d "'payals://collect?token=$HANDOFF&returnUrl=https://example.com/order/1001'"
```

The app opens straight on the collection, with no login, showing 250 TRY. Collect part in
cash and the rest by QR, and the platform can confirm it server side at any point:

```bash
curl -s -H "X-Api-Key: $KEY" "$API/partner/payments?externalOrderId=DEMO-1001"
```

That last call is the one that matters in a sales conversation: it is how the platform knows
the money arrived, independently of anything the courier's phone claims.

## Demoing on a real phone

The emulator alias `10.0.2.2` means nothing on a real device, and the app only permits
cleartext HTTP for that alias — everything else must be HTTPS. So a phone demo needs a public
HTTPS address for the backend:

```bash
cloudflared tunnel --url http://localhost:3000

cd mobile
flutter build apk --release --dart-define=API_BASE_URL=https://<tunnel-host>/api
```

Install the resulting `build/app/outputs/flutter-apk/app-release.apk` on the phone.
