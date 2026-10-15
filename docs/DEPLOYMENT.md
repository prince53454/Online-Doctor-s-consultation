# Vercel deployment

- Website: https://mediconnect-pro-prince53454.vercel.app
- Admin sign-in: https://mediconnect-pro-prince53454.vercel.app/login?portal=admin
- GitHub: https://github.com/prince53454/Online-Doctor-s-consultation

This is a learning project; use sample data. The public sign-in screen links to
both the source and the live application. The Admin Portal remains available;
its public demo password is `medipro@vt5434` and is verified by the API.
This shared account has full administrator permissions.

## Hosting

The repository root is the Vercel project root. `vercel.json` builds the Vite
client into `client/build`, serves browser routes through `index.html`, and routes
API requests to `api/index.js` and Socket.IO requests to `api/socket.js`. The API exports the HTTP server from
`server/src/vercel.js` and reuses a small MongoDB connection pool.

Configure these in **Vercel ? Project ? Settings ? Environment Variables** for
Production: `MONGODB_URI`, `JWT_SECRET`, `ADMIN_ACCESS_PASSWORD`, `PUBLIC_ADMIN_DEMO=true`,
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Set `CLIENT_URL` to the public
site origin, `TRUST_PROXY_HOPS=1`, `VITE_DEMO_MODE=false`, and
`VITE_SOCKET_PATH=/api/socket/socket.io`.
SMTP, Daily, and Stripe credentials are optional and only needed for those services.
Private keys must never use the public `VITE_` prefix.

Deploy with `vercel --prod` from the repository root. Check `/api/health`,
`/api/payments/config`, `/api/status`, and browser deep links after deployment.
The Razorpay account is currently configured for test payments.

## Realtime behavior

The client uses WebSocket transport directly, as required for Socket.IO on
[Vercel Functions](https://vercel.com/docs/functions/websockets).
Sockets reconnect after function expiry. The current Socket.IO room broadcasts
are local to one function instance; reliable cross-instance delivery requires a
shared adapter (for example Redis) before a production rollout.

## Local credential cleanup

Once the deployment is verified, original credential values in `server/.env`
are blanked at the project owner's request. The encrypted Vercel values remain
available to the deployed application. To run the backend locally again, provide
private development credentials in `server/.env`; do not commit them. Vercel CLI
metadata and local downloaded tokens are ignored and excluded from uploads.

## Live verification

The public pages, database health, Razorpay and Cloudinary configuration, admin
sign-in, and authenticated admin dashboard passed live checks. GitHub CI passed
the client build, server load, all 107 tests, Docker build, and container health
check for commit `c850a48`.

**Known deployment limitation:** the authenticated WebSocket handshake currently
returns HTTP 404 on Vercel, including with the dedicated realtime function.
Realtime chat, notification delivery, and video signaling are not verified as
working on this deployment. Resolve the platform upgrade routing or configure a
persistent realtime backend before relying on those features. Database-backed
HTTP endpoints and the admin portal remain available.

Local `server/.env` and the Vercel CLI-created `.env.local` values have been
cleared after the successful HTTP/admin deployment checks. Credentials remain
configured in Vercel production. Local development requires fresh private
configuration before restarting the API.
