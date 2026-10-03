---
title: MediConnect Pro
emoji: 🩺
colorFrom: indigo
colorTo: green
sdk: docker
pinned: true
license: mit
---

# MediConnect Pro

Telemedicine platform with patient, doctor, and administrator portals.

## Run locally

1. Install dependencies: `npm run install:all`
2. Configure `server/.env` with `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and `ADMIN_ACCESS_PASSWORD`.
3. Set `VITE_API_URL` in the client environment if the API is not at its default address.
4. Start the app: `npm run dev`

Generate private secrets with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use a unique `JWT_SECRET` and an `ADMIN_ACCESS_PASSWORD` of at least 32 characters. Keep both server secrets private; never add them to source control, the client environment, or this README. The **Admin Portal** button asks for the server-side access password. Admin API endpoints still require a valid administrator token.

For real appointment payments, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env` from your Razorpay dashboard. Test keys enable test checkout; live keys are required to charge real payments. Without keys, development uses an explicitly labelled simulation, while production disables payment checkout. Never put provider secrets in the client environment or commit them.

## Checks

```sh
npm run build
cd server && npm test
```

To add repeatable, non-destructive development examples for admin queues, consultation history, and revenue, run `cd server && npm run seed:examples`. This command refuses to run in production.
