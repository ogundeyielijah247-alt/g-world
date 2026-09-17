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

    return json({ ok: false, error: "Not found." }, 404, request);
  },
};
