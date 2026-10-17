# G WORLD — Fix Plan (Step-by-Step Correction Plan)

> **Status:** S1–S9 and S10–S12 executed and verified (unit tests + live API
> smoke + all-52-screens render smoke). S13 is documented in README §8 and
> remains execution-time work at real deploy.

This document turns every issue from `ANALYSIS.md` into an ordered, executable correction step. Each step lists **files touched → exact changes → how to verify → done when**. Steps are sequenced so security fixes land first and later work never builds on a broken foundation.

Branch: `arena/895ac0b5-g-world` · Execute in order (S1 → S13).

---

## Phase 0 — Safety net (do first, ~15 min)

### S1. Repository hygiene
**Files:** `.gitignore` (new), `.env.example` (new), `README.md`

1. Create `.gitignore`:
   ```
   node_modules/
   dist/
   .env
   .wrangler/
   ```
2. Create `.env.example` (README already references it but it does not exist):
   ```
   VITE_API_BASE_URL=http://127.0.0.1:8787
   ```
3. Commit these before any code change so secrets/build output can never be committed.

**Done when:** `git status` ignores `node_modules`, `dist`, `.env`; `cp .env.example .env` works.

---

## Phase 1 — Critical security (the five 🔴 items)

### S2. Fix the stored XSS in the worker's `/verify` page 🔴
**Files:** `worker/src/index.js`

1. Add an HTML-escape helper next to `clean()`:
   ```js
   function escapeHtml(value) {
     return String(value ?? "").replace(/[&<>"']/g, c =>
       ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
     );
   }
   ```
2. Replace every `${clean(member.full_name, 80)}` etc. in the verify HTML with `${escapeHtml(clean(member.full_name, 80))}` (name, id, status — 3 interpolations in the verified card).
3. Add defense-in-depth headers to both verify responses:
   ```js
   "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
   "x-content-type-options": "nosniff",
   ```
4. Remove the interpolation entirely from the *not-found* page (it has none — confirm).

**Verify:** register with name `<img src=x onerror=alert(1)>`, open `/verify/<id>`, the name must render as literal text; response headers contain the CSP.
**Done when:** no raw `${...}` of DB values appears unescaped in any HTML template in the worker.

### S3. Make member IDs unpredictable + fix the QR base URL 🟠→🔴
**Files:** `worker/src/index.js`, `src/main.js`

1. Replace `Math.random()` in `generateGWorldId()` with `crypto.getRandomValues(new Uint32Array(1))[0]` modulo the range (keep the `GW-YY-NNNNNN` format for now; plan a longer ID at next schema revision).
2. In `src/main.js`, derive the verify URL from config instead of the hardcoded `g-world.ogundeyelijah13.workers.dev`:
   ```js
   const VERIFY_BASE = (import.meta.env.VITE_VERIFY_BASE_URL || API_BASE).replace(/\/$/, "");
   // QR target: `${VERIFY_BASE}/verify/${encodeURIComponent(member.gworldId)}`
   ```
   Add `VITE_VERIFY_BASE_URL` to `.env.example`.
3. Document in README that QR links must resolve on the deployed origin.

**Verify:** two registrations produce unrelated IDs; QR encodes the configured host.
**Done when:** no `Math.random()` in ID generation; no hardcoded workers.dev URL in `src/main.js`.

### S4. Lock down CORS + add abuse protection 🔴
**Files:** `worker/src/index.js`, `wrangler.toml`, `worker/wrangler.toml`

1. Replace origin-reflection with an allowlist read from env:
   ```js
   const ALLOWED = new Set((env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean));
   const origin = request.headers.get("Origin");
   const allow = origin && ALLOWED.has(origin) ? origin : (ALLOWED.values().next().value || "");
   // Access-Control-Allow-Origin: allow   (never echo arbitrary origins)
   ```
2. Add `ALLOWED_ORIGINS = "https://your-frontend.example"` to `[vars]` in both wrangler files (keep `development` value local).
3. Document (README) enabling **Cloudflare Rate Limiting** on `/api/register`, `/api/member-login`, and `/verify/*` (dashboard rule or WAF custom rule) — Workers free tier has no built-in limiter.

**Verify:** `curl -H "Origin: https://evil.test" .../api/health -i` does **not** return that origin in ACAO; the real frontend still works.
**Done when:** reflected `Origin` echo is gone; rate limiting documented (and configured post-deploy).

### S5. Real authentication — replace name+email "login" 🔴 (biggest step; split into 2 commits)
**Files:** `worker/src/index.js`, `src/main.js`, `schema/schema.sql`

**5a — Credentials (commit 1):**
1. Schema migration (new `schema/migrations/001_auth.sql`):
   ```sql
   ALTER TABLE members ADD COLUMN password_hash TEXT;
   ALTER TABLE members ADD COLUMN password_salt TEXT;
   CREATE TABLE IF NOT EXISTS admin_users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     member_id INTEGER UNIQUE REFERENCES members(id) ON DELETE CASCADE,
     password_hash TEXT NOT NULL,
     password_salt TEXT NOT NULL,
     role TEXT NOT NULL DEFAULT 'ADMIN'
   );
   CREATE TABLE IF NOT EXISTS sessions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
     token_hash TEXT NOT NULL UNIQUE,
     created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
     expires_at TEXT NOT NULL
   );
   ```
2. Worker: hash passwords with PBKDF2 via Web Crypto (`crypto.subtle.deriveBits`, 100k iterations, SHA-256, per-user random 16-byte salt; constant-time compare).
3. `POST /api/register` accepts `password` (min 8 chars) and stores hash+salt; validation error `400 { field: "password" }` if weak.
4. Replace `POST /api/member-login` semantics: lookup **by email**, verify password, then create a session: random 32-byte token, store only `SHA-256(token)` in `sessions`, return token in `Set-Cookie: gw_session=...; HttpOnly; Secure; SameSite=Lax; Path=/` **and** in JSON (SPA uses `credentials: "include"` already — keep cookie authoritative).

**5b — Enforce sessions + admin (commit 2):**
5. Add `requireAuth(request, env)` helper; protect every member endpoint with it (stop trusting client-sent `gworldId` — read the session's member).
6. Implement `POST /api/admin/verify` (admin login by member email + **separate admin code** hashed in `admin_users`) returning `isAdmin: true` so the existing frontend branch at `result.isAdmin` becomes reachable.
7. Frontend: update registration form (add password field), login form (email + password), remove name-based matching; on 401 responses clear `localStorage.gworld` and go to `entry`.
8. Rate-limit-login note in README; "no password recovery" limitation stays, but add `POST /api/auth/logout` (destroys session row).

**Verify:** wrong password → 401 and no token; session cookie rejected after logout/expiry; `/api/member-login` with only name+email no longer authenticates.
**Done when:** there is no code path that treats name+email as authentication.

### S6. De-identify + protect `/verify` enumeration 🔴
**Files:** `worker/src/index.js`

1. Keep `/verify/:id` (QR must work) but:
   - Add a lightweight in-worker throttle is not possible without state — therefore **document Cloudflare Rate Limiting** (from S4) as the control, and
   - Make the verify page show only: name + `G WORLD ID` + status (already true) and add `noindex` meta + `X-Robots-Tag: noindex, nofollow`.
2. Acceptance check that IDs from S3 are unguessable so enumeration is impractical.

**Done when:** verify page is index-excluded; ID entropy ≥ 29 bits (`crypto` 6-digit + year) with documented upgrade path to signed QR payloads.

---

## Phase 2 — Correctness & data integrity

### S7. Normalize identity data + atomic registration 🟡
**Files:** `worker/src/index.js`, `schema/schema.sql`

1. Normalize before validate/store:
   ```js
   function normalizePhone(phone) {
     const digits = String(phone).replace(/[^\d+]/g, "");
     const local = digits.replace(/^\+?234/, "0"); // NG local format
     return local;
   }
   const normalizeEmail = e => String(e || "").trim().toLowerCase();
   ```
2. Store normalized values; unique checks use the normalized forms.
3. Wrap the three registration inserts in one atomic batch:
   ```js
   await env.DB.batch([ memberInsert, profileInsert, auditInsert ]);
   ```
4. Catch constraint errors and map to friendly 409s (race-safe):
   ```js
   if (String(error).includes("UNIQUE")) return json({ ok:false, error: "...", code: "DUPLICATE" }, 409, request);
   ```
5. Schema hardening in the same migration file:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email_lower ON members(lower(email));
   CREATE TABLE IF NOT EXISTS payments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
     amount INTEGER NOT NULL,
     provider TEXT NOT NULL DEFAULT 'OPay',
     reference TEXT,
     course_title TEXT,
     status TEXT NOT NULL DEFAULT 'PENDING'
       CHECK (status IN ('PENDING','APPROVED','REJECTED')),
     submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
     reviewed_at TEXT, reviewed_by INTEGER
   );
   CREATE TABLE IF NOT EXISTS support_messages (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
     category TEXT NOT NULL DEFAULT 'general',
     message TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED')),
     created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
   );
   ```

**Verify:** register with `+234 805 123 4567` then `08051234567` → second gets 409; killing the 2nd statement is impossible from the client (batch).
**Done when:** phone/email uniqueness is format-proof and case-proof; no partial member rows.

---

## Phase 3 — Close the frontend↔backend gaps

### S8. Implement the missing endpoints (or deliberately stub them) 🟠
**Files:** `worker/src/index.js`, `src/main.js`, `schema/schema.sql` (from S7)

Implement, in this order, each authenticated:
1. `POST /api/support` → insert `support_messages` (uses session member, not body `gworldId`).
2. `GET /api/admin/support` → list `support_messages` (admin session only).
3. `POST /api/payment/submit` → insert `payments` row `PENDING` (does **not** unlock anything client-side).
4. `GET /api/payment/status?...` → return that member's latest payment status (session-derived).
5. `POST /api/admin/payment/review` → set `APPROVED`/`REJECTED` + `reviewed_by`, only from `admin_users` sessions.
6. Server-side access gate helper `hasActiveAccess(memberId)` used by content endpoints going forward.

**Verify:** each route returns real data end-to-end from the existing UI buttons; 401 for non-admin on admin routes.
**Done when:** `grep 'api("' src/main.js` shows no call that 404s.

### S9. Update the two forms + admin gate in the SPA 🟠
**Files:** `src/main.js`

1. Registration form (`#f`): add `password` + `confirm` fields, client-side min-8 check with `data-error="password"` (mirrors server).
2. Login form (`#existing-form`): change fields to `email` + `password`; drop full-name matching.
3. Admin gate (`#admin-code-form`): POST `email` + `code` so `/api/admin/verify` can authenticate.
4. Send `credentials: "include"` (already present) and stop storing the full member record (name + id only) in `localStorage`; never store phone/email/token there.

**Done when:** login/registration flows work against S5–S8 with no secrets in `localStorage`.

---

## Phase 4 — Frontend architecture & UX

### S10. Break up `render()` and preserve form state 🟡
**Files:** `src/main.js` (refactor only — behavior preserved)

1. Extract each screen into `function renderSplash()`, `renderEntry()`, … `renderAdminSettings()` returning HTML strings; `render()` becomes a `switch (state.screen)` dispatch. No template content changes in this step (pure refactor, one commit).
2. Keep a `formData` slice in `state` updated on `input` events for the three forms; templates repopulate `value="${esc(state.formData.x)}"` so error/loading re-renders don't wipe typing.
3. Replace `alert()` calls (quiz, CBT, project topic, admin confirmations) with inline `state.toast` messages rendered in a small toast component.

**Verify:** submit registration with a duplicate phone → error shows and typed fields survive; every screen still reachable via the click map.
**Done when:** `render()` < 50 lines dispatching to functions each < 200 lines; zero `alert()`.

### S11. Dead code & config truth 🟡
**Files:** `src/main.js`, `src/style.css`, `package.json`, `wrangler.toml`, `README.md`

1. Wire the light theme properly (persist `data-theme` in localStorage + a toggle in nav) **or** delete `html[data-theme="light"]` block — choose one.
2. `state.selectedPayment`: set it when the admin opens a pending payment row (S8 endpoints return ids) — otherwise remove the admin approve/reject buttons.
3. Move `PAYMENT` config (amount/provider/account) to a `settings` table + `GET /api/settings` (public values only), so the admin Settings screen becomes genuinely editable "without changing application code" as its copy claims.
4. `package.json`: move `vite` to `devDependencies`; remove `typescript` (unused) or add `tsconfig` and type-check script.
5. README rewrite: QR is real (not placeholder); D1 `database_id` is already configured (drop "REPLACE_AFTER_…"); declare the single-deploy (Workers Assets) story as canonical, remove the Pages+Workers CORS story or vice versa; add auth/reset limitations.

**Done when:** README, wrangler configs and code tell the same story; no unreachable CSS or unset state fields.

---

## Phase 5 — Safety net for the future

### S12. Tests + lint 🟡
**Files:** `package.json`, `test/` (new)

1. Add `vitest` + `eslint` as devDeps; `"test"`, `"lint"` scripts.
2. Unit tests first for pure logic (extractable without a harness): `clean`, `escapeHtml`, `validEmail`, `validPhone`, `normalizePhone`, `generateGWorldId` entropy shape, PBKDF2 hash/verify round-trip.
3. Worker route tests via `wrangler`/`unstable_dev` or plain function-level tests of the handler with a mocked `env.DB` (register → 409 duplicate → 401 paths).

**Done when:** `npm test` and `npm run lint` pass locally.

### S13. Deploy checklist (execution-time, not code)
1. `npx wrangler d1 execute g-world --remote --file=schema/migrations/001_auth.sql`
2. Set `ENVIRONMENT = "production"` + real `ALLOWED_ORIGINS` in wrangler vars.
3. `npm run build && npx wrangler deploy` (root `wrangler.toml` — single origin, SPA + API).
4. Enable Cloudflare Rate Limiting rules (S4/S6).
5. Smoke: register → card QR → scan `/verify` on phone → login → support message → payment submit → admin approve → content unlock.

---

## Execution order & risk

| Step | Phase | Risk | Rollback |
|---|---|---|---|
| S1 hygiene | 0 | none | n/a |
| S2 XSS escape | 1 | low | revert commit |
| S3 IDs + QR base | 1 | low | revert (old IDs still valid) |
| S4 CORS allowlist | 1 | low | widen allowlist |
| S5 auth (2 commits) | 1 | **medium** (breaking login) | deploy with `AUTH_DISABLED=1` flag during migration |
| S6 verify hardening | 1 | low | n/a |
| S7 normalization + batch | 2 | medium (new 409s for old duplicate formats) | migration is additive |
| S8 missing endpoints | 3 | low | routes independent |
| S9 forms | 3 | low | ships with S5/S8 |
| S10 render split | 4 | **medium** (big diff) | pure-refactor commit, revert-safe |
| S11 config truth | 4 | low | n/a |
| S12 tests/lint | 5 | none | n/a |

**Definition of done for the whole plan:** the five 🔴 findings from `ANALYSIS.md` are closed (S2–S6), every frontend API call resolves (S8), no auth path exists without a credential (S5), and the repo has `.gitignore`, `.env.example`, passing tests and a truthful README.

> Suggested first execution slice: **S1 + S2 + S3 + S4** in one session — highest security value, lowest risk, all independently revertable.
