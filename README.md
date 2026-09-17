# G WORLD — Phase 1 Foundation + Live Registration

This version keeps the approved G WORLD entrance and registration form, but registration now goes through the G WORLD API and D1 database instead of generating a member only in the browser.

## Flow

1. G WORLD logo entrance
2. Registration form
3. Server-side validation
4. Permanent G WORLD ID generation
5. Member record saved in D1
6. Digital member card shown
7. Enter G WORLD

## Free launch architecture

- Frontend: Cloudflare Pages (free)
- API: Cloudflare Workers (free tier)
- Database: Cloudflare D1 (free tier)
- Videos later: embedded from YouTube rather than stored on G WORLD

The application keeps provider boundaries separate so infrastructure can be upgraded later without rebuilding the G WORLD product.

## 1. Create the D1 database

From the `worker` folder, after installing Wrangler and logging into Cloudflare:

```bash
npx wrangler login
npx wrangler d1 create g-world
```

Cloudflare will return a `database_id`. Put that value into `worker/wrangler.toml` in place of `REPLACE_AFTER_CREATING_D1_DATABASE`.

Then initialize the schema:

```bash
npx wrangler d1 execute g-world --remote --file=../schema/schema.sql
```

## 2. Deploy the API

```bash
cd worker
npx wrangler deploy
```

Copy the Worker URL that Wrangler gives you. It will be used by the frontend.

## 3. Build the frontend

From the project root:

```bash
npm install
```

Create a `.env` file based on `.env.example` and set:

```text
VITE_API_BASE_URL=YOUR_G_WORLD_WORKER_URL
```

Then:

```bash
npm run build
```

Deploy the generated `dist` folder to Cloudflare Pages.

## 4. Important production setting

The Worker currently returns the requesting browser origin in CORS so the first deployment is easy to test. Before public launch, restrict `Access-Control-Allow-Origin` to the exact G WORLD frontend domain.

## 5. Current Phase 1 limitations

- No password/account recovery yet.
- G WORLD ID is persistent in D1.
- Browser localStorage is only used to remember the last member on that device; D1 is the source of truth for registration.
- QR on the member card is still a visual placeholder. The next card/security step should replace it with a real verification QR pointing to a secure G WORLD verification route.
- Payment, courses, progress, certificates, Control Room, and other future modules are not yet enabled.
