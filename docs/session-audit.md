# G WORLD — session change and server audit

**Date:** 18 October 2026
**Scope:** accumulated changes on `arena/4dfb2ac5-g-world` against baseline `f3cdc3e`, including newly added files.
**Verdict:** local preview authentication is working. The frontend redesign is not a completed production LMS. Several inherited billing/content limitations remain launch blockers.

## What was reviewed

- Logo/favicon changes, theme controls, navigation, carousel lifecycle and six distinct carousel assets.
- Welcome layout, requested placeholder totals, faculty catalogue, preview subjects, Excel roadmap, homepage resources and footer.
- Subpage illustrations, responsive grids, keyboard navigation, generated-photo provenance and optimized assets.
- Frontend API wrapper, remembered sessions, logout, settings and payment display updates.
- Vite proxy, full-stack development launcher, local D1 schema initialization, auth smoke test, Worker endpoints, CORS and production configuration.
- Package manifest/lockfile, ignore rules, documentation, unit tests and browser tests.

This was a source review plus local integration/regression testing, not an external penetration test or a production database inspection.

## Confirmed issues corrected during the audit

| Severity | Finding and origin | Correction / evidence |
|---|---|---|
| High | Cached name/ID could open a signed-in-looking homepage without checking a server session. This predated the redesign; old browser layout tests also relied on it. This was a UI authentication inconsistency, not proof of a protected-API bypass. | Startup now checks `/api/me`; invalid caches are cleared, unavailable service fails closed with a notice. Added `src/session.js`, unit tests and browser regressions. Layout tests now explicitly mock the server session. |
| High | Cookie-only session restoration could undermine an offline logout if its revocation request failed. | Logout intent is retained locally until the API confirms revocation. Reload retries logout instead of silently restoring the cookie session. Covered by a browser regression. |
| Medium | Admin logout revoked its token but left a signed-in-looking member homepage. Inherited behavior. | Admin logout now clears the local session and returns to account entry. |
| Medium | New `/api/ready` checked table existence only: old tables missing password columns could pass, and registration auditing/payment lookup dependencies were omitted. | It now checks required authentication, profile, audit and access-lookup columns with zero-row queries. Missing migrations return generic 503; no member data or database errors are exposed. |
| Medium | Inherited CORS omitted `Access-Control-Allow-Credentials`, despite frontend requests using `credentials: include`; unapproved origins received an unrelated fallback origin. | Only explicitly allowlisted origins receive an exact origin and credential permission, including preflight. Added server regressions. Same-origin hosting needs no CORS allowlist. |
| Medium | Inherited malformed cookie/verification URL decoding and scalar/null JSON bodies could throw; corrupt expiry dates could evade the expiry comparison. | Invalid encodings and JSON shapes now return controlled 400/401 responses; invalid expiry dates are rejected. Added server regressions. |
| Medium | Python and Work Ready prices remained hard-coded while the new homepage used configured pricing. | All these displays use the configured amount, with in-place updates. Browser test verifies a nondefault price. |
| Medium | Settings callbacks could re-render an unrelated page or reset a pending payment button/admin form. Inherited async behavior became more visible with the redesign. | Settings update payment amounts, provider, recipient and copy-button value in place. Editable admin forms are not replaced. Added delayed-response regression. |
| Medium | Inherited payment insertion always recorded `OPay`, even when admin settings selected another provider. | Payment rows now bind the configured provider; unit regression verifies it. |
| Medium | New homepage copy claimed a per-course entitlement, but `hasActiveAccess()` grants account-level access after any approved payment. | Removed the per-course claim from new homepage copy. Billing scope itself was not silently changed. |
| Medium | Plain `npm run dev` started only Vite, the previously confirmed cause of preview login failures. | It now starts the same supervised frontend/API stack as `dev:full`. `dev:frontend` is the explicit frontend-only command. Launcher checks occupied ports and waits for account readiness. Duplicate-start rejection was exercised against the running preview. |
| Medium | Root deployment configuration defaulted to development/local origins; local secret-file patterns were not all ignored. These were existing configuration risks. | Root config now defaults to `production` and same-origin access. Local Worker config remains `development`. Added ignores for local `.env.*`/`.dev.vars*`, keeping `.env.example`. No secret leak was established. |

Relevant files: `src/main.js`, `src/session.js`, `src/home-sections.js`, `worker/src/index.js`, `scripts/dev.mjs`, `wrangler.toml`, `playwright.config.js`, `.gitignore`.

## Unresolved issues and decisions — do not confuse these with completed features

### High: configured-payment fallback can be unsafe

`src/main.js` still has built-in payment defaults and `loadSettings()` silently keeps defaults/cached settings on failure. `getSettings()` in the Worker also falls back if its settings query fails. If an administrator has changed the receiving account, an outage can therefore display old payment instructions.

**Next action:** make the transfer UI fail closed until current payment settings are verified, and distinguish intentional defaults from a failed settings lookup. This audit did not change the existing payment-availability policy or approve any payment.

### High: paid-learning and certification claims exceed the implemented backend

The six existing management roadmaps and parts of the Python/Work Ready UI promise full lessons, assessments, projects and certificate eligibility. The backend/schema still scaffold much of this: there is no complete published-course delivery/progress/certificate-issuance workflow in the reviewed router. The displayed certificate is a frontend template, not server-issued completion evidence.

**Next action:** verify/publish the actual paid material and implement server-backed completion/issuance before representing this as a completed paid LMS. New Art, Science and Excel topic previews remain clearly labelled and do not offer a paid unlock for unpublished preview content.

### High: access is account-wide, not course-scoped

`hasActiveAccess()` checks for any approved payment belonging to the member. Payments store a course title, not an enforced course entitlement. New presentation copy was corrected, but per-course access still requires a product decision and backend implementation.

### High: older accounts may have no usable password

The auth migration adds password hash/salt columns; it does not create passwords for legacy accounts. Login correctly rejects records without those values, and there is no password recovery flow. A readiness check cannot prove that an individual account has valid credentials.

**Next action:** inspect legacy-account aggregate counts in the correct production environment and implement a secure recovery/invitation flow. Do not invent passwords or reset real accounts during diagnosis.

### Medium: manual-payment reconciliation is incomplete

Submission creates another pending payment each time; there is no enforced idempotency key or external transfer reconciliation. Button disabling helps only within one mounted page. Approval is manual. Full billing changes were left out of this audit.

### Medium: production security/operations remain unverified

- Rate limiting is recommended in the README, but external Cloudflare rules were not inspected or configured.
- Production URL, bindings, migrations, cookie/origin behavior and real-account login were not verified remotely.
- Bearer tokens remain in localStorage as well as an HttpOnly cookie; this carries the usual script-injection exposure. Cookie-only auth/CSRF policy needs separate design if token storage is removed.
- Some database exceptions outside route-specific catches can still become Worker errors; readiness helps diagnosis but is not global error middleware.
- The dev supervisor is a local tool, not a production uptime monitor. Windows process-tree shutdown was not tested.

## Server anomalies distinguished from bugs

1. **Earlier preview login failure:** Vite was up while port 8787 had no API process; proxy requests failed with `ECONNREFUSED`. This was not a verified wrong-password or production-account failure.
2. **Separate databases:** an aggregate local query found zero accounts outside temporary smoke fixtures. Local D1 is isolated by `--local`, even though configuration contains the production database identifier. No production account data was inspected or deleted.
3. **Wrangler `Request.cf` warnings:** outbound metadata fetches fail in this restricted sandbox and Wrangler uses a placeholder. Local readiness/login tests still pass. The warning alone is not evidence that authentication is broken.
4. **Dependency refresh:** replacing dependencies with `npm ci` while the old dev processes were running caused a temporary unresponsive preview during this audit. The stack was stopped/restarted and reverified. Stop development servers before dependency replacement.
5. **Placeholders versus live stats:** welcome values 20/30/10 are intentionally labelled placeholders, as requested. `/api/stats` remains unused by that UI; these values are not verified student/instructor/achievement records.

## Verification completed

- Clean `npm ci`: successful; lockfile and manifest resolve together.
- `npm run build`: successful; 61 modules, approximately 67.91 KB CSS and 165.13 KB JS before gzip.
- `npm test`: **41/41 passing**.
- Full browser regression suite: **23/23 passing**, including 320–1440 px layouts, themes, carousel, faculty filters, Excel navigation, invalid sessions, unavailable auth service, configured prices, delayed settings and offline logout.
- `npm run check:auth`: successful against the actual local Worker and D1 through the frontend proxy; registration, duplicate rejection, bad password, correct login, authenticated lookup, logout and session revocation verified.
- Additional real-browser login/logout check: successful using a temporary generated account, without mocked authentication. Temporary records removed.
- `npm audit`: **0 reported vulnerabilities** at the time of the check; not a security certification.
- `wrangler deploy --dry-run --config wrangler.toml`: successful with production defaults and bundled frontend assets. **No deployment took place.**
- `git diff --check`: clean.
- Final local checks: `/`, `/api/health`, `/api/ready` all returned **HTTP 200**.

The preview is running with the supervised startup command. No remote migration, account reset, payment approval, secret change, commit, push or production deployment was performed.
