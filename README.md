# G WORLD — Phase 1 Foundation + Live Registration

G WORLD keeps the approved entrance and registration flow. Registration goes
through the G WORLD API and D1 database, and members now authenticate with a
real password + server-side session before any private data is returned.

## Flow

1. G WORLD logo entrance
2. Registration form (name, phone, email, password)
3. Server-side validation + PBKDF2 password hashing
4. Permanent G WORLD ID generation (crypto-random)
5. Member record saved in D1 (atomically, with profile + audit rows)
6. Digital member card with a real verification QR
7. Enter G WORLD

Returning members sign in with **email + password** (no more name-only login).

## Architecture

- Frontend: Vite vanilla-JS SPA (`src/`)
- API + static assets: Cloudflare Worker (root `wrangler.toml` serves `dist/`
  and runs the worker first on `/api/*` and `/verify/*` — single origin)
- Database: Cloudflare D1
- Videos later: embedded from YouTube rather than stored on G WORLD

An API-only Worker config also lives in `worker/wrangler.toml` if you prefer
deploying the API separately (set `ALLOWED_ORIGINS` to the frontend origin).

## 1. Database

The D1 database id is already configured in both `wrangler.toml` files.

For a **fresh** database:

```bash
npx wrangler d1 execute g-world --remote --file=schema/schema.sql
```

For an **existing** database created before the auth/billing update:

```bash
npx wrangler d1 execute g-world --remote --file=schema/migrations/001_auth_billing.sql
```

## 2. Deploy the API

```bash
npm run build   # produces dist/ (served by the Worker as static assets)
npx wrangler deploy
```

## 3. Local development

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL to your Worker (or wrangler dev) URL
npm run dev
```

Environment variables (frontend):

- `VITE_API_BASE_URL` — API base URL (no trailing slash)
- `VITE_VERIFY_BASE_URL` — optional; base URL baked into the member-card QR.
  Defaults to `VITE_API_BASE_URL`. When using the single-origin Worker deploy,
  leave both pointing at the Worker URL.

Worker variables (in `wrangler.toml` / secrets):

- `ALLOWED_ORIGINS` — **comma-separated allowlist** of browser origins allowed
  to call the API. CORS never reflects arbitrary origins. Set this to the exact
  G WORLD frontend origin(s) before public launch.
- `PAYMENT_AMOUNT` — server-authoritative payment amount (default 3000).
- `ADMIN_ACCESS_CODE` — optional bootstrap admin code (set as a **secret**, not
  in git): `npx wrangler secret put ADMIN_ACCESS_CODE`. Prefer real
  `admin_users` rows for production (below).
- `ENVIRONMENT` — set to `production` on the production deploy.

## 4. Administrator access

Admin API routes require an **admin session**, obtained via
`POST /api/admin/verify` with the member's account email + administrator code.

- Preferred: create an `admin_users` row with a PBKDF2 hash of the admin code.
  Generate the hash/salt with Node:

  ```js
  // scripts/hash-code.mjs — prints salt + hash for a given code
  ```

  or set a bootstrap secret instead:

  ```bash
  npx wrangler secret put ADMIN_ACCESS_CODE
  ```

- Payment approval and the support inbox are enforced **server-side**; the
  admin screens in the SPA are only presentation.

## 5. Security notes

- Passwords: PBKDF2-SHA256, 100,000 iterations, per-user 128-bit salt.
- Sessions: random 256-bit tokens, stored hashed in the `sessions` table,
  delivered as an `HttpOnly` cookie and (for cross-origin dev) a JSON `token`.
  Logout revokes the session server-side.
- The `/verify/:id` page HTML-escapes all member data and sends a strict CSP +
  `noindex`. Enable **Cloudflare Rate Limiting** on `/api/register`,
  `/api/member-login` and `/verify/*` before public launch.
- Phone numbers are normalized to a stable Nigerian local format and emails are
  lowercased before storage; uniqueness is enforced case-insensitively in D1.

## 6. Current Phase 1 limitations

- No password recovery flow yet.
- G WORLD ID is persistent in D1.
- Browser localStorage only remembers the last member on that device (name +
  G WORLD ID + session token); D1 is the source of truth.
- Payment is a manual OPay transfer with admin review. Access unlocks only
  after an administrator approves the payment server-side.
- Courses, progress, certificates, Control Room and other future modules are
  scaffolded in the schema but not yet enabled.

## 7. Tests

```bash
npm test   # node --test — covers validation, escaping, IDs and password hashing
```

## 8. Production deploy checklist

1. Apply schema (fresh: `schema/schema.sql`; existing DB: run both files in
   `schema/migrations/` in order).
2. `npm run build && npx wrangler deploy` (root `wrangler.toml` — single
   origin, SPA + API together).
3. Set production vars/secrets:
   - `ALLOWED_ORIGINS = "https://your-g-world-domain"`
   - `ENVIRONMENT = "production"`
   - `npx wrangler secret put ADMIN_ACCESS_CODE` (and/or create `admin_users` rows)
4. Enable **Cloudflare Rate Limiting** rules on `/api/register`,
   `/api/member-login`, `/api/admin/verify` and `/verify/*`.
5. Smoke: register → card QR → scan `/verify` on a phone → login →
   send support message → submit payment → admin approve → confirm
   `access: true` on `/api/payment/status`.
6. Payment details can then be changed from **Admin → Settings** (stored in
   the `settings` table) without code changes.
