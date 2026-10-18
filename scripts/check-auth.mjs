// Explicit local-only integration check. Never accepts a remote URL or real credentials.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, randomInt } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:5173';
const email = `preview-smoke-${randomUUID()}@example.invalid`;
const password = randomBytes(32).toString('base64url');
let attemptedRegistration = false;
async function request(path, { body, token, method = 'GET' } = {}) {
  try {
    return await fetch(base + path, {
      method, signal: AbortSignal.timeout(15_000), redirect: 'error',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('Cannot reach the local preview. Start npm run dev:full, then retry.');
  }
}
async function check() {
  const health = await request('/api/health');
  assert.equal(health.status, 200, 'Frontend-to-API proxy is unavailable. Start npm run dev:full.');
  const status = await health.json();
  assert.ok(status.service === 'G WORLD API' && status.environment === 'development', 'Refusing to create a test account outside the local development environment.');
  assert.equal((await request('/api/ready')).status, 200, 'Local account tables are unavailable. Run npm run db:local.');
  console.log('PASS: API reachable through frontend; account tables ready.');
  const account = { name: 'Temporary Preview Smoke Test', email, phone: `080${String(randomInt(100_000_000)).padStart(8, '0')}`, password };
  attemptedRegistration = true;
  const registered = await request('/api/register', { method: 'POST', body: account });
  assert.equal(registered.status, 201, 'Temporary registration failed.');
  assert.ok((await registered.json()).token, 'Registration did not establish a session.');
  assert.equal((await request('/api/register', { method: 'POST', body: account })).status, 409, 'Duplicate account should be rejected.');
  assert.equal((await request('/api/member-login', { method: 'POST', body: { email, password: randomUUID() } })).status, 401, 'Wrong password should be rejected.');
  const login = await request('/api/member-login', { method: 'POST', body: { email, password } });
  assert.equal(login.status, 200, 'Valid local login failed.');
  const session = await login.json();
  assert.ok(session.token && session.member?.gworldId, 'Login did not return a complete session.');
  assert.equal((await request('/api/me', { token: session.token })).status, 200, 'Authenticated session check failed.');
  assert.equal((await request('/api/auth/logout', { method: 'POST', token: session.token })).status, 200, 'Logout failed.');
  assert.equal((await request('/api/me', { token: session.token })).status, 401, 'Logged-out session should no longer work.');
  console.log('PASS: registration, duplicate rejection, wrong-password rejection, login, session validation, logout and session revocation.');
}
try {
  await check();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (attemptedRegistration) {
    // UUID email contains no SQL metacharacters; target only this script's fixture.
    const member = `SELECT id FROM members WHERE email = '${email}'`;
    const sql = `DELETE FROM audit_events WHERE member_id IN (${member}); DELETE FROM sessions WHERE member_id IN (${member}); DELETE FROM member_profiles WHERE member_id IN (${member}); DELETE FROM members WHERE email = '${email}';`;
    try {
      execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'g-world', '--local', '--config', 'worker/wrangler.toml', '--command', sql], { cwd: root, stdio: 'pipe', timeout: 30_000 });
      console.log('Temporary local account and related test records removed.');
    } catch {
      console.error('FAIL: temporary local account cleanup failed. No production data was accessed.');
      process.exitCode = 1;
    }
  }
}
