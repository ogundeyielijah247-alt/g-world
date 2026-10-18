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

Returning members sign in with **email or registered phone number + password**. Email is optional during registration; members who leave it blank can return using their phone number. Nigerian local and +234 phone formats are supported. The login API accepts `{ identifier, password }` and remains compatible with `{ email, password }`.

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
cp .env.example .env   # leave API/verification bases blank for the local proxy
npm run dev:full      # initialise local D1, start frontend + API together
```

Local/preview accounts are separate from production D1 accounts. The Vite server
proxies `/api` and `/verify` to the local Worker, so a remote preview browser never
calls its own localhost. Run both servers for working registration and login.
No remote database migration or production deployment is performed by these commands.

`npm run dev` and `npm run dev:full` start the same supervised stack.
The launcher checks for occupied ports and waits for account-service readiness.
It stops both services if either exits, instead of silently leaving a
frontend that cannot log in. For separate terminals, use `npm run db:local`,
`npm run dev:api` and `npm run dev:frontend` (frontend only). If `/api/health` returns
500/502 through port 5173, first check whether the Worker on 8787 is running.
A new local database has no production accounts: create a preview-only account
or use the published site for a production account. Never copy production
passwords or database contents into test fixtures.

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

## Frontend experience

The original entrance, member identity and learning-area structure are retained.
The homepage uses the original three G WORLD learning-area slides, with a
**5-second** loop, previous/next, dots and pause/play. It has no article-feed
or content-API dependency. CTAs open Courses, Tech Skills and JAMB respectively.
The hero follows the supplied educational homepage reference: a black/blue
rounded panel, left-aligned white headline, two CTAs, prominent educational scenes
in rounded photo frames with blue accents and a floating learning badge. A learning-path strip
slightly overlaps the panel below. The composition stacks on smaller displays,
keeping both the education imagery and controls available. The hero and shared pages
use the X-inspired black, neutral gray, white and blue palette.
The 900 ms overlapping crossfade and subtle image zoom are retained. The optimized
local WebP education images are warmed before transitions.
Each slide also retains its own locally hosted library-interior, computer-lab or campus background, distinct from the foreground student photo under
a black-to-blue gradient overlay on every loop;
first-slide loading has high priority. Failed images hide only the illustration,
leaving readable copy. Artwork notes are in `public/assets/hero/README.md`.
Reduced motion disables rotation and animations; hidden tabs suspend the timer.
Navigation tears down the slider timer and listeners. The original account
endpoints are retained; the audit now validates remembered sessions with `/api/me`
before showing the member homepage.

### Navigation

The shared header follows the reference composition: G WORLD branding on the
left, compact central navigation and theme/account actions on the right. Active
sections remain highlighted on their child pages. Member routes are Home,
Faculties, Tech Skills, JAMB, Resources and Support; admin screens use the same
header with their own administration links. Below 1000 px, links collapse into
an accessible menu with expanded state, Escape dismissal (returning focus to
the toggle), outside-click dismissal and close-on-navigation. Theme and logout
remain available on mobile without opening the menu. Existing account actions
are retained rather than adding a dummy registration CTA for signed-in members.

### Homepage welcome section

The section after the hero follows the supplied reference: graduate imagery and
an inset classroom scene on the left; a welcome heading, personalised greeting,
introductory copy and three study benefits on the right. It keeps the member's
name and permanent ID, and a working CTA opens Courses. Only three aggregate
metrics are displayed: Total achievements, Total students and Total instructors.
The welcome section currently uses owner-requested placeholder totals: **20
achievements, 30 students, 10 instructors**, defined in `src/metrics.js`. These
are explicitly labelled placeholders and are not fetched from or overwritten
by `/api/stats`. The existing aggregate endpoint remains available for future
live integration; it is not used by the welcome counters during placeholder mode.
Images are illustrative and AI-generated (see
`public/assets/welcome/README.md`). The layout stacks on mobile and uses the
existing black/blue and light theme tokens. Other pages and the hero are unchanged.

### Faculty directory and reference-inspired homepage sections

The Courses destination now opens a directory of exactly three faculties:
Faculty of Management Science, Faculty of Art and Faculty of Science. The
Management Science faculty retains the six original accounting, economics,
business, finance, marketing and research roadmaps. Art and Science each have
two introductory roadmap previews. These previews explicitly state that full
lessons/assessments are unpublished and do not offer a payment button. Catalog
metadata and preview topics are in `src/catalogue.js`.

The homepage adds a subject-highlight band, filterable faculty cards, a learning
invitation, access-comparison cards, study-principle cards, a learning-resource
layout and a multi-column support footer. Sections use the reference layout but
keep the black/blue palette. The reference's signup form becomes a useful
signed-in learner checklist; its testimonials become clearly named study
principles (no fabricated endorsements). Pricing reflects free previews and the
existing one-time payment setting, not fictional subscriptions. Resource cards
open existing Python, study-guidance and project-writing screens; no dated news
or student ratings are invented. Existing learning areas remain accessible.
Footer and faculty links are real SPA actions. No backend faculty enrolment,
new registration workflow or course publication is introduced.

### Subpage design system

`src/page-design.js` enhances existing screens after rendering without replacing
forms or action handlers. Learning, faculty, course, JAMB, resource, support and
admin pages have two-column editorial heroes, compact home breadcrumbs and local
SVG artwork. Each supported route has its own distinct topical drawing (not a
recoloured or renamed copy): for example Excel uses a worksheet, Python a
terminal, biology a leaf, economics intersecting market curves and support
conversation bubbles. Artwork is decorative, dependency-free and uses the
current theme's colours. Account entry, registration and login have distinct
welcome copy and illustrations; the security gate has a compact lock drawing.
The member ID card and homepage slideshow are intentionally not replaced.

Content grids use three columns at desktop, two at tablet and one at mobile;
two/four-item groups use two balanced desktop columns, and single-item groups
span the available width. Cards have equal-height rows, consistent icon/number
placement, aligned action links, keyboard focus indicators and wrapping for long
content. Forms, payment/status panels, section headings and the homepage's
learning-links directory share the spacing system. Existing access rules,
placeholder metrics and payment/approval workflows are unchanged. These are
frontend presentation changes, not a publication or deployment of new lessons.

### Shared educational interface

All existing screens share refined type sizing, generous line height, consistent
stroke SVG icons, clear card affordances, aligned forms and responsive spacing.
Noninteractive roadmap cards do not show navigation affordances. Primary actions
retain X blue, with darker small-text accents on white for readability. A skip
link and focus management support keyboard navigation, form controls have visible
focus, and slider controls have larger touch targets. The desktop account screens
have a learning introduction alongside the form, hidden on smaller displays.
Research, academic and opportunities hubs include evergreen getting-started
guidance and explicitly distinguish it from the not-yet-connected updates feed.
No new backend features or payment/account behavior are introduced.

Browser regression tests (after `npm install`):

```bash
npx playwright install chromium
npm run test:browser
```

These tests use a local presentation fixture and mock the settings request;
they do not require a production account or exercise payment/authentication APIs.

### Distinct section photography

The faculty showcase and learning-resource stories now use six separately
composed, generated editorial photographs in `public/assets/sections/`: a
management seminar, a recording studio, microscopy, a programming desk, an
overhead study planner and academic research notes. None reuse the homepage
hero or welcome photographs. Faculty identity is kept consistent when the same
card appears in the directory. These are illustrative images, not actual
G WORLD facilities, staff, students or endorsements. The optimized WebP files
are approximately 46–66 KB each, lazy-loaded, with large PNG intermediates
removed. See the asset folder's README for provenance.

### Local login health check

With `npm run dev:full` running, use `npm run check:auth`. This local-only smoke
test checks the frontend proxy, authentication-table/column readiness, registration, duplicate
rejection, incorrect passwords, successful sign-in, authenticated access,
logout and session revocation. It creates a randomly named temporary account
with an in-memory generated password and removes its local records afterward.
It does not accept a production URL or credentials and does not print tokens.

`GET /api/health` checks API liveness. `GET /api/ready` additionally checks that
the authentication tables are queryable; it returns a generic 503 if they are
unavailable and never returns member records or database diagnostics.

### Audit corrections

Startup now verifies remembered sessions with `/api/me` rather than trusting a
cached name/ID. An unavailable API shows the entry screen with a connection
notice; an invalid session is cleared. Requests have a 12-second timeout.
Frontend-only browser layout tests mock `/api/me` explicitly; they are not proof
of real authentication. The separate `check:auth` command exercises the live
local API and D1 database.

`/api/ready` checks the required columns for member authentication, sessions,
admin lookup, profiles, registration auditing and payment-access lookup—not
just the existence of tables. It is read-only and is not a migration runner.
The schema initializer is idempotent for fresh databases but does not upgrade
existing tables; use reviewed migrations for existing production databases.
Root `wrangler.toml` now defaults to `production` and same-origin access. The
separate `worker/wrangler.toml` remains local/development. Credentialed CORS is
returned only for explicitly allowlisted origins. Cross-site deployments still
need correct cookie/Bearer-token handling and deployment-specific validation.

The existing access model is account-wide: `hasActiveAccess()` accepts any
approved payment. New homepage copy no longer claims per-course entitlements.
Per-course authorization, published paid lessons, certificate issuance, payment
reconciliation/idempotency, password recovery and platform rate limiting still
need separate implementation or operational verification. No production
migration, account reset, payment approval or deployment was performed during
this audit.

The full session review, corrected defects, remaining launch risks and exact
verification scope are recorded in [`docs/session-audit.md`](docs/session-audit.md).
