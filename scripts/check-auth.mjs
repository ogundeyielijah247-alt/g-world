// Explicit local-only integration check. Never accepts a remote URL or real credentials.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, randomInt } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'http://127.0.0.1:5173';
const email = `preview-smoke-${randomUUID()}@example.invalid`;
const password = randomBytes(32).toString('base64url');
const phone = `080${String(randomInt(100_000_000)).padStart(8, '0')}`;
const phoneOnly = `081${String(randomInt(100_000_000)).padStart(8, '0')}`;
const phoneOnlyName = `Temporary Phone Only ${randomUUID()}`;
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
  const account = { name: 'Temporary Preview Smoke Test', email, phone, password };
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
  for (const identifier of [email.toUpperCase(), phone, `+234 ${phone.slice(1)}`]) {
    const response = await request('/api/member-login', { method: 'POST', body: { identifier, password } });
    assert.equal(response.status, 200, 'Email/phone identifier login failed.');
    const signedIn = await response.json();
    assert.equal(signedIn.member.gworldId, session.member.gworldId);
    await request('/api/auth/logout', { method: 'POST', token: signedIn.token });
  }
  const noEmail = await request('/api/register', { method: 'POST', body: { name: phoneOnlyName, phone: phoneOnly, password } });
  assert.equal(noEmail.status, 201, 'Registration without optional email failed.');
  const phoneAccount = await noEmail.json();
  await request('/api/auth/logout', { method: 'POST', token: phoneAccount.token });
  const phoneLogin = await request('/api/member-login', { method: 'POST', body: { identifier: phoneOnly, password } });
  assert.equal(phoneLogin.status, 200, 'An account registered without email must be able to sign in.');
  const phoneSession = await phoneLogin.json();
  assert.equal(phoneSession.member.gworldId, phoneAccount.member.gworldId);
  assert.equal((await request('/api/me', { token: phoneSession.token })).status, 200);
  await request('/api/auth/logout', { method: 'POST', token: phoneSession.token });
  console.log('PASS: email and normalized phone login; registration and return login without email.');
  console.log('PASS: registration, duplicate rejection, wrong-password rejection, login, session validation, logout and session revocation.');
}
try {
  await check();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (attemptedRegistration) {
    // UUID fixture markers contain no SQL metacharacters. Never delete by phone:
    // a duplicate phone could belong to a pre-existing local account.
    const member = `SELECT id FROM members WHERE email = '${email}' OR full_name = '${phoneOnlyName}'`;
    const sql = `DELETE FROM audit_events WHERE member_id IN (${member}); DELETE FROM sessions WHERE member_id IN (${member}); DELETE FROM member_profiles WHERE member_id IN (${member}); DELETE FROM members WHERE email = '${email}' OR full_name = '${phoneOnlyName}';`;
    try {
      execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'g-world', '--local', '--config', 'worker/wrangler.toml', '--command', sql], { cwd: root, stdio: 'pipe', timeout: 30_000 });
      console.log('Temporary local account and related test records removed.');
    } catch {
      console.error('FAIL: temporary local account cleanup failed. No production data was accessed.');
      process.exitCode = 1;
    }
  }
}
