import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';
const request = () => new Request('https://example.test/api/ready');
test('readiness is 503 when the database binding is missing', async () => {
  const response = await worker.fetch(request(), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, false);
});
test('readiness checks each authentication table without retrieving members', async () => {
  const queries = [];
  const DB = { prepare(sql) { queries.push(sql); return { all: async () => ({ results: [] }) }; } };
  const response = await worker.fetch(request(), { DB });
  assert.equal(response.status, 200);
  assert.equal(queries.length, 6);
  assert.ok(queries.every(sql => sql.endsWith('LIMIT 0')));
  assert.ok(queries[0].includes('password_hash, password_salt'));
  assert.ok(queries.some(sql => sql.includes('FROM audit_events')));
  assert.ok(queries.some(sql => sql.includes('FROM payments')));
  assert.deepEqual(await response.json(), { ok: true, service: 'G WORLD account service' });
});
test('readiness returns a generic 503 without leaking schema errors', async () => {
  const response = await worker.fetch(request(), { DB: { prepare() { return { all: async () => { throw new Error('private database diagnostic'); } }; } } });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: 'Account service is not ready.' });
});
test('health is still a liveness check even when readiness is unavailable', async () => {
  const response = await worker.fetch(new Request('https://example.test/api/health'), { ENVIRONMENT: 'development' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).service, 'G WORLD API');
});

test('readiness fails for an unmigrated password column, even when tables exist', async () => {
  const DB = { prepare(sql) { return { all: async () => {
    if (sql.includes('password_hash')) throw new Error('no such column: password_hash');
    return { results: [] };
  } }; } };
  assert.equal((await worker.fetch(request(), { DB })).status, 503);
});
