import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTotal, PLACEHOLDER_METRICS } from '../src/metrics.js';
import worker from '../worker/src/index.js';

test('totals preserve zero and exact counts, never invent unknown totals', () => {
  assert.equal(formatTotal(0), '0');
  assert.equal(formatTotal(24), '24');
  for (const value of [null, undefined, -1, NaN, Infinity, '100', 1.5]) assert.equal(formatTotal(value), '—');
});
test('public statistics use database counts and leave instructors unknown', async () => {
  const sql = [];
  const response = await worker.fetch(new Request('https://example.com/api/stats'), {
    DB: { prepare(query) { sql.push(query); return { first: async () => ({ total: query.includes('course_enrollments') ? 3 : 18 }) }; } }
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).metrics, { achievements: 3, students: 18, instructors: null });
  assert.ok(sql.some(query => query.includes('NOT EXISTS')));
  assert.ok(sql.some(query => query.includes("status = 'COMPLETED'") && query.includes('completed_at IS NOT NULL')));
});
test('statistics do not misrepresent absent data as zero', async () => {
  const unavailable = await worker.fetch(new Request('https://example.com/api/stats'), {});
  assert.equal(unavailable.status, 503);
  const missingTables = await worker.fetch(new Request('https://example.com/api/stats'), { DB: { prepare() { throw new Error('missing table'); } } });
  assert.deepEqual((await missingTables.json()).metrics, { achievements: null, students: null, instructors: null });
});

test('temporary welcome totals match the requested placeholders', () => {
  assert.deepEqual(PLACEHOLDER_METRICS, { achievements: 20, students: 30, instructors: 10 });
  assert.equal(Object.isFrozen(PLACEHOLDER_METRICS), true);
});
