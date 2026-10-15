<!--STYLE-START-->
<div align="center">

<img src="https://raw.githubusercontent.com/prince53454/prince53454/main/assets/banner.svg" width="100%"/>

# ⟦ Online-Doctor-s-consultation ⟧

![status](https://img.shields.io/badge/STATUS-ONLINE-00ff9c?style=for-the-badge&labelColor=020806)
![stars](https://img.shields.io/github/stars/prince53454/Online-Doctor-s-consultation?style=for-the-badge&labelColor=020806&color=ff2d2d)

<img src="https://raw.githubusercontent.com/prince53454/prince53454/main/assets/divider.svg" width="100%"/>

</div>
<!--STYLE-END-->

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

[Live website](https://mediconnect-pro-prince53454.vercel.app) ? [Admin portal](https://mediconnect-pro-prince53454.vercel.app/login?portal=admin) ? [Source code](https://github.com/prince53454/Online-Doctor-s-consultation)

**Public demo admin password:** `medipro@vt5434`

**Open-source learning project.** Explore using sample data. For administrator access, open the Admin Portal on the sign-in page and use the public demo password shown above. This shared account has full administrator permissions. Integration credentials remain private in Vercel environment settings.

Telemedicine platform with patient, doctor, and administrator portals.

See [Project structure](docs/PROJECT_STRUCTURE.md) for the folder map and development conventions.

## Run locally

1. Install locked dependencies from the repository root: `npm ci`
2. Configure `server/.env` with `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, and `ADMIN_ACCESS_PASSWORD`.
3. For client overrides, create `client/.env.local`. The default `/api` URL proxies to `http://127.0.0.1:5000` during development. Set `VITE_BACKEND_URL` there if the server uses a different port. Set `VITE_DEMO_MODE=true` only for preview data; checkout always requires the server.
4. Start both frontend and backend: `npm run dev`. Open `http://localhost:3000`.

Generate private secrets with:

```sh
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use a unique private `JWT_SECRET`. Normal deployments require an `ADMIN_ACCESS_PASSWORD` of at least 32 characters. This learning deployment explicitly enables `PUBLIC_ADMIN_DEMO=true` to accept the shared demo password above; public demo passwords must be at least 12 characters. The **Admin Portal** button asks for the server-side access password. Admin API endpoints still require a valid administrator token.

For real appointment payments, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `server/.env` from your Razorpay dashboard. Test keys enable test checkout; live keys are required to charge real payments. Without keys, development uses an explicitly labelled simulation, while production disables payment checkout. Never put provider secrets in the client environment or commit them.

## Checks

```sh
npm run build
# Use a disposable test database; integration tests clean its collections.
# PowerShell:
$env:MONGODB_TEST_URI="mongodb://127.0.0.1:27017/mediconnect_test"
npm test --workspace=server
```

To add repeatable, non-destructive development examples for admin queues, consultation history, and revenue, run `cd server && npm run seed:examples`. This command refuses to run in production.

## Pharmacy checkout

Prescription uploads require `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `server/.env`. Missing storage returns an error instead of a placeholder prescription. Files may be JPG, PNG, GIF, WebP, or PDF, up to 10 MB.

Stock reservations use conditional atomic updates and roll back if another item becomes unavailable or the order fails to save. Cancellation is restricted to unpaid orders before checkout starts; paid orders require support so they are not cancelled without a refund. Payment retries reuse the provider order and confirmation requires a captured INR payment for the exact amount.

The local standalone MongoDB supports these concurrency guards. Crash recovery across multiple inventory documents still requires a transactional MongoDB deployment or a durable reservation worker before production use. Provider upload and payment tests use stubs; they do not establish that external credentials work.

For production-style local serving, run `npm run build` followed by `npm start`. The API serves the built site on port 5000.
