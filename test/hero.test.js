import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AUTOPLAY_MS, homeSlider, wrapIndex } from '../src/hero.js';
test('restored hero has three local slides and original destinations', () => {
  const html = homeSlider();
  assert.equal((html.match(/data-slide="/g) || []).length, 3);
  for (const action of ['courses', 'tech-skills', 'jamb']) assert.ok(html.includes(`data-a="${action}"`));
  assert.ok(html.includes('Discover what you need to know.'));
  assert.equal((html.match(/aria-hidden="false"/g) || []).length, 1);
  assert.equal((html.match(/aria-current="true"/g) || []).length, 1);
  assert.equal(AUTOPLAY_MS, 5000);
});
test('index wraps in both directions including one/zero slides', () => {
  assert.equal(wrapIndex(3, 3), 0); assert.equal(wrapIndex(-1, 3), 2);
  assert.equal(wrapIndex(-7, 3), 2); assert.equal(wrapIndex(1, 1), 0); assert.equal(wrapIndex(1, 0), 0);
});

test('each slide has a local optimized cover and first image is prioritized', () => {
  const html = homeSlider();
  assert.equal((html.match(/class="slide-photo"/g) || []).length, 3);
  assert.equal((html.match(/loading="eager"/g) || []).length, 2);
  assert.equal((html.match(/loading="lazy"/g) || []).length, 4);
  assert.ok(html.includes('fetchpriority="high"'));
  assert.ok(!html.includes('/assets/hero/learner.webp'));
  assert.ok(html.includes('hero-pathways'));
  assert.ok(html.includes('Get guidance'));
  assert.equal((html.match(/class="slide-background"/g) || []).length, 3);
  for (const name of ['learning-library', 'digital-classroom', 'exam-preparation']) assert.ok(html.includes(`/assets/hero/${name}.webp`));
});


test('all backgrounds differ from every foreground image', () => {
  const html = homeSlider();
  const backgrounds = [...html.matchAll(/class="slide-background" src="([^"]+)"/g)].map(match => match[1]);
  const foregrounds = [...html.matchAll(/class="slide-photo" src="([^"]+)"/g)].map(match => match[1]);
  assert.equal(backgrounds.length, 3);
  assert.equal(new Set(backgrounds).size, 3);
  for (const background of backgrounds) assert.ok(!foregrounds.includes(background));
});
