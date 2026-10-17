#!/usr/bin/env node
// Prints a PBKDF2 salt + hash for an administrator code, ready to insert
// into the admin_users table. Usage:
//
//   node scripts/hash-code.mjs "YOUR-ADMIN-CODE"
//
// Then (replace MEMBER_ID):
//
//   npx wrangler d1 execute g-world --remote --command \
//     "INSERT INTO admin_users (member_id, password_hash, password_salt)
//      VALUES (MEMBER_ID, 'HASH', 'SALT')"

const code = process.argv[2];
if (!code || code.length < 8) {
  console.error("Usage: node scripts/hash-code.mjs <admin-code (min 8 chars)>");
  process.exit(1);
}

const PBKDF2_ITERATIONS = 100000;

function bytesToHex(bytes) {
  return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(code),
  "PBKDF2",
  false,
  ["deriveBits"]
);
const bits = await crypto.subtle.deriveBits(
  { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
  key,
  256
);

console.log("salt:", bytesToHex(salt));
console.log("hash:", bytesToHex(new Uint8Array(bits)));
