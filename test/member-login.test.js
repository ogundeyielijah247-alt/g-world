import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/src/index.js';

function login(body, DB) {
  return worker.fetch(new Request('https://example.test/api/member-login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }), { DB });
}

for (const [label, credentials, column, identity] of [
  ['legacy email payload', { email: ' Member@Example.com ' }, 'lower(email)', 'member@example.com'],
  ['email identifier', { identifier: 'Member@Example.com' }, 'lower(email)', 'member@example.com'],
  ['local phone', { identifier: '0805 123 4567' }, 'phone', '08051234567'],
  ['international phone', { identifier: '+234 805 123 4567' }, 'phone', '08051234567'],
]) {
  test(`login resolves ${label} using the normalized identity`, async () => {
    let queried = false;
    const DB = { prepare(sql) {
      queried = true;
      assert.ok(sql.includes(`WHERE ${column} = ?1`));
      return { bind(value) {
        assert.equal(value, identity);
        return { first: async () => null };
      } };
    } };
    const response = await login({ ...credentials, password: 'test-password' }, DB);
    assert.equal(queried, true);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, 'We could not find a G WORLD account with those details.');
  });
}

test('invalid login identifiers are rejected before any database lookup', async () => {
  const DB = { prepare() { assert.fail('Invalid input must not query members'); } };
  for (const identifier of ['', 'not-an-email', 'abc08051234567', 'a@b', '12345', '1'.repeat(16)]) {
    assert.equal((await login({ identifier, password: 'test-password' }, DB)).status, 400);
  }
  assert.equal((await login({ identifier: '08051234567', password: '' }, DB)).status, 400);
});
