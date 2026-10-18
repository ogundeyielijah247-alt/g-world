import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cachedToken, validMember } from '../src/session.js';
test('only well-formed session tokens are restored, never identity-only caches', () => {
  const token = 'a'.repeat(64);
  assert.equal(cachedToken(JSON.stringify({ token })), token);
  for (const value of [null, '{}', 'null', '[]', 'broken', JSON.stringify({ name: 'Fake', gworldId: 'GW-FAKE' }), JSON.stringify({ token: 'bad' })]) assert.equal(cachedToken(value), '');
});
test('server member details must contain both a name and ID', () => {
  assert.equal(validMember({ name: 'Learner', gworldId: 'GW-26-123456' }), true);
  for (const member of [null, {}, {name: ' '}, { name: 'A', gworldId: 5 }, { name: '', gworldId: 'A' }]) assert.equal(validMember(member), false);
});
