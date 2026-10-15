# Project structure

This repository is an npm workspace with one React client and one Express API.

```text
client/
  src/
    app/                  Application routes and providers
    components/
      common/             Shared error handling
      emergency/          Emergency UI
      layout/             Navigation and footers
      notifications/      Notification UI
      payments/           Shared payment UI
    config/               Public client environment configuration
    context/              Authentication, notifications, language
    data/                 Preview and demo data
    pages/
      admin/
      appointments/
      auth/
      consultations/
      doctor/
      doctors/
      health/
      labs/
      patient/
      pharmacy/
      public/
    services/             HTTP client
    styles/               Global styles
    index.jsx             Browser entry point
  public/                 Static assets
  build/                  Generated production output (ignored)
server/
  src/
    app.js                Express middleware and API registration
    index.js              Environment loading, HTTP and Socket.IO startup
    controllers/          Request handlers extracted from routes
    middleware/           Authentication and authorization
    models/               Mongoose schemas
    routes/               API endpoints grouped by domain
    services/             Integrations and business logic
  scripts/seeds/          Database seed commands
  tests/
    helpers/              Isolated test environment and fixtures
    integration/          Database-backed API workflows
    unit/                 Service and mocked route tests
  storage/                Runtime logs/uploads (ignored)
  .env                    Private server credentials (ignored)
docs/
  PROJECT_STRUCTURE.md    This guide
  templates/              Reference documentation templates
.github/workflows/        Continuous integration
```

## Conventions

Keep each page and its CSS together in its feature folder. Keep reusable UI in
`components`, app-wide state in `context`, and requests in `services`.
Backend code belongs under `server/src`; seed commands and tests do not belong
in production source. Public URLs and API endpoints remain unchanged when files
move. Update relative imports and deployment entry points whenever moving source.

Configuration files required by npm, Vite, Docker, Compose, Render, and GitHub
Actions stay at their expected locations. `package-lock.json` at the repository
root locks dependencies for both workspaces; use `npm ci` from the root.

## Commands

- `npm run dev`: start both API (5000) and web client (3000).
- `npm run client` / `npm run server`: start either workspace separately.
- `npm run build`: generate the client production build.
- `npm start`: serve the API and built website from the backend.
- `npm test`: run unit and integration tests against a disposable test database.
- `npm run check`: build and test.
- `npm run seed` / `npm run seed --workspace=server -- ...`: seed data explicitly.

Tests default to local `mediconnect_test`. Set `MONGODB_TEST_URI` for another
isolated test database; its name must contain `test`. Never run seed commands
against a production database unless that operation is intended.

Private credentials remain in `server/.env`. For optional browser overrides,
use `client/.env.local`; only public `VITE_*` values belong there. Generated
builds, installed dependencies, logs, and uploads are not source files.

## Reorganization verification (2026-10-15)

- Clean workspace install from `package-lock.json` succeeded.
- The production frontend build passed, and all relative source imports resolve.
- All 104 tests in 14 suites passed against an isolated local test database.
- Backend and seed JavaScript files passed syntax validation.
- Frontend, built-site routing, API health, and the development API proxy returned
  HTTP 200; the backend reports its database connected.
- The production dependency audit reports zero vulnerabilities. Development
  dependencies still have moderate advisories in Jest's `sprintf-js` dependency
  chain; npm's proposed forced downgrade was not applied.
- Docker configuration was updated but not executed because Docker is unavailable
  in this environment. HTTP checks do not replace visual browser testing or live
  payment/upload testing.
