import { icon } from '../src/icons.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FACULTIES, EXTRA_COURSES, facultyForScreen } from '../src/catalogue.js';
import { facultyCards, subjectSection, learningInvitation, accessSection, approachSection, resourceSection, homeFooter } from '../src/home-sections.js';

test('three requested faculties retain six management roadmaps', () => {
  assert.deepEqual(FACULTIES.map(f => f.title), ['Faculty of Management Science', 'Faculty of Art', 'Faculty of Science']);
  assert.equal(FACULTIES[0].courses.length, 6);
  assert.equal(facultyForScreen('course-accounting').id, 'management');
  assert.equal(facultyForScreen('faculty-art').id, 'art');
  assert.equal(facultyForScreen('course-biology').id, 'science');
});
test('faculty filters return only matching cards', () => {
  assert.equal((facultyCards().match(/class="faculty-card"/g) || []).length, 3);
  assert.equal((facultyCards('science').match(/class="faculty-card"/g) || []).length, 1);
  assert.ok(facultyCards('science').includes('Faculty of Science'));
  assert.ok(!facultyCards('science').includes('Faculty of Art'));
});
test('new Art and Science courses are honest roadmap previews', () => {
  for (const faculty of FACULTIES.slice(1)) for (const [id] of faculty.courses) {
    assert.equal(EXTRA_COURSES[id].preview, true);
    assert.ok(EXTRA_COURSES[id].modules.length > 0);
  }
});
test('adapted reference sections provide existing destinations rather than dummy forms or testimonials', () => {
  const sections = [subjectSection(), learningInvitation(), accessSection('₦3,000'), approachSection(), resourceSection(), homeFooter()].join('');
  assert.ok(sections.includes('₦3,000'));
  assert.ok(sections.includes('one-time payment, approval required'));
  assert.ok(sections.includes('A practical study principle'));
  assert.ok(!sections.includes('<form'));
  assert.ok(!sections.includes('href="#"'));
});

 test('knowledge with direction highlights only the four requested tech skill groups', () => {
  const section = subjectSection();
  const titles = [...section.matchAll(/<h3>(.*?)<\/h3>/g)].map(match => match[1]);
  assert.deepEqual(titles, ['Excel', 'Python', 'JavaScript', 'HTML &amp; CSS']);
  assert.ok(section.includes('data-a="python-course"'));
  assert.ok(section.includes('data-a="excel-course"'));
  assert.ok(section.includes('Organise data, work with formulas'));
  assert.ok(section.includes('data-a="tech-skills">Explore more'));
  assert.ok(!section.includes('Explore our faculties'));
  assert.ok(!section.includes('Professional development'));
  assert.ok(!section.includes('Exam preparation'));
});

test('tech highlight cards use distinct subject-specific icons', () => {
  const section = subjectSection();
  for (const [glyph, title] of [['spreadsheet', 'Excel'], ['python', 'Python'], ['javascript', 'JavaScript'], ['web', 'HTML &amp; CSS']]) {
    assert.ok(section.includes(`<article>${icon(glyph)}<h3>${title}</h3>`));
    assert.notEqual(icon(glyph), icon('code'));
    assert.notEqual(icon(glyph), icon('book'));
  }
  assert.equal(new Set(['spreadsheet', 'python', 'javascript', 'web'].map(name => icon(name))).size, 4);
});

test('faculty and learning-story photography is distinct from hero and welcome images', async () => {
  const { existsSync, statSync } = await import('node:fs');
  const facultyImages = FACULTIES.map(f => f.image);
  const resourceImages = [...resourceSection().matchAll(/<img src="([^"]+)"/g)].map(match => match[1]);
  const images = [...facultyImages, ...resourceImages];
  assert.equal(images.length, 6);
  assert.equal(new Set(images).size, 6);
  for (const image of images) {
    assert.ok(image.startsWith('/assets/sections/'));
    const local = new URL(`../public${image}`, import.meta.url);
    assert.ok(existsSync(local));
    assert.ok(statSync(local).size < 150_000);
  }
});
