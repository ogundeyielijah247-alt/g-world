import { test } from 'node:test';
import assert from 'node:assert/strict';
import { heroScene, pageIllustration } from '../src/page-design.js';
const screens = ['entry', 'onboard', 'existing', 'admin-gate', 'courses', 'faculty-management', 'faculty-art', 'faculty-science', 'course-accounting', 'course-economics', 'course-business', 'course-finance', 'course-marketing', 'course-research', 'course-english', 'course-communication', 'course-mathematics', 'course-biology', 'tech-skills', 'excel-course', 'python-course', 'python-intro', 'python-practice', 'ai-tech', 'jamb', 'jamb-information', 'jamb-news', 'jamb-syllabus', 'jamb-cbt', 'jamb-cbt-science', 'jamb-cbt-commercial', 'jamb-cbt-arts', 'jamb-cbt-general', 'jamb-combinations', 'combination-result', 'work-ready', 'work-course', 'payment', 'payment-status', 'payment-rejected', 'support', 'certificate', 'project-writer', 'opportunities', 'research', 'academic', 'admin', 'admin-payments', 'admin-support', 'admin-content', 'admin-jamb', 'admin-information', 'admin-certificates', 'admin-members', 'admin-monitoring', 'admin-cleanup', 'admin-settings'];
test('each learning, account and admin hero has a distinct topical scene', () => {
  assert.equal(new Set(screens.map(heroScene)).size, screens.length);
  for (const screen of screens) {
    const svg = pageIllustration(screen);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('viewBox="0 0 380 340"'));
    assert.ok(svg.includes('aria-hidden="true"'));
    assert.ok(!svg.includes('undefined'));
    assert.ok(!svg.includes('http'));
    assert.equal(pageIllustration(screen), svg);
  }
});
test('illustrations have genuinely different subjects, not renamed copies', () => {
  const content = screens.map(screen => pageIllustration(screen).match(/<g class="art-scene">(.*?)<\/g>/)[1]);
  assert.equal(new Set(content).size, screens.length);
});
