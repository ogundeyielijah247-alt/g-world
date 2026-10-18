import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';
test('credentialed CORS is enabled only for an explicit allowed origin', async () => {
  for (const origin of ['https://allowed.test', 'https://untrusted.test']) {
    const response = await worker.fetch(new Request('https://api.test/api/health', { headers: { Origin: origin } }), { ALLOWED_ORIGINS: 'https://allowed.test' });
    assert.equal(response.headers.get('access-control-allow-origin'), origin === 'https://allowed.test' ? origin : null);
    assert.equal(response.headers.get('access-control-allow-credentials'), origin === 'https://allowed.test' ? 'true' : null);
  }
});
test('allowed preflight supports bearer and credentialed requests', async () => {
  const response = await worker.fetch(new Request('https://api.test/api/member-login', { method: 'OPTIONS', headers: { Origin: 'https://allowed.test' } }), { ALLOWED_ORIGINS: 'https://allowed.test' });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  assert.ok(response.headers.get('access-control-allow-headers').includes('Authorization'));
});
test('malformed cookies are rejected without querying the database', async () => {
  const response = await worker.fetch(new Request('https://api.test/api/me', { headers: { Cookie: 'gw_session=%ZZ' } }), { DB: { prepare() { throw new Error('must not query'); } } });
  assert.equal(response.status, 401);
});
test('malformed verification URLs return 400 rather than throwing', async () => {
  const response = await worker.fetch(new Request('https://api.test/verify/%ZZ'), {});
  assert.equal(response.status, 400);
});
test('null and array JSON login bodies return 400 rather than throwing', async () => {
  for (const value of ['null', '[]', '"string"']) {
    const response = await worker.fetch(new Request('https://api.test/api/member-login', { method: 'POST', body: value, headers: {'Content-Type': 'application/json'} }), { DB: {} });
    assert.equal(response.status, 400);
  }
});
test('corrupt expiry dates do not grant sessions', async () => {
  let removed = false;
  const DB = { prepare() { return { bind() { return this; }, first: async () => ({ session_id: 1, expires_at: 'bad-date' }), run: async () => { removed = true; } }; } };
  const response = await worker.fetch(new Request('https://api.test/api/me', { headers: { Authorization: 'Bearer test' } }), { DB });
  assert.equal(response.status, 401);
  assert.equal(removed, true);
});
test('recorded payment provider follows the configured setting', async () => {
  let values;
  const DB = { prepare(sql) { return {
    bind(...args) { if (sql.includes('INSERT INTO payments')) values = args; return this; },
    first: async () => ({ member_id: 12, expires_at: new Date(Date.now() + 60000).toISOString() }),
    all: async () => ({ results: [{ key: 'payment_provider', value: 'Configured Bank' }, { key: 'payment_amount', value: '4500' }] }),
    run: async () => ({ meta: { last_row_id: 1 } }),
  }; } };
  const response = await worker.fetch(new Request('https://api.test/api/payment/submit', { method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' }, body: JSON.stringify({ course: 'Accounting' }) }), { DB });
  assert.equal(response.status, 201);
  assert.deepEqual(values, [12, 4500, 'Configured Bank', 'Accounting']);
});
