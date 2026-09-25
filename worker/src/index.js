// worker/src/index.js
// G WORLD — BACKEND EXTENSION
// Preserve existing member registration and verification behaviour.
// Additive architecture for payments, support, admin verification,
// certificates, information updates, monitoring and cleanup.

const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  // During the initial build, allow the browser client to call the API.
  // In production, replace '*' with the exact G WORLD frontend origin.
const ALLOWED_ORIGINS = [
  "https://g-world.ogundeyelijah13.workers.dev"
];

const PAYMENT_AMOUNT = 3000;
const PAYMENT_PROVIDER = "OPay";
const PAYMENT_ACCOUNT_NUMBER = "8051598490";
const PAYMENT_ACCOUNT_NAME = "Ogundeji Elijah Olusola";

function json(data, status = 200, extra = {}) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...JSON_HEADERS,
        ...extra
      }
    }
  );
}

function cors(request) {
  const origin = request.headers.get("Origin") || "";

  const allowed =
    ALLOWED_ORIGINS.includes(origin) ||
    origin === "http://localhost:5173" ||
    origin === "http://127.0.0.1:5173";

  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Origin": allowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods":
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(request) },
  });
function clean(value, max = 2000) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function normalizeEmail(value) {
  return clean(value, 160).toLowerCase();
}

function clean(value, max = 120) {
  return String(value ?? "").trim().slice(0, max);
function normalizePhone(value) {
  return clean(value, 40).replace(/[^\d+]/g, "");
}

function validEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
function now() {
  return new Date().toISOString();
}

function validPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
function randomId(length = 12) {
  const bytes = new Uint8Array(length);

  crypto.getRandomValues(bytes);

  return Array.from(bytes, byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function generateGWorldId() {
  const year = String(new Date().getUTCFullYear()).slice(-2);
  const number = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getUTCFullYear().toString().slice(-2);

  const bytes = new Uint32Array(1);

  crypto.getRandomValues(bytes);

  const number =
    String(bytes[0] % 1000000).padStart(6, "0");

  return `GW-${year}-${number}`;
}

async function createUniqueId(db) {
  for (let i = 0; i < 8; i++) {
    const gworldId = generateGWorldId();
    const existing = await db.prepare("SELECT id FROM members WHERE gworld_id = ?1 LIMIT 1").bind(gworldId).first();
    if (!existing) return gworldId;
async function sha256(value) {
  const data = new TextEncoder().encode(value);

  const digest =
    await crypto.subtle.digest("SHA-256", data);

  return Array.from(
    new Uint8Array(digest),
    byte => byte.toString(16).padStart(2, "0")
  ).join("");
}

async function ensureSchema(DB) {

  const statements = [

    `
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gworld_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      status TEXT NOT NULL DEFAULT 'IN TRAINING',
      created_at TEXT NOT NULL
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS member_profiles (
      member_id INTEGER PRIMARY KEY,
      profile_json TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER,
      event_type TEXT NOT NULL,
      details_json TEXT,
      created_at TEXT NOT NULL
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      gworld_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      course_key TEXT,
      course_title TEXT,
      status TEXT NOT NULL DEFAULT 'waiting',
      submitted_at TEXT NOT NULL,
      reviewed_at TEXT,
      reviewed_by TEXT,
      rejection_reason TEXT
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_support_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      gworld_id TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      status TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_admin_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked_at TEXT
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_information (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      body TEXT,
      canonical_url TEXT,
      source_name TEXT,
      fingerprint TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'review',
      discovered_at TEXT NOT NULL,
      approved_at TEXT,
      published_at TEXT,
      archived_at TEXT,
      last_checked_at TEXT,
      freshness_hours INTEGER NOT NULL DEFAULT 24
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'web',
      active INTEGER NOT NULL DEFAULT 1,
      refresh_hours INTEGER NOT NULL DEFAULT 24,
      last_checked_at TEXT,
      created_at TEXT NOT NULL
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_update_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      status TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      discovered_count INTEGER NOT NULL DEFAULT 0,
      published_count INTEGER NOT NULL DEFAULT 0,
      duplicate_count INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_usage_daily (
      usage_date TEXT PRIMARY KEY,
      page_views INTEGER NOT NULL DEFAULT 0,
      sessions INTEGER NOT NULL DEFAULT 0,
      api_requests INTEGER NOT NULL DEFAULT 0,
      api_errors INTEGER NOT NULL DEFAULT 0,
      db_reads INTEGER NOT NULL DEFAULT 0,
      db_writes INTEGER NOT NULL DEFAULT 0,
      support_messages INTEGER NOT NULL DEFAULT 0,
      payments INTEGER NOT NULL DEFAULT 0,
      update_runs INTEGER NOT NULL DEFAULT 0
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_cleanup_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id TEXT,
      description TEXT,
      size_estimate INTEGER,
      status TEXT NOT NULL DEFAULT 'review',
      created_at TEXT NOT NULL
    )
    `,

    `
    CREATE TABLE IF NOT EXISTS gworld_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
    `

  ];

  await DB.batch(
    statements.map(sql => DB.prepare(sql))
  );

  const defaults = [
    [
      "payment_amount",
      String(PAYMENT_AMOUNT)
    ],
    [
      "payment_provider",
      PAYMENT_PROVIDER
    ],
    [
      "payment_account_number",
      PAYMENT_ACCOUNT_NUMBER
    ],
    [
      "payment_account_name",
      PAYMENT_ACCOUNT_NAME
    ],
    [
      "information_freshness_hours",
      "24"
    ]
  ];

  for (const [key, value] of defaults) {
    await DB.prepare(
      `
      INSERT OR IGNORE INTO gworld_settings
      (key, value, updated_at)
      VALUES (?, ?, ?)
      `
    )
      .bind(key, value, now())
      .run();
  }
  throw new Error("Could not create a unique G WORLD ID");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }
async function getMember(DB, gworldId) {
  return DB.prepare(
    `
    SELECT
      id,
      gworld_id AS gworldId,
      name,
      phone,
      email,
      status,
      created_at AS createdAt
    FROM members
    WHERE gworld_id = ?
    LIMIT 1
    `
  )
    .bind(gworldId)
    .first();
}

    const url = new URL(request.url);
    if (url.pathname.startsWith("/verify/") && request.method === "GET") {
      const gworldId = decodeURIComponent(url.pathname.slice("/verify/".length)).trim();
async function adminCredentialsMatch(env, name, email, phone) {
  const adminEmail =
    normalizeEmail(env.ADMIN_EMAIL || "");

      if (!gworldId) {
        return new Response("Invalid G WORLD ID.", { status: 400 });
      }
  const adminPhone =
    normalizePhone(env.ADMIN_PHONE || "");

      if (!env.DB) {
        return new Response("Verification service unavailable.", { status: 503 });
      }
  const submittedEmail =
    normalizeEmail(email || "");

  const submittedPhone =
    normalizePhone(phone || "");

  if (!adminEmail || !adminPhone) {
    return false;
  }

  return (
    submittedEmail === adminEmail &&
    submittedPhone === adminPhone
  );
}

async function verifyAdminCode(env, code) {

  if (!env.ADMIN_CODE_HASH) {
    return false;
  }

  const suppliedHash =
    await sha256(String(code || ""));

  return suppliedHash === env.ADMIN_CODE_HASH;
}

async function createAdminSession(DB) {

  const token = randomId(32);

  const tokenHash =
    await sha256(token);

  const createdAt = new Date();

  const expiresAt =
    new Date(
      createdAt.getTime() +
      1000 * 60 * 60 * 8
    );

  await DB.prepare(
    `
    INSERT INTO gworld_admin_sessions
    (session_token_hash, created_at, expires_at)
    VALUES (?, ?, ?)
    `
  )
    .bind(
      tokenHash,
      createdAt.toISOString(),
      expiresAt.toISOString()
    )
    .run();

  return token;
}

async function requireAdmin(request, env) {

  const authorization =
    request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  const token =
    authorization.slice(7).trim();

  if (!token) return null;

  const tokenHash =
    await sha256(token);

  const session =
    await env.DB.prepare(
      `
      SELECT *
      FROM gworld_admin_sessions
      WHERE session_token_hash = ?
      AND revoked_at IS NULL
      AND expires_at > ?
      LIMIT 1
      `
    )
      .bind(tokenHash, now())
      .first();

  return session || null;
}

async function registerMember(request, env) {

  const body = await request.json();

      try {
        const member = await env.DB
          .prepare(
            "SELECT gworld_id, full_name, status, created_at FROM members WHERE gworld_id = ?1 LIMIT 1"
  const name = clean(body.name, 80);
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);

  if (name.length < 2) {
    return json(
      { ok: false, error: "Please enter your full name." },
      400
    );
  }

  if (phone.replace(/\D/g, "").length < 7) {
    return json(
      { ok: false, error: "Please enter a valid phone number." },
      400
    );
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return json(
      { ok: false, error: "Please enter a valid email." },
      400
    );
  }

  const existing =
    await env.DB.prepare(
      `
      SELECT
        id,
        gworld_id AS gworldId,
        name,
        phone,
        email,
        status,
        created_at AS createdAt
      FROM members
      WHERE phone = ?
      OR (
        ? <> ''
        AND lower(email) = lower(?)
      )
      LIMIT 1
      `
    )
      .bind(phone, email, email)
      .first();

  if (existing) {
    return json({
      ok: true,
      member: existing,
      existing: true
    });
  }

  let member = null;

  for (let attempt = 0; attempt < 5; attempt++) {

    const gworldId =
      generateGWorldId();

    try {

      const createdAt = now();

      const result =
        await env.DB.prepare(
          `
          INSERT INTO members
          (gworld_id, name, phone, email, status, created_at)
          VALUES (?, ?, ?, ?, 'IN TRAINING', ?)
          `
        )
          .bind(
            gworldId,
            name,
            phone,
            email || null,
            createdAt
          )
          .bind(gworldId)
          .first();

        if (!member) {
          return new Response(
            `<!doctype html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width,initial-scale=1">
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
            </html>`,
            { status: 404, headers: { "content-type": "text/html; charset=UTF-8" } }
          );
        }
          .run();

      const memberId =
        result.meta.last_row_id;

        return new Response(
          `<!doctype html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width,initial-scale=1">
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
                  <div class="value">${clean(member.full_name, 80)}</div>
                </div>
                <div class="row">
                  <div class="label">G WORLD ID</div>
                  <div class="value">${clean(member.gworld_id, 40)}</div>
                </div>
                <div class="row">
                  <div class="label">STATUS</div>
                  <div class="value">${clean(member.status, 40)}</div>
                </div>
                <div class="note">
                  This page confirms that the G WORLD membership record exists.
                  Phone numbers and email addresses are not displayed.
                </div>
              </div>
            </body>
          </html>`,
          { status: 200, headers: { "content-type": "text/html; charset=UTF-8" } }
        );
      } catch (error) {
        console.error("Verification error", error);
        return new Response("Verification service unavailable.", { status: 500 });
      await env.DB.batch([
        env.DB.prepare(
          `
          INSERT INTO member_profiles
          (member_id, profile_json, updated_at)
          VALUES (?, '{}', ?)
          `
        ).bind(memberId, createdAt),

        env.DB.prepare(
          `
          INSERT INTO audit_events
          (member_id, event_type, details_json, created_at)
          VALUES (?, 'member_registered', ?, ?)
          `
        ).bind(
          memberId,
          JSON.stringify({
            gworldId
          }),
          createdAt
        )
      ]);

      member = await getMember(
        env.DB,
        gworldId
      );

      break;

    } catch (error) {

      if (!String(error.message).toLowerCase().includes("unique")) {
        throw error;
      }
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "G WORLD API", phase: 1, environment: env.ENVIRONMENT || "unknown" }, 200, request);
    }
  }

    if (url.pathname === "/api/register" && request.method === "POST") {
      if (!env.DB) return json({ ok: false, error: "Database is not connected yet." }, 503, request);
  if (!member) {
    return json(
      {
        ok: false,
        error:
          "G WORLD could not create a unique member identity. Please try again."
      },
      500
    );
  }

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request);
      }
  return json({
    ok: true,
    member
  });
}

      const name = clean(body.name, 80);
      const phone = clean(body.phone, 30);
      const email = clean(body.email, 120);
async function memberLogin(request, env) {

      if (name.length < 2) return json({ ok: false, field: "name", error: "Please enter your full name." }, 400, request);
      if (!validPhone(phone)) return json({ ok: false, field: "phone", error: "Please enter a valid phone number." }, 400, request);
      if (!validEmail(email)) return json({ ok: false, field: "email", error: "Please enter a valid email or leave it blank." }, 400, request);
  const body = await request.json();

      try {
        const existingPhone = await env.DB.prepare("SELECT id, gworld_id, full_name, phone, email, status FROM members WHERE phone = ?1 LIMIT 1").bind(phone).first();
        if (existingPhone) {
          return json({ ok: false, error: "This phone number already has a G WORLD profile.", code: "PHONE_EXISTS" }, 409, request);
        }
  const name = clean(body.name, 80);
  const email = normalizeEmail(body.email);

        if (email) {
          const existingEmail = await env.DB.prepare("SELECT id FROM members WHERE lower(email) = lower(?1) LIMIT 1").bind(email).first();
          if (existingEmail) {
            return json({ ok: false, error: "This email already has a G WORLD profile.", code: "EMAIL_EXISTS" }, 409, request);
          }
        }
  const member =
    await env.DB.prepare(
      `
      SELECT
        id,
        gworld_id AS gworldId,
        name,
        phone,
        email,
        status,
        created_at AS createdAt
      FROM members
      WHERE lower(name) = lower(?)
      AND lower(email) = lower(?)
      LIMIT 1
      `
    )
      .bind(name, email)
      .first();

        const gworldId = await createUniqueId(env.DB);
        const createdAt = new Date().toISOString();
  if (!member) {
    return json(
      {
        ok: false,
        error:
          "We could not find a G WORLD account with those details."
      },
      404
    );
  }

        const result = await env.DB.prepare(
          `INSERT INTO members (gworld_id, full_name, phone, email, status, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, 'IN TRAINING', ?5, ?5)`
        ).bind(gworldId, name, phone, email || null, createdAt).run();
  const isAdmin =
    await adminCredentialsMatch(
      env,
      name,
      email,
      body.phone
    );

        const memberId = result.meta?.last_row_id;
        if (memberId) {
          await env.DB.prepare("INSERT INTO member_profiles (member_id) VALUES (?1)").bind(memberId).run();
          await env.DB.prepare(
            "INSERT INTO audit_events (member_id, event_type, metadata_json) VALUES (?1, 'MEMBER_REGISTERED', ?2)"
          ).bind(memberId, JSON.stringify({ source: "phase1_registration" })).run();
        }
  return json({
    ok: true,
    member,
    isAdmin
  });
}

        return json({
          ok: true,
          member: { name, phone, email, gworldId, status: "IN TRAINING", createdAt },
        }, 201, request);
      } catch (error) {
        console.error("Registration error", error);
        return json({ ok: false, error: "We could not complete your registration. Please try again." }, 500, request);
      }
async function submitPayment(request, env) {

  const body = await request.json();

  const gworldId =
    clean(body.gworldId, 40);

  const member =
    await getMember(env.DB, gworldId);

  if (!member) {
    return json(
      {
        ok: false,
        error: "G WORLD member could not be found."
      },
      404
    );
  }

  const amount =
    Number(body.amount || PAYMENT_AMOUNT);

  if (amount !== PAYMENT_AMOUNT) {
    return json(
      {
        ok: false,
        error:
          "The G WORLD learning access amount is ₦3,000."
      },
      400
    );
  }

  const existing =
    await env.DB.prepare(
      `
      SELECT *
      FROM gworld_payments
      WHERE member_id = ?
      AND status = 'waiting'
      ORDER BY id DESC
      LIMIT 1
      `
    )
      .bind(member.id)
      .first();

  if (existing) {
    return json({
      ok: true,
      status: "waiting",
      paymentId: existing.id
    });
  }

  const createdAt = now();

  const result =
    await env.DB.prepare(
      `
      INSERT INTO gworld_payments
      (
        member_id,
        gworld_id,
        amount,
        course_key,
        course_title,
        status,
        submitted_at
      )
      VALUES (?, ?, ?, ?, ?, 'waiting', ?)
      `
    )
      .bind(
        member.id,
        member.gworldId,
        PAYMENT_AMOUNT,
        clean(body.courseKey, 120),
        clean(body.course, 200),
        createdAt
      )
      .run();

  return json({
    ok: true,
    status: "waiting",
    paymentId: result.meta.last_row_id
  });
}

async function paymentStatus(request, env) {

  const url =
    new URL(request.url);

  const gworldId =
    clean(url.searchParams.get("gworldId"), 40);

  const payment =
    await env.DB.prepare(
      `
      SELECT
        id,
        amount,
        course_title AS courseTitle,
        status,
        submitted_at AS submittedAt,
        reviewed_at AS reviewedAt,
        rejection_reason AS rejectionReason
      FROM gworld_payments
      WHERE gworld_id = ?
      ORDER BY id DESC
      LIMIT 1
      `
    )
      .bind(gworldId)
      .first();

  if (!payment) {
    return json({
      ok: true,
      status: "not_paid"
    });
  }

  return json({
    ok: true,
    ...payment
  });
}

async function reviewPayment(request, env) {

  const session =
    await requireAdmin(request, env);

  if (!session) {
    return json(
      {
        ok: false,
        error: "Administrator access required."
      },
      401
    );
  }

  const body = await request.json();

  const paymentId =
    Number(body.paymentId);

  const action =
    clean(body.action, 20);

  if (!paymentId) {
    return json(
      {
        ok: false,
        error: "Payment record not specified."
      },
      400
    );
  }

  if (!["approve", "reject"].includes(action)) {
    return json(
      {
        ok: false,
        error: "Invalid payment action."
      },
      400
    );
  }

  const payment =
    await env.DB.prepare(
      `
      SELECT *
      FROM gworld_payments
      WHERE id = ?
      LIMIT 1
      `
    )
      .bind(paymentId)
      .first();

  if (!payment) {
    return json(
      {
        ok: false,
        error: "Payment record not found."
      },
      404
    );
  }

  const status =
    action === "approve"
      ? "approved"
      : "rejected";

  await env.DB.prepare(
    `
    UPDATE gworld_payments
    SET
      status = ?,
      reviewed_at = ?,
      reviewed_by = ?
    WHERE id = ?
    `
  )
    .bind(
      status,
      now(),
      "admin",
      paymentId
    )
    .run();

  if (action === "approve") {

    await env.DB.prepare(
      `
      INSERT INTO audit_events
      (member_id, event_type, details_json, created_at)
      VALUES (?, 'payment_approved', ?, ?)
      `
    )
      .bind(
        payment.member_id,
        JSON.stringify({
          paymentId
        }),
        now()
      )
      .run();

  } else {

    await env.DB.prepare(
      `
      INSERT INTO audit_events
      (member_id, event_type, details_json, created_at)
      VALUES (?, 'payment_rejected', ?, ?)
      `
    )
      .bind(
        payment.member_id,
        JSON.stringify({
          paymentId
        }),
        now()
      )
      .run();

  }

  return json({
    ok: true,
    status
  });
}

async function submitSupport(request, env) {

  const body = await request.json();

  const gworldId =
    clean(body.gworldId, 40);

  const category =
    clean(body.category, 50) || "general";

  const message =
    clean(body.message, 2000);

  if (!gworldId || !message) {
    return json(
      {
        ok: false,
        error: "Please enter a message."
      },
      400
    );
  }

  const member =
    await getMember(
      env.DB,
      gworldId
    );

  if (!member) {
    return json(
      {
        ok: false,
      error: "G WORLD member could not be found."
      },
      404
    );
  }

  let thread =
    await env.DB.prepare(
      `
      SELECT *
      FROM gworld_support_threads
      WHERE member_id = ?
      AND status <> 'resolved'
      ORDER BY id DESC
      LIMIT 1
      `
    )
      .bind(member.id)
      .first();

  const timestamp = now();

  if (!thread) {

    const result =
      await env.DB.prepare(
        `
        INSERT INTO gworld_support_threads
        (member_id, gworld_id, category, status, created_at, updated_at)
        VALUES (?, ?, ?, 'open', ?, ?)
        `
      )
        .bind(
          member.id,
          member.gworldId,
          category,
          timestamp,
          timestamp
        )
        .run();

    thread = {
      id: result.meta.last_row_id
    };
  }

  await env.DB.batch([

    env.DB.prepare(
      `
      INSERT INTO gworld_support_messages
      (thread_id, sender_type, sender_id, message, created_at)
      VALUES (?, 'member', ?, ?, ?)
      `
    )
      .bind(
        thread.id,
        member.gworldId,
        message,
        timestamp
      ),

    env.DB.prepare(
      `
      UPDATE gworld_support_threads
      SET updated_at = ?, status = 'open'
      WHERE id = ?
      `
    )
      .bind(
        timestamp,
        thread.id
      )
  ]);

  return json({
    ok: true,
    threadId: thread.id
  });
}

async function adminVerify(request, env) {

  const body = await request.json();

  const code =
    String(body.code || "");

  const valid =
    await verifyAdminCode(
      env,
      code
    );

  if (!valid) {
    return json(
      {
        ok: false,
        error: "Administrator verification failed."
      },
      401
    );
  }

  const token =
    await createAdminSession(env.DB);

  return json({
    ok: true,
    admin: {
      authenticated: true
    },
    sessionToken: token
  });
}

async function adminSupport(request, env) {

  const session =
    await requireAdmin(request, env);

  if (!session) {
    return json(
      {
        ok: false,
        error: "Administrator access required."
      },
      401
    );
  }

  const rows =
    await env.DB.prepare(
      `
      SELECT
        t.id,
        t.gworld_id AS gworldId,
        t.category,
        t.status,
        t.created_at AS createdAt,
        t.updated_at AS updatedAt,
        m.name
      FROM gworld_support_threads t
      JOIN members m
        ON m.id = t.member_id
      ORDER BY t.updated_at DESC
      LIMIT 100
      `
    )
      .all();

  return json({
    ok: true,
    messages: rows.results || []
  });
}

async function publishFreshness(env) {

  const cutoff =
    new Date(
      Date.now() -
      24 * 60 * 60 * 1000
    ).toISOString();

  await env.DB.prepare(
    `
    UPDATE gworld_information
    SET
      status = 'existing',
      archived_at = ?
    WHERE status = 'published'
    AND published_at < ?
    `
  )
    .bind(
      now(),
      cutoff
    )
    .run();
}

async function dailyUpdate(env) {

  const started =
    now();

  const run =
    await env.DB.prepare(
      `
      INSERT INTO gworld_update_runs
      (category, status, started_at)
      VALUES ('all', 'running', ?)
      `
    )
      .bind(started)
      .run();

  const runId =
    run.meta.last_row_id;

  try {

    await publishFreshness(env);

    /*
      Approved source fetching belongs here.

      Each source should be:
      1. Checked only when due.
      2. Retrieved through its approved adapter.
      3. Normalised.
      4. Fingerprinted.
      5. Deduplicated.
      6. Added to the review queue.
      7. Never automatically published.

      The existing approved information remains visible if a source
      fails. No failed update is allowed to wipe current information.
    */

    await env.DB.prepare(
      `
      UPDATE gworld_update_runs
      SET
        status = 'completed',
        finished_at = ?
      WHERE id = ?
      `
    )
      .bind(
        now(),
        runId
      )
      .run();

  } catch (error) {

    await env.DB.prepare(
      `
      UPDATE gworld_update_runs
      SET
        status = 'failed',
        finished_at = ?,
        error_count = 1
      WHERE id = ?
      `
    )
      .bind(
        now(),
        runId
      )
      .run();

    throw error;
  }
}

async function health(env) {

  const memberCount =
    await env.DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM members
      `
    ).first();

  const waitingPayments =
    await env.DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM gworld_payments
      WHERE status = 'waiting'
      `
    ).first();

  const reviewQueue =
    await env.DB.prepare(
      `
      SELECT COUNT(*) AS count
      FROM gworld_information
      WHERE status = 'review'
      `
    ).first();

  return json({
    ok: true,
    service: "G WORLD",
    status: "healthy",
    applicationMetrics: {
      members: Number(memberCount?.count || 0),
      waitingPayments: Number(waitingPayments?.count || 0),
      informationReviewQueue:
        Number(reviewQueue?.count || 0)
    },
    providerMetrics:
      "Provider-level free-tier metrics must be obtained from the provider account/observability layer; application estimates are not presented as official provider limits."
  });
}

export default {
  async fetch(request, env) {

    const headers =
      cors(request);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers
      });
    }
if (url.pathname === "/api/member-login" && request.method === "POST") {
      if (!env.DB) {
        return json(
          { ok: false, error: "Database is not connected yet." },
          503,
          request
        );

    try {

      await ensureSchema(env.DB);

      const url =
        new URL(request.url);

      const path =
        url.pathname;

      let response;

      if (
        path === "/api/health" &&
        request.method === "GET"
      ) {
        response =
          await health(env);
      }

      let body;
      else if (
        path === "/api/register" &&
        request.method === "POST"
      ) {
        response =
          await registerMember(request, env);
      }

      try {
        body = await request.json();
      } catch {
        return json(
          { ok: false, error: "Invalid request." },
          400,
          request
        );
      else if (
        path === "/api/member-login" &&
        request.method === "POST"
      ) {
        response =
          await memberLogin(request, env);
      }

      const name = clean(body.name, 80);
      const email = clean(body.email, 120);

      if (name.length < 2) {
        return json(
          {
            ok: false,
            field: "name",
            error: "Please enter your full name."
          },
          400,
          request
        );
      else if (
        path === "/api/payment/submit" &&
        request.method === "POST"
      ) {
        response =
          await submitPayment(request, env);
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json(
          {
            ok: false,
            field: "email",
            error: "Please enter a valid email."
          },
          400,
          request
        );
      else if (
        path === "/api/payment/status" &&
        request.method === "GET"
      ) {
        response =
          await paymentStatus(request, env);
      }

      try {
        const member = await env.DB
          .prepare(
            `SELECT
              id,
              gworld_id,
              full_name,
              phone,
              email,
              status,
              created_at
             FROM members
             WHERE lower(trim(full_name)) = lower(trim(?1))
             AND lower(trim(email)) = lower(trim(?2))
             LIMIT 1`
          )
          .bind(name, email)
          .first();
      else if (
        path === "/api/support" &&
        request.method === "POST"
      ) {
        response =
          await submitSupport(request, env);
      }

      else if (
        path === "/api/admin/verify" &&
        request.method === "POST"
      ) {
        response =
          await adminVerify(request, env);
      }

      else if (
        path === "/api/admin/payment/review" &&
        request.method === "POST"
      ) {
        response =
          await reviewPayment(request, env);
      }

      else if (
        path === "/api/admin/support" &&
        request.method === "GET"
      ) {
        response =
          await adminSupport(request, env);
      }

      else if (
        path.startsWith("/verify/")
      ) {

        const gworldId =
          decodeURIComponent(
            path.slice("/verify/".length)
          ).trim();

        if (!gworldId) {
          response =
            new Response(
              "Invalid G WORLD ID",
              {
                status: 400,
                headers: {
                  "Content-Type": "text/plain; charset=utf-8"
                }
              }
            );
        } else {

          const member =
            await getMember(
              env.DB,
              gworldId
            );

          if (!member) {
            response =
              new Response(
                `
                <!doctype html>
                <html>
                  <head>
                    <title>G WORLD Verification</title>
                    <meta name="viewport"
                      content="width=device-width,initial-scale=1">
                  </head>
                  <body>
                    <h1>Member Not Found</h1>
                    <p>NOT VERIFIED</p>
                  </body>
                </html>
                `,
                {
                  status: 404,
                  headers: {
                    "Content-Type":
                      "text/html; charset=utf-8"
                  }
                }
              );
          } else {

            response =
              new Response(
                `
                <!doctype html>
                <html>
                  <head>
                    <title>G WORLD Verification</title>
                    <meta name="viewport"
                      content="width=device-width,initial-scale=1">
                  </head>
                  <body>
                    <h1>G WORLD</h1>
                    <p>VERIFIED MEMBER</p>
                    <p><strong>Name:</strong>
                      ${escapeHTML(member.name)}
                    </p>
                    <p><strong>G WORLD ID:</strong>
                      ${escapeHTML(member.gworldId)}
                    </p>
                    <p><strong>Status:</strong>
                      ${escapeHTML(member.status)}
                    </p>
                  </body>
                </html>
                `,
                {
                  status: 200,
                  headers: {
                    "Content-Type":
                      "text/html; charset=utf-8"
                  }
                }
              );
          }
        }
      }

        if (!member) {
          return json(
      else {
        response =
          json(
            {
              ok: false,
              error:
                "We could not find a G WORLD account with those details."
              error: "Not found."
            },
            404,
            request
            404
          );
      }

      const finalHeaders =
        new Headers(response.headers);

      Object.entries(headers)
        .forEach(([key, value]) => {
          finalHeaders.set(key, value);
        });

      return new Response(
        response.body,
        {
          status: response.status,
          headers: finalHeaders
        }
      );

        return json(
          {
            ok: true,
            member: {
              name: member.full_name,
              phone: member.phone,
              email: member.email,
              gworldId: member.gworld_id,
              status: member.status,
              createdAt: member.created_at
            }
          },
          200,
          request
        );
      } catch (error) {
        console.error("Member login error", error);

        return json(
          {
            ok: false,
            error:
              "We could not access your G WORLD account. Please try again."
          },
          500,
          request
        );
      }
    } catch (error) {

      console.error(error);

      return json(
        {
          ok: false,
          error:
            "G WORLD encountered an unexpected server error."
        },
        500,
        headers
      );
    }
    
    return json({ ok: false, error: "Not found." }, 404, request);
  },

  async scheduled(event, env, ctx) {

    ctx.waitUntil(
      dailyUpdate(env)
        .catch(error =>
          console.error(
            "G WORLD scheduled update failed:",
            error
          )
        )
    );

  }
};

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
