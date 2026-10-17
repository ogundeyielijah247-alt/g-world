# G WORLD — Source Code Analysis

Repository: `ogundeyielijah247-alt/g-world` · Branch: `arena/895ac0b5-g-world` · Commit: `c592cf3` ("Update main.js")

---

## 1. What this project is

**G WORLD** is an early-phase ("Phase 1") Nigerian education / membership platform. The product flow is:

1. Animated logo splash → registration form (or returning-member login)
2. Server-side registration → permanent member ID `GW-YY-NNNNNN` stored in Cloudflare D1
3. Digital member card (with QR code linking to a verification page)
4. A member "home" with 10 modules: Courses, Tech Skills, AI & Technology, JAMB (Nigerian university entrance exam), Opportunities, Research, Project Writer, Academic Resources, Work Ready, Support
5. A manual bank-transfer payment flow (₦3,000 via OPay), certificate previews, and an admin console UI

### Tech stack

| Layer | Technology | Where |
|---|---|---|
| Frontend | Vanilla JS SPA, Vite 7, `qrcode` lib | `index.html`, `src/main.js` (4,101 lines), `src/style.css` (920 lines) |
| API / hosting | Cloudflare Worker (also serves the SPA via Workers Assets) | `worker/src/index.js` (333 lines), `wrangler.toml` |
| Database | Cloudflare D1 (SQLite) | `schema/schema.sql` (160 lines) |
| Deploy targets | Cloudflare Pages (front end) + Workers (API) + D1, all free tier | per README |

The architecture deliberately keeps provider boundaries clean so it can be swapped/upgraded later — a good early decision.

---

## 2. Architecture and data flow

```
Browser (Vite SPA, src/main.js)
   │  fetch JSON  →  VITE_API_BASE_URL
   ▼
Cloudflare Worker (worker/src/index.js)
   │  env.DB (D1 binding, parameterized SQL)
   ▼
D1 / SQLite (schema/schema.sql)
```

### Backend routes actually implemented

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Liveness + environment |
| `/api/register` | POST | Validates name/phone/email, creates member + profile + audit event, returns `GW-YY-NNNNNN` |
| `/api/member-login` | POST | "Login" by full name + email (no password) |
| `/verify/:gworldId` | GET | HTML membership-verification page (QR target) |

Everything else returns `404 {"ok":false,"error":"Not found."}`.

### Frontend structure

- A single global `state` object (`screen`, `history`, `member`, `error`, `loading`, `selectedPayment`, `selectedCourse`, `admin`, `supportMessages`) drives everything.
- `render()` (lines 222–3365, **~3,140 lines**) is one long `if (state.screen === "...")` chain of template literals written into `app.innerHTML`. There are **~35 screens**: splash, entry, onboard, existing, card, home, courses + 6 course pages, tech-skills, python-course/intro/practice, ai-tech, jamb + 5 sub-screens, work-ready, work-course, payment (+status/rejected), support, certificate, project-writer, opportunities/research/academic, and 11 admin screens.
- Navigation: `goTo()` / `goBack()` with a simple history stack (splash/entry/card are not pushed).
- Events: one delegated `click` handler (~340 lines of `if (action === ...)` chains), one `submit` handler (registration, member-login, support, admin code, project topic), one `input` handler (course search filter).
- Persistence: `localStorage.gworld` remembers the last member on the device; D1 is the source of truth.

### Database (`schema/schema.sql`)

**Phase-1 core (used):** `members`, `member_profiles`, `audit_events` (+ unused `content_items`).
**Course-engine scaffolding (not used by any code yet):** `departments`, `courses`, `course_modules`, `lessons`, `course_enrollments`, `learning_progress` — a sensible Phase-2 model with FKs, cascade deletes, ordering keys and indexes.

---

## 3. What works today

- **Registration** end-to-end: client validation mirrored on the server, uniqueness checks on phone/email, permanent ID generation with retry, member + profile + `MEMBER_REGISTERED` audit row persisted in D1.
- **Member card with a real QR code** — `generateMemberQR()` renders a QR to `https://g-world.ogundeyelijah13.workers.dev/verify/{gworldId}` (note: the README still calls this "a visual placeholder"; it is implemented).
- **`/verify/:id` page** — an actual HTML verification card (found / not-found states) that hides phone/email.
- **Returning-member login** (name + email) restoring the session from localStorage.
- **A complete, polished UI shell**: dark teal/green design system, splash animation, 10-module home, JAMB section (info/news/syllabus/CBT/subject-combination picker), a small Python lesson with a practice quiz, manual-payment screens, certificate preview, admin console screens.
- **Consistent XSS escaping on the frontend** — user-controlled strings go through `esc()` in templates. Good habit.
- **Parameterized SQL everywhere** in the worker (`?1`-style binds) — no SQL injection surface found.

---

## 4. Issues, ranked by severity

### 🔴 Critical / security

1. **Stored XSS on the `/verify/:id` page (backend).** `clean()` in the worker only trims and truncates — it does **not** HTML-escape — yet the page interpolates `${clean(member.full_name, 80)}` directly into HTML. A registered name such as `<img src=x onerror=alert(document.domain)>` will execute in every visitor's browser who scans that member's QR. The frontend escapes diligently (`esc()`), but this server-rendered page does not. **Fix: HTML-escape any interpolated value in the worker (or serve JSON / use `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'` plus escaping).**

2. **"Login" is name + email only — no password, no session, no token.** `/api/member-login` is an account-takeover oracle: anyone who knows (or guesses) a member's name and email receives the full member record (including phone) and is logged in as them. There is no rate limiting. The README acknowledges "no password/account recovery yet", but this is currently authentication in name only. **Fix: at minimum an emailed one-time code or password + hashed storage, and server-issued session (HttpOnly cookie) or JWT; never trust `localStorage` identity.**

3. **Admin flow is client-only theatre.** The admin gate calls `/api/admin/verify`, which **does not exist in the worker** (404). Same for `/api/admin/payment/review`, `/api/admin/support`. So today nobody can authenticate as admin at all; if these endpoints are added naively later, the "admin code" would be a shared secret in a request body with no session. **Fix: real admin table/roles, server-side sessions, and never gate privileged data client-side.**

4. **CORS reflects any `Origin`** (`Access-Control-Allow-Origin: origin || "*"`). Any website can call the API cross-site. The README flags this as "before public launch" work; it should be fixed before any real user data exists. (Note the API sends no `Access-Control-Allow-Credentials`, so cookie-based CSRF is not currently possible — but the moment cookies are added this becomes one.)

5. **Member enumeration via `/verify/:id`.** IDs are `GW-YY-` + 6 digits from `Math.random()` (not `crypto`), and the verify endpoint publicly confirms existence and discloses name + status. Predictable IDs + an oracle = anyone can scrape the member directory. **Fix: `crypto.getRandomValues` for IDs (or longer/salted tokens for QR payloads), rate limiting (Cloudflare Rate Limiting / WAF), and consider only confirming signed QR tokens instead of raw IDs.**

### 🟠 Functional gaps (frontend calls that 404 at runtime)

The SPA calls these endpoints, none of which exist in `worker/src/index.js`:

| Frontend call site | Endpoint | Result today |
|---|---|---|
| "I've Made Payment" | `POST /api/payment/submit` | 404 → error on screen |
| "Check Payment Status" | `GET /api/payment/status` | 404 → error |
| Admin approve/reject | `POST /api/admin/payment/review` | 404 |
| Admin support inbox | `GET /api/admin/support` | 404 |
| Support form | `POST /api/support` | 404 |
| Admin code gate | `POST /api/admin/verify` | 404 |

Also: the frontend checks `result.isAdmin` after login, but the worker never returns that field — the `admin-gate` branch is unreachable via the API as written.

So **payments, support, and the entire admin console are UI mock-ups**; the schema has no `payments`, `support_messages`, or `admins`/`sessions` tables either. The DB course-engine tables (`departments` … `learning_progress`) likewise have zero code paths reading or writing them.

### 🟡 Correctness / robustness

- **Phone normalization:** `clean()` keeps `+234…`, `080…`, spaces-stripped variants as distinct rows; `UNIQUE(phone)` is exact-match. Two formats of the same number can both register. Normalize to E.164 before store/compare. (Email has the same case-sensitivity wrinkle: the pre-check uses `lower(email)` but the column's `UNIQUE` is case-sensitive — the pre-check saves you in practice, but an expression index `UNIQUE(lower(email))` would make the guarantee real, and the check-then-insert race would still surface a raw SQLite constraint error as a generic 500 instead of 409.)
- **Registration writes are not atomic:** member insert, then `member_profiles`, then `audit_events` as three separate statements. A failure in the second statement leaves an orphaned member. D1 supports `db.batch()` for atomicity.
- **Form data is destroyed on submit/error:** `render()` rebuilds the whole DOM, so the moment a user submits (or any API error triggers a re-render), the typed name/phone/email vanish and must be retyped. A screen-level diff or restoring values from `state` would fix this.
- **`generateGWorldId` uses `Math.random()`** — fine for collision-avoidance with retries (8 attempts), not fine for unpredictability (see enumeration above).
- **Hardcoded worker URL in `generateMemberQR()`** (`g-world.ogundeyelijah13.workers.dev`) while every other API call is env-driven via `VITE_API_BASE_URL`. A deployed frontend against a different worker will produce QR codes pointing at the wrong host. The `/verify/` route is also served from the root `wrangler.toml` (SPA+worker combo), so relative `${API_BASE}/verify/…` would work.

### 🟡 Code quality / maintainability

- **`render()` is a 3,100-line function** of if-chains with ~35 embedded HTML templates. Any change risks touching a monolith; there is no componentization, no routing library, no template reuse beyond `commonNav` / `supportButton` / `adminNav` / `certificateHTML`. Extracting one function per screen would be the single biggest maintainability win.
- **Event dispatch is a 300-line if-chain** keyed on `data-a` strings that double as screen names (`goTo(action)`), including catch-alls like `action.startsWith("course-")`. Fragile and hard to test.
- **Placeholder UX:** `alert()` is used for the Python quiz, CBT start, project-topic submission and admin action confirmations. Fine for Phase 1, but it breaks the otherwise polished design language.
- **Dead / contradictory code:**
  - `html[data-theme="light"]` theme exists in CSS but no JS ever sets `data-theme` — the light theme is unreachable.
  - `state.selectedPayment` is never assigned (admin approve/reject sends `paymentId: null`).
  - `PAYMENT` account details (personal OPay account `8051598490`, "Ogundeji Elijah Olusola", ₦3,000) are hardcoded in `src/main.js`; the admin Settings screen claims "settings should be editable without changing the application code" but merely displays the same hardcoded constant.
- **Tooling hygiene:** `vite` and `typescript` sit in `dependencies` (should be `devDependencies`); TypeScript is listed but unused (no `tsconfig`, plain JS); there is **no `.gitignore` and no `.env.example`** even though the README instructs users to create `.env` from `.env.example`; no tests, no linter; `package.json` has no build-time check scripts.

### 🔵 Docs / config drift

- README says to run `wrangler d1 create g-world` and "replace `REPLACE_AFTER_CREATING_D1_DATABASE`", but `database_id` is already filled in (`82ca910b-…`) in both wrangler files.
- README says the QR is "a visual placeholder" — it is a real QR.
- Two `wrangler.toml` files: the root one deploys **both** SPA (Workers Assets, SPA fallback, worker-first on `/api/*` and `/verify/*`) and the API; `worker/wrangler.toml` deploys the API alone. Both pin `ENVIRONMENT = "development"` — production deploys should set `production` (and the health endpoint surfaces it, which is good).
- README says the frontend deploys to Cloudflare Pages and the API to Workers (two origins → CORS), while the root `wrangler.toml` implies a single-origin Workers Assets deployment (which would make CORS moot). Decide which story is canonical and document it.

---

## 5. Schema review

**Strengths:** sensible FK discipline (`ON DELETE CASCADE` / `SET NULL`), composite uniqueness on `(member_id, course_id)` for enrollments and ordering uniqueness within a module, useful indexes, timestamps defaulted.

**Gaps / nits:**
- No tables for the features the UI already shows: `payments`, `support_messages`, `admins`/`sessions`, `certificates`, `jamb_content`, `cbt_questions` (only `content_items` as a generic stub, unused).
- `updated_at` defaults but nothing updates it — no `BEFORE UPDATE` triggers or app-side discipline.
- `learning_progress UNIQUE(member_id, lesson_id)` with nullable `lesson_id`: in SQLite, NULLs are distinct, so many rows per member are allowed when `lesson_id IS NULL` (course/module-level progress). If that's intended, fine; otherwise use a partial unique index or separate tables.
- `members.email` is nullable + UNIQUE — multiple NULLs allowed (correct SQLite behavior), good.
- `status` columns are free-text CHECK-less enums (`'IN TRAINING'`, `'DRAFT'`, `'PREMIUM'`…). A `CHECK` constraint would prevent drift.

---

## 6. Recommended next steps (priority order)

1. **Escape all dynamic values in the worker's `/verify` HTML** (or serve JSON + render client-side) — closes the stored XSS.
2. **Real authentication**: password (hashed, e.g. Argon2/bcrypt via Web Crypto or a lib) or email OTP; server-side sessions (HttpOnly `Secure` cookies); admin roles in the DB. Stop treating name+email as identity.
3. **Lock down CORS** to the exact frontend origin; add rate limiting on `/api/register`, `/api/member-login`, `/verify/*`.
4. **Implement or explicitly stub the missing endpoints** (payment, support, admin) — or remove the dead UI paths so users don't hit 404s. Add the matching tables (`payments`, `support_messages`, `admins`) when you do. Payment approval must be server-authoritative.
5. **Use `crypto.getRandomValues`** for G WORLD IDs (or sign QR payloads) and de-identify the verify page.
6. **Normalize phone (E.164) and email (lowercase + expression unique index)**; wrap registration in `db.batch()`; map constraint violations to 409.
7. **Split `render()` into per-screen modules** and preserve form state across re-renders (biggest DX/UX win).
8. **Housekeeping**: add `.gitignore` (`node_modules`, `dist`, `.env`, `.wrangler`), add `.env.example`, move Vite/TS to `devDeps` or drop TS, wire or delete the light theme, move `PAYMENT` config to env/admin-editable settings, derive the QR base URL from `API_BASE`, update the README to match reality.

---

## 7. Bottom line

This is a **well-scoped Phase-1 foundation with a surprisingly complete and coherent UI**, clean parameterized SQL, and a sensible Cloudflare-native free-tier architecture. The registration → D1 → member card → verification-page loop genuinely works. The gaps are concentrated in three places: **(a)** security fundamentals on the worker (escaping, authentication, CORS, ID predictability), **(b)** a long tail of frontend features whose backend endpoints don't exist yet (payments, support, admin — the schema doesn't cover them either), and **(c)** maintainability of the 4,100-line single-file frontend. Fixing the five critical items in §4 before any real users arrive is the highest-leverage work.
