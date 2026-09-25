const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "cache-control": "no-store",
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  // During the initial build, allow the browser client to call the API.
  // In production, replace '*' with the exact G WORLD frontend origin.
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...corsHeaders(request) },
  });
}

function clean(value, max = 120) {
  return String(value ?? "").trim().slice(0, max);
}

function validEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

function generateGWorldId() {
  const year = String(new Date().getUTCFullYear()).slice(-2);
  const number = Math.floor(100000 + Math.random() * 900000);
  return `GW-${year}-${number}`;
}

async function createUniqueId(db) {
  for (let i = 0; i < 8; i++) {
    const gworldId = generateGWorldId();
    const existing = await db.prepare("SELECT id FROM members WHERE gworld_id = ?1 LIMIT 1").bind(gworldId).first();
    if (!existing) return gworldId;
  }
  throw new Error("Could not create a unique G WORLD ID");
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith("/verify/") && request.method === "GET") {
      const gworldId = decodeURIComponent(url.pathname.slice("/verify/".length)).trim();

      if (!gworldId) {
        return new Response("Invalid G WORLD ID.", { status: 400 });
      }

      if (!env.DB) {
        return new Response("Verification service unavailable.", { status: 503 });
      }

      try {
        const member = await env.DB
          .prepare(
            "SELECT gworld_id, full_name, status, created_at FROM members WHERE gworld_id = ?1 LIMIT 1"
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
      }
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "G WORLD API", phase: 1, environment: env.ENVIRONMENT || "unknown" }, 200, request);
    }

    if (url.pathname === "/api/register" && request.method === "POST") {
      if (!env.DB) return json({ ok: false, error: "Database is not connected yet." }, 503, request);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid request." }, 400, request);
      }

      const name = clean(body.name, 80);
      const phone = clean(body.phone, 30);
      const email = clean(body.email, 120);

      if (name.length < 2) return json({ ok: false, field: "name", error: "Please enter your full name." }, 400, request);
      if (!validPhone(phone)) return json({ ok: false, field: "phone", error: "Please enter a valid phone number." }, 400, request);
      if (!validEmail(email)) return json({ ok: false, field: "email", error: "Please enter a valid email or leave it blank." }, 400, request);

      try {
        const existingPhone = await env.DB.prepare("SELECT id, gworld_id, full_name, phone, email, status FROM members WHERE phone = ?1 LIMIT 1").bind(phone).first();
        if (existingPhone) {
          return json({ ok: false, error: "This phone number already has a G WORLD profile.", code: "PHONE_EXISTS" }, 409, request);
        }

        if (email) {
          const existingEmail = await env.DB.prepare("SELECT id FROM members WHERE lower(email) = lower(?1) LIMIT 1").bind(email).first();
          if (existingEmail) {
            return json({ ok: false, error: "This email already has a G WORLD profile.", code: "EMAIL_EXISTS" }, 409, request);
          }
        }

        const gworldId = await createUniqueId(env.DB);
        const createdAt = new Date().toISOString();

        const result = await env.DB.prepare(
          `INSERT INTO members (gworld_id, full_name, phone, email, status, created_at, updated_at)
           VALUES (?1, ?2, ?3, ?4, 'IN TRAINING', ?5, ?5)`
        ).bind(gworldId, name, phone, email || null, createdAt).run();

        const memberId = result.meta?.last_row_id;
        if (memberId) {
          await env.DB.prepare("INSERT INTO member_profiles (member_id) VALUES (?1)").bind(memberId).run();
          await env.DB.prepare(
            "INSERT INTO audit_events (member_id, event_type, metadata_json) VALUES (?1, 'MEMBER_REGISTERED', ?2)"
          ).bind(memberId, JSON.stringify({ source: "phase1_registration" })).run();
        }

        return json({
          ok: true,
          member: { name, phone, email, gworldId, status: "IN TRAINING", createdAt },
        }, 201, request);
      } catch (error) {
        console.error("Registration error", error);
        return json({ ok: false, error: "We could not complete your registration. Please try again." }, 500, request);
      }
    }
if (url.pathname === "/api/member-login" && request.method === "POST") {
      if (!env.DB) {
        return json(
          { ok: false, error: "Database is not connected yet." },
          503,
          request
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return json(
          { ok: false, error: "Invalid request." },
          400,
          request
        );
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

        if (!member) {
          return json(
            {
              ok: false,
              error:
                "We could not find a G WORLD account with those details."
            },
            404,
            request
          );
        }

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
    }
    
    return json({ ok: false, error: "Not found." }, 404, request);
  },
};
