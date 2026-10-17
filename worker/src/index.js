const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store",
};

const HTML_SECURITY_HEADERS = {
  "content-type": "text/html; charset=UTF-8",
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'",
  "x-content-type-options": "nosniff",
  "x-robots-tag": "noindex, nofollow",
};

const SESSION_COOKIE = "gw_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_BITS = 256;

/* =========================================================
   Small utilities
   ========================================================= */

function clean(value, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function validEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Normalize Nigerian phone numbers to a stable local format so that
 * "+234 805 123 4567", "2348051234567" and "08051234567" are one identity.
 */
function normalizePhone(phone) {
  let digits = String(phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function randomHex(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(String(text))
  );
  return bytesToHex(new Uint8Array(digest));
}

/** Constant-time string comparison. */
function safeEqual(a, b) {
  const s = String(a ?? "");
  const t = String(b ?? "");
  let diff = s.length ^ t.length;
  const max = Math.max(s.length, t.length);
  for (let i = 0; i < max; i++) {
    diff |= (s.charCodeAt(i) || 0) ^ (t.charCodeAt(i) || 0);
  }
  return diff === 0;
}

async function hashPassword(password, saltHex) {
  const salt = hexToBytes(saltHex);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(String(password)),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    key,
    PBKDF2_BITS
  );
  return bytesToHex(new Uint8Array(bits));
}

async function verifyPassword(password, saltHex, expectedHashHex) {
  const actual = await hashPassword(password, saltHex);
  return safeEqual(actual, expectedHashHex);
}

function generateGWorldId() {
  const year = String(new Date().getUTCFullYear()).slice(-2);
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const number = (buffer[0] % 900000) + 100000;
  return `GW-${year}-${number}`;
}

async function createUniqueId(db) {
  for (let i = 0; i < 8; i++) {
    const gworldId = generateGWorldId();
    const existing = await db
      .prepare("SELECT id FROM members WHERE gworld_id = ?1 LIMIT 1")
      .bind(gworldId)
      .first();
    if (!existing) return gworldId;
  }
  throw new Error("Could not create a unique G WORLD ID");
}

function isUniqueViolation(error) {
  return /UNIQUE constraint failed|SQLITE_CONSTRAINT/i.test(String(error?.message ?? error ?? ""));
}

/* =========================================================
   CORS (allowlist — never reflect arbitrary origins)
   ========================================================= */

function allowedOrigin(env) {
  const list = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  return list;
}

function corsHeaders(request, env) {
  const list = allowedOrigin(env);
  const origin = request.headers.get("Origin");
  const allow = origin && list.includes(origin) ? origin : (list[0] || "");
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
  if (allow) headers["Access-Control-Allow-Origin"] = allow;
  return headers;
}

function json(data, status, request, env, sessionToken, clearCookie = false) {
  const headers = { ...JSON_HEADERS, ...corsHeaders(request, env) };
  if (sessionToken) headers["set-cookie"] = sessionCookie(sessionToken, request);
  if (clearCookie) headers["set-cookie"] = clearSessionCookie(request);
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

/* =========================================================
   Sessions
   ========================================================= */

function sessionCookie(token, request) {
  const secure = String(request?.url || "").startsWith("https:") ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie(request) {
  const secure = String(request?.url || "").startsWith("https:") ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function extractToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

async function createSession(env, memberId, admin = false) {
  const token = randomHex(32);
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();
  await env.DB.prepare(
    "INSERT INTO sessions (member_id, token_hash, admin, created_at, expires_at) VALUES (?1, ?2, ?3, ?4, ?5)"
  )
    .bind(memberId, tokenHash, admin ? 1 : 0, now.toISOString(), expiresAt)
    .run();
  return { token, expiresAt };
}

async function destroySession(env, request) {
  const token = extractToken(request);
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?1").bind(tokenHash).run();
}

/**
 * Authenticates the request from the Bearer token or session cookie.
 * Returns { member, admin } on success or { error, status } on failure.
 */
async function requireAuth(request, env) {
  if (!env.DB) {
    return { error: "Database is not connected yet.", status: 503 };
  }
  const token = extractToken(request);
  if (!token) {
    return { error: "Please sign in to continue.", status: 401 };
  }
  const tokenHash = await sha256Hex(token);
  const session = await env.DB.prepare(
    `SELECT s.id AS session_id, s.admin AS is_admin, s.expires_at,
            m.id AS member_id, m.gworld_id, m.full_name, m.phone, m.email,
            m.status, m.created_at
       FROM sessions s
       JOIN members m ON m.id = s.member_id
      WHERE s.token_hash = ?1
      LIMIT 1`
  )
    .bind(tokenHash)
    .first();

  if (!session) {
    return { error: "Your session is invalid or has ended.", status: 401 };
  }
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?1").bind(session.session_id).run();
    return { error: "Your session has expired.", status: 401 };
  }

  const member = {
    name: session.full_name,
    phone: session.phone,
    email: session.email,
    gworldId: session.gworld_id,
    status: session.status,
    createdAt: session.created_at,
  };
  return { member, memberId: session.member_id, admin: !!session.is_admin };
}

async function requireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth;
  if (!auth.admin) return { error: "Administrator access required.", status: 403 };
  return auth;
}

/** Server-authoritative access check: at least one APPROVED payment. */
async function hasActiveAccess(env, memberId) {
  const row = await env.DB.prepare(
    "SELECT 1 AS ok FROM payments WHERE member_id = ?1 AND status = 'APPROVED' LIMIT 1"
  )
    .bind(memberId)
    .first();
  return !!row;
}

/* =========================================================
   Settings (admin-editable operational values)
   ========================================================= */

const SETTINGS_DEFAULTS = {
  payment_amount: "3000",
  payment_provider: "OPay",
  payment_account_number: "8051598490",
  payment_account_name: "Ogundeji Elijah Olusola",
};

/**
 * Resolution order: settings table (admin-edited) > env vars > built-in
 * defaults — so admins can change payment details without code changes.
 */
async function getSettings(env) {
  const merged = { ...SETTINGS_DEFAULTS };
  if (env.PAYMENT_AMOUNT) merged.payment_amount = String(env.PAYMENT_AMOUNT);
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare("SELECT key, value FROM settings").all();
      for (const row of results || []) {
        if (Object.prototype.hasOwnProperty.call(merged, row.key)) {
          merged[row.key] = String(row.value);
        }
      }
    } catch {
      // settings table not created yet — fall back to defaults
    }
  }
  return {
    payment: {
      amount: Number(merged.payment_amount) || 3000,
      provider: merged.payment_provider,
      accountNumber: merged.payment_account_number,
      accountName: merged.payment_account_name,
    },
  };
}

function memberPayload(member, extra = {}) {
  return {
    ok: true,
    member: {
      name: member.name,
      phone: member.phone,
      email: member.email,
      gworldId: member.gworldId,
      status: member.status,
      createdAt: member.createdAt,
    },
    ...extra,
  };
}

/* =========================================================
   Verification page (QR target)
   ========================================================= */

function verifyPage(member) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="robots" content="noindex, nofollow">
      <title>G WORLD Member Verification</title>
      <style>
        body{margin:0;background:#050b18;color:#fff;font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px}
        .card{max-width:460px;width:100%;background:#0c1830;border:1px solid #1d4560;border-radius:20px;padding:30px;box-sizing:border-box}
        .brand{font-size:24px;font-weight:700;letter-spacing:2px}
        .tag{color:#7ee6c5;font-size:13px;margin-top:6px}
        .verified{margin-top:30px;color:#69e6a8;font-weight:700}
        h1{font-size:27px;margin:10px 0 25px}
        .row{border-top:1px solid #20344e;padding:15px 0}
        .label{font-size:11px;color:#8292a8;letter-spacing:1px}
        .value{font-size:17px;margin-top:6px}
        .note{margin-top:25px;color:#9eacc0;font-size:13px;line-height:1.6}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">G WORLD</div>
        <div class="tag">Discover What You Need to Know.</div>
        <div class="verified">✓ VERIFIED G WORLD MEMBER</div>
        <h1>Membership Verification</h1>
        <div class="row">
          <div class="label">NAME</div>
          <div class="value">${escapeHtml(clean(member.full_name, 80))}</div>
        </div>
        <div class="row">
          <div class="label">G WORLD ID</div>
          <div class="value">${escapeHtml(clean(member.gworld_id, 40))}</div>
        </div>
        <div class="row">
          <div class="label">STATUS</div>
          <div class="value">${escapeHtml(clean(member.status, 40))}</div>
        </div>
        <div class="note">
          This page confirms that the G WORLD membership record exists.
          Phone numbers and email addresses are not displayed.
        </div>
      </div>
    </body>
  </html>`;
}

function verifyNotFoundPage() {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <meta name="robots" content="noindex, nofollow">
      <title>G WORLD Verification</title>
      <style>
        body{margin:0;background:#050b18;color:#fff;font-family:Arial,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px}
        .card{max-width:460px;width:100%;background:#0c1830;border:1px solid #1d4560;border-radius:20px;padding:30px;box-sizing:border-box}
        .brand{font-size:24px;font-weight:700;letter-spacing:2px;color:#fff}
        .tag{color:#7ee6c5;font-size:13px;margin-top:6px}
        h1{font-size:25px;margin:35px 0 10px}
        p{color:#b8c4d6;line-height:1.6}
        .status{display:inline-block;margin-top:12px;padding:8px 12px;border-radius:20px;background:#3b2024;color:#ff9a9a;font-size:13px}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">G WORLD</div>
        <div class="tag">Discover What You Need to Know.</div>
        <h1>Member Not Found</h1>
        <p>We could not find a G WORLD membership record for this ID.</p>
        <div class="status">NOT VERIFIED</div>
      </div>
    </body>
  </html>`;
}

/* =========================================================
   Router
   ========================================================= */

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);

    /* ---------- Public: member verification (QR target) ---------- */
    if (url.pathname.startsWith("/verify/") && request.method === "GET") {
      const gworldId = decodeURIComponent(url.pathname.slice("/verify/".length)).trim();

      if (!gworldId) {
        return new Response("Invalid G WORLD ID.", {
          status: 400,
          headers: { "x-content-type-options": "nosniff" },
        });
      }
      if (!env.DB) {
        return new Response("Verification service unavailable.", {
          status: 503,
          headers: { "x-content-type-options": "nosniff" },
        });
      }

      try {
        const member = await env.DB
          .prepare(
            "SELECT gworld_id, full_name, status FROM members WHERE gworld_id = ?1 LIMIT 1"
          )
          .bind(gworldId)
          .first();

        if (!member) {
          return new Response(verifyNotFoundPage(), {
            status: 404,
            headers: HTML_SECURITY_HEADERS,
          });
        }

        return new Response(verifyPage(member), {
          status: 200,
          headers: HTML_SECURITY_HEADERS,
        });
      } catch (error) {
        console.error("Verification error", error);
        return new Response("Verification service unavailable.", {
          status: 500,
          headers: { "x-content-type-options": "nosniff" },
        });
      }
    }

    /* ---------- Public: health ---------- */
    if (url.pathname === "/api/health" && request.method === "GET") {
      return json(
        {
          ok: true,
          service: "G WORLD API",
          phase: 1,
          environment: env.ENVIRONMENT || "unknown",
        },
        200,
        request,
        env
      );
    }

    /* ---------- Public: registration ---------- */
    if (url.pathname === "/api/register" && request.method === "POST") {
      if (!env.DB) return json({ ok: false, error: "Database is not connected yet." }, 503, request, env);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request, env);
      }

      const name = clean(body.name, 80);
      const phone = normalizePhone(clean(body.phone, 30));
      const email = normalizeEmail(clean(body.email, 120));
      const password = String(body.password ?? "");

      if (name.length < 2) {
        return json({ ok: false, field: "name", error: "Please enter your full name." }, 400, request, env);
      }
      if (!validPhone(phone)) {
        return json({ ok: false, field: "phone", error: "Please enter a valid phone number." }, 400, request, env);
      }
      if (!validEmail(email)) {
        return json({ ok: false, field: "email", error: "Please enter a valid email or leave it blank." }, 400, request, env);
      }
      if (password.length < 8 || password.length > 128) {
        return json(
          { ok: false, field: "password", error: "Please choose a password of at least 8 characters." },
          400,
          request,
          env
        );
      }

      try {
        const existingPhone = await env.DB
          .prepare("SELECT id FROM members WHERE phone = ?1 LIMIT 1")
          .bind(phone)
          .first();
        if (existingPhone) {
          return json(
            { ok: false, error: "This phone number already has a G WORLD profile.", code: "PHONE_EXISTS" },
            409,
            request,
            env
          );
        }

        if (email) {
          const existingEmail = await env.DB
            .prepare("SELECT id FROM members WHERE lower(email) = ?1 LIMIT 1")
            .bind(email)
            .first();
          if (existingEmail) {
            return json(
              { ok: false, error: "This email already has a G WORLD profile.", code: "EMAIL_EXISTS" },
              409,
              request,
              env
            );
          }
        }

        const gworldId = await createUniqueId(env.DB);
        const createdAt = new Date().toISOString();
        const saltHex = randomHex(16);
        const passwordHash = await hashPassword(password, saltHex);

        // Atomic: member + profile + audit row succeed or fail together.
        // The dependent rows resolve the new member id via subquery on gworld_id.
        const results = await env.DB.batch([
          env.DB
            .prepare(
              `INSERT INTO members (gworld_id, full_name, phone, email, password_hash, password_salt, status, created_at, updated_at)
               VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'IN TRAINING', ?7, ?7)`
            )
            .bind(gworldId, name, phone, email || null, passwordHash, saltHex, createdAt),
          env.DB
            .prepare(
              "INSERT INTO member_profiles (member_id) SELECT id FROM members WHERE gworld_id = ?1"
            )
            .bind(gworldId),
          env.DB
            .prepare(
              `INSERT INTO audit_events (member_id, event_type, metadata_json)
               SELECT id, 'MEMBER_REGISTERED', ?2 FROM members WHERE gworld_id = ?1`
            )
            .bind(gworldId, JSON.stringify({ source: "phase1_registration" })),
        ]);

        const memberId = results?.[0]?.meta?.last_row_id;

        const session = await createSession(env, memberId, false);

        return json(
          {
            ok: true,
            member: {
              name,
              phone,
              email,
              gworldId,
              status: "IN TRAINING",
              createdAt,
            },
            token: session.token,
            access: false,
          },
          201,
          request,
          env,
          session.token
        );
      } catch (error) {
        console.error("Registration error", error);
        if (isUniqueViolation(error)) {
          return json(
            { ok: false, error: "Those details already belong to a G WORLD profile.", code: "DUPLICATE" },
            409,
            request,
            env
          );
        }
        return json(
          { ok: false, error: "We could not complete your registration. Please try again." },
          500,
          request,
          env
        );
      }
    }

    /* ---------- Public: member login (email + password) ---------- */
    if (url.pathname === "/api/member-login" && request.method === "POST") {
      if (!env.DB) {
        return json({ ok: false, error: "Database is not connected yet." }, 503, request, env);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request, env);
      }

      const email = normalizeEmail(clean(body.email, 120));
      const password = String(body.password ?? "");

      if (!validEmail(email) || !email) {
        return json({ ok: false, field: "email", error: "Please enter a valid email." }, 400, request, env);
      }
      if (!password) {
        return json({ ok: false, field: "password", error: "Please enter your password." }, 400, request, env);
      }

      try {
        const member = await env.DB
          .prepare(
            `SELECT id, gworld_id, full_name, phone, email, status, created_at,
                    password_hash, password_salt
               FROM members
              WHERE lower(email) = ?1
              LIMIT 1`
          )
          .bind(email)
          .first();

        const valid =
          member &&
          member.password_hash &&
          member.password_salt &&
          (await verifyPassword(password, member.password_salt, member.password_hash));

        if (!valid) {
          return json(
            { ok: false, error: "We could not find a G WORLD account with those details." },
            401,
            request,
            env
          );
        }

        const adminRow = await env.DB
          .prepare("SELECT 1 AS ok FROM admin_users WHERE member_id = ?1 LIMIT 1")
          .bind(member.id)
          .first();

        const session = await createSession(env, member.id, false);
        const access = await hasActiveAccess(env, member.id);

        return json(
          {
            ok: true,
            member: {
              name: member.full_name,
              phone: member.phone,
              email: member.email,
              gworldId: member.gworld_id,
              status: member.status,
              createdAt: member.created_at,
            },
            token: session.token,
            isAdmin: !!adminRow,
            access,
          },
          200,
          request,
          env,
          session.token
        );
      } catch (error) {
        console.error("Member login error", error);
        return json(
          { ok: false, error: "We could not access your G WORLD account. Please try again." },
          500,
          request,
          env
        );
      }
    }

    /* ---------- Auth: logout ---------- */
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      if (env.DB) await destroySession(env, request);
      return json({ ok: true }, 200, request, env, "", true);
    }

    /* ---------- Auth: current member ---------- */
    if (url.pathname === "/api/me" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);
      const access = await hasActiveAccess(env, auth.memberId);
      return json(memberPayload(auth.member, { access, isAdmin: auth.admin }), 200, request, env);
    }

    /* ---------- Auth: support message ---------- */
    if (url.pathname === "/api/support" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request, env);
      }

      const category = clean(body.category, 40) || "general";
      const message = clean(body.message, 2000);
      if (!message) {
        return json({ ok: false, error: "Please enter your message." }, 400, request, env);
      }

      try {
        await env.DB.prepare(
          "INSERT INTO support_messages (member_id, category, message) VALUES (?1, ?2, ?3)"
        )
          .bind(auth.memberId, category, message)
          .run();
        return json({ ok: true }, 201, request, env);
      } catch (error) {
        console.error("Support error", error);
        return json({ ok: false, error: "We could not send your message. Please try again." }, 500, request, env);
      }
    }

    /* ---------- Auth: payment submission ---------- */
    if (url.pathname === "/api/payment/submit" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      let body;
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      // Amount is server-authoritative (settings table > env > default);
      // the client value is display-only.
      const settings = await getSettings(env);
      const amount = settings.payment.amount;
      const courseTitle = clean(body.course, 120) || "G WORLD Learning Access";

      try {
        const result = await env.DB.prepare(
          `INSERT INTO payments (member_id, amount, provider, course_title, status)
           VALUES (?1, ?2, 'OPay', ?3, 'PENDING')`
        )
          .bind(auth.memberId, amount, courseTitle)
          .run();

        return json(
          {
            ok: true,
            payment: {
              id: result.meta?.last_row_id,
              amount,
              status: "PENDING",
              courseTitle,
            },
          },
          201,
          request,
          env
        );
      } catch (error) {
        console.error("Payment submit error", error);
        return json({ ok: false, error: "We could not record your payment. Please try again." }, 500, request, env);
      }
    }

    /* ---------- Auth: payment status ---------- */
    if (url.pathname === "/api/payment/status" && request.method === "GET") {
      const auth = await requireAuth(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      const payment = await env.DB.prepare(
        `SELECT id, amount, status, course_title, submitted_at, reviewed_at
           FROM payments
          WHERE member_id = ?1
          ORDER BY submitted_at DESC, id DESC
          LIMIT 1`
      )
        .bind(auth.memberId)
        .first();

      const access = await hasActiveAccess(env, auth.memberId);
      const status = payment ? String(payment.status).toLowerCase() : "none";

      return json({ ok: true, status, access, payment: payment || null }, 200, request, env);
    }

    /* ---------- Admin: code verification (elevates the session) ---------- */
    if (url.pathname === "/api/admin/verify" && request.method === "POST") {
      const auth = await requireAuth(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request, env);
      }

      const code = String(body.code ?? "");

      try {
        // 1) Preferred: per-admin hashed code in admin_users.
        const adminRow = await env.DB.prepare(
          `SELECT au.password_hash, au.password_salt
             FROM admin_users au
             JOIN members m ON m.id = au.member_id
            WHERE m.id = ?1
            LIMIT 1`
        )
          .bind(auth.memberId)
          .first();

        let granted = false;
        if (adminRow) {
          granted = await verifyPassword(code, adminRow.password_salt, adminRow.password_hash);
        } else if (env.ADMIN_ACCESS_CODE) {
          // 2) Bootstrap fallback: shared code configured in Worker secrets.
          granted = safeEqual(code, env.ADMIN_ACCESS_CODE);
        }

        if (!granted) {
          return json({ ok: false, error: "Administrator verification failed." }, 403, request, env);
        }

        const session = await createSession(env, auth.memberId, true);
        return json(
          { ok: true, admin: { authenticated: true }, token: session.token },
          200,
          request,
          env,
          session.token
        );
      } catch (error) {
        console.error("Admin verify error", error);
        return json({ ok: false, error: "Administrator verification failed." }, 500, request, env);
      }
    }

    /* ---------- Admin: payment review queue ---------- */
    if (url.pathname === "/api/admin/payments" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      const { results } = await env.DB.prepare(
        `SELECT p.id, p.amount, p.status, p.course_title, p.submitted_at,
                m.full_name, m.gworld_id, m.phone
           FROM payments p
           JOIN members m ON m.id = p.member_id
          ORDER BY p.submitted_at DESC, p.id DESC
          LIMIT 50`
      ).all();

      return json({ ok: true, payments: results || [] }, 200, request, env);
    }

    /* ---------- Admin: approve / reject a payment ---------- */
    if (url.pathname === "/api/admin/payment/review" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request, env);
      }

      const action = clean(body.action, 20);
      const paymentId = Number(body.paymentId);
      if (!["approve", "reject"].includes(action) || !Number.isInteger(paymentId)) {
        return json({ ok: false, error: "Invalid review request." }, 400, request, env);
      }

      const status = action === "approve" ? "APPROVED" : "REJECTED";
      const result = await env.DB.prepare(
        `UPDATE payments
            SET status = ?1, reviewed_at = ?2
          WHERE id = ?3 AND status = 'PENDING'`
      )
        .bind(status, new Date().toISOString(), paymentId)
        .run();

      if (!result.meta?.changes) {
        return json({ ok: false, error: "Payment not found or already reviewed." }, 404, request, env);
      }

      return json({ ok: true, status }, 200, request, env);
    }

    /* ---------- Admin: support inbox ---------- */
    if (url.pathname === "/api/admin/support" && request.method === "GET") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      const { results } = await env.DB.prepare(
        `SELECT sm.id, sm.category, sm.message, sm.status, sm.created_at,
                m.full_name, m.gworld_id
           FROM support_messages sm
           LEFT JOIN members m ON m.id = sm.member_id
          ORDER BY sm.created_at DESC, sm.id DESC
          LIMIT 100`
      ).all();

      return json({ ok: true, messages: results || [] }, 200, request, env);
    }

    /* ---------- Public: settings (payment details are intentionally public) ---------- */
    if (url.pathname === "/api/settings" && request.method === "GET") {
      const settings = await getSettings(env);
      return json({ ok: true, ...settings }, 200, request, env);
    }

    /* ---------- Admin: update settings ---------- */
    if (url.pathname === "/api/admin/settings" && request.method === "POST") {
      const auth = await requireAdmin(request, env);
      if (auth.error) return json({ ok: false, error: auth.error }, auth.status, request, env);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request, env);
      }

      const amount = Number(body.paymentAmount);
      if (!Number.isInteger(amount) || amount < 100 || amount > 10000000) {
        return json({ ok: false, error: "Please enter a valid payment amount." }, 400, request, env);
      }

      const rows = {
        payment_amount: String(amount),
        payment_provider: clean(body.paymentProvider, 60) || "OPay",
        payment_account_number: clean(body.paymentAccountNumber, 30),
        payment_account_name: clean(body.paymentAccountName, 120),
      };
      if (!rows.payment_account_number || !rows.payment_account_name) {
        return json({ ok: false, error: "Account number and account name are required." }, 400, request, env);
      }

      try {
        await env.DB.batch(
          Object.entries(rows).map(([key, value]) =>
            env.DB
              .prepare(
                `INSERT INTO settings (key, value) VALUES (?1, ?2)
                 ON CONFLICT(key) DO UPDATE SET value = ?2, updated_at = CURRENT_TIMESTAMP`
              )
              .bind(key, value)
          )
        );
        const settings = await getSettings(env);
        return json({ ok: true, ...settings }, 200, request, env);
      } catch (error) {
        console.error("Settings error", error);
        return json({ ok: false, error: "We could not save the settings." }, 500, request, env);
      }
    }

    return json({ ok: false, error: "Not found." }, 404, request, env);
  },
};

/* =========================================================
   Exported for unit tests (node --test)
   ========================================================= */
export {
  clean,
  escapeHtml,
  validEmail,
  validPhone,
  normalizeEmail,
  normalizePhone,
  generateGWorldId,
  safeEqual,
  hashPassword,
  verifyPassword,
};
