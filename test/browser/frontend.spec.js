import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/me', route => route.fulfill({ json: { ok: true, member: { name: 'Learner', gworldId: 'GW-26-123456' } } }));
  await page.route('**/api/stats', route => route.fulfill({ json: { ok: true, metrics: { achievements: 8, students: 24, instructors: 2 } } }));
  await page.route('**/api/settings', route => route.fulfill({ json: { ok: true } }));
  // The restored slider must not depend on this unavailable endpoint.
  await page.route('**/api/articles?**', route => route.abort());
  await page.addInitScript(() => localStorage.setItem('gworld', JSON.stringify({ name: 'Learner', gworldId: 'GW-26-123456', token: '1'.repeat(64) })));
});
async function openHome(page) {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await expect(page.locator('.intro')).toBeVisible();
  await page.clock.fastForward(2800);
  await expect(page.locator('.home-slider')).toBeVisible();
}
async function active(page, index) {
  await expect(page.locator('.home-slide.is-active')).toHaveCount(1);
  await expect(page.locator('.home-slide.is-active')).toHaveAttribute('data-slide', String(index));
  await expect(page.locator('.home-slide[aria-hidden="false"]')).toHaveAttribute('data-slide', String(index));
  await expect(page.locator('.slider-dots [aria-current="true"]')).toHaveCount(1);
  await expect(page.locator('.home-slide[aria-hidden="true"]:not([inert])')).toHaveCount(0);
}
test('local slides work without article API and loop every five seconds', async ({ page }) => {
  const articleRequests = [];
  page.on('request', r => { if (r.url().includes('/api/articles')) articleRequests.push(r.url()); });
  await openHome(page);
  await expect(page.locator('.home-slide')).toHaveCount(3);
  await active(page, 0);
  await page.clock.fastForward(4999); await active(page, 0);
  await page.clock.fastForward(1); await active(page, 1);
  await page.clock.fastForward(5000); await active(page, 2);
  await page.clock.fastForward(5000); await active(page, 0);
  expect(articleRequests).toEqual([]);
});
test('pause, manual controls, keyboard and timer reset', async ({ page }) => {
  await openHome(page);
  await page.getByRole('button', { name: 'Pause slideshow' }).click();
  await page.clock.fastForward(15000); await active(page, 0);
  await page.getByRole('button', { name: 'Go to slide 3' }).click(); await active(page, 2);
  await page.getByRole('button', { name: 'Next slide' }).focus();
  await page.keyboard.press('Enter'); await active(page, 0);
  await page.getByRole('button', { name: 'Play slideshow' }).click();
  await page.locator('h1').evaluate(el => { el.tabIndex = -1; el.focus(); });
  await page.clock.fastForward(4000);
  await page.getByRole('button', { name: 'Next slide' }).click(); await active(page, 1);
  await page.locator('h1').focus();
  await page.clock.fastForward(1000); await active(page, 1);
  await page.clock.fastForward(4000); await active(page, 2);
});
test('mobile, both themes, gradient and reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await page.clock.fastForward(15000); await active(page, 0);
  await page.getByRole('button', { name: 'Next slide' }).click(); await active(page, 1);
  await expect(page.locator('.home-slide.is-active h2')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.home-slide.is-active h2')).toHaveCSS('color', 'rgb(255, 255, 255)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.slide-stage').evaluate(el => getComputedStyle(el, '::before').backgroundImage)).toContain('linear-gradient');
});
test('original CTAs navigate and home remounts cleanly', async ({ page }) => {
  await openHome(page);
  for (const [index, label, heading] of [
    [0, 'Explore courses', 'Our Faculties'],
    [1, 'Discover tech skills', 'Build practical skills.'],
    [2, 'Explore JAMB', 'Your JAMB learning and information centre.'],
  ]) {
    await page.getByRole('button', { name: `Go to slide ${index + 1}` }).click();
    await page.getByRole('button', { name: label, exact: false }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('.home-slider')).toHaveCount(0);
    await page.getByRole('button', { name: 'G WORLD home' }).click();
    await active(page, 0);
  }
});

test('page theme stays black or white with X-blue hero actions', async ({ page }) => {
  await openHome(page);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  await expect(page.locator('.home-slide.is-active .primary')).toHaveCSS('background-color', 'rgb(29, 155, 240)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#000000');
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff');
  await expect(page.locator('.home-slide.is-active h2')).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('local covers load and outgoing slide stays painted during crossfade', async ({ page }) => {
  await openHome(page);
  await expect.poll(() => page.locator('.slide-photo').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  await expect(page.locator('.home-slide.is-active')).toHaveCSS('transition-duration', '0.9s, 0s');
  // Inspect in the click task, before the 900ms delayed visibility switch can finish.
  const fadingOut = await page.evaluate(() => {
    document.querySelector('[data-slider="next"]').click();
    const outgoing = document.querySelector('[data-slide="0"]');
    return { hidden: outgoing.getAttribute('aria-hidden'), inert: outgoing.inert, visibility: getComputedStyle(outgoing).visibility };
  });
  expect(fadingOut).toEqual({ hidden: 'true', inert: true, visibility: 'visible' });
  await active(page, 1);
  // Failed artwork leaves a readable purple panel, never an error loop or empty copy.
  await page.locator('[data-slide="1"] .slide-photo').evaluate(img => img.dispatchEvent(new Event('error')));
  await expect(page.locator('[data-slide="1"] .slide-photo')).toBeHidden();
  await expect(page.locator('[data-slide="1"] h2')).toBeVisible();
});

test('shared educational styling and mobile layouts cover key learning pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openHome(page);
  const checkLayout = async () => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('main')).toHaveId('main-content');
    await expect(page.locator('h1')).toHaveCount(1);
  };
  for (const screen of ['courses', 'tech-skills', 'ai-tech', 'jamb', 'opportunities', 'research', 'project-writer', 'academic', 'work-ready', 'support']) {
    await page.locator(`article[data-a="${screen}"]`).click();
    await expect(page.locator('main')).toHaveAttribute('data-screen', screen);
    await checkLayout();
    await expect(page.locator('.page-icon')).toBeVisible();
    await page.getByRole('button', { name: 'G WORLD home' }).click();
  }
  await page.locator('article[data-a="courses"]').click();
  await page.locator('button[data-a="faculty-management"]').click();
  await page.locator('article[data-a="course-accounting"]').click();
  await checkLayout();
  await page.getByRole('button', { name: 'MAKE PAYMENT', exact: true }).click();
  await expect(page.locator('.payment-card')).toBeVisible();
  await checkLayout();
  await page.getByRole('button', { name: 'LOG OUT', exact: true }).click();
  await expect(page.locator('.welcome-aside')).toBeHidden();
  await page.getByRole('button', { name: 'NEW MEMBER', exact: true }).click();
  await checkLayout();
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator('.welcome-aside')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reference-style desktop navigation has working links and active state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHome(page);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.locator('.site-nav-links')).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Open navigation menu' })).toBeHidden();
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Home');
  await nav.getByRole('button', { name: 'Faculties', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Our Faculties' })).toBeVisible();
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Faculties');
  await page.locator('button[data-a="faculty-management"]').click();
  await page.locator('article[data-a="course-accounting"]').click();
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Faculties');
  await nav.getByRole('button', { name: 'Resources', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-screen', 'academic');
  await expect(nav.locator('[aria-current="page"]')).toHaveText('Resources');
});

test('mobile navigation supports toggle, Escape, outside click and route selection', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(nav.locator('.site-nav-links')).toBeHidden();
  const toggle = nav.locator('.nav-menu-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('button', { name: 'Tech Skills', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.mouse.click(380, 700);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await nav.getByRole('button', { name: 'JAMB', exact: true }).click();
  await expect(page.locator('main')).toHaveAttribute('data-screen', 'jamb');
  await expect(nav.locator('.site-nav-links')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('distinct image backgrounds and gradient persist across repeated loops', async ({ page }) => {
  await openHome(page);
  const files = ['learning-library.webp', 'digital-classroom.webp', 'exam-preparation.webp'];
  const backgrounds = ['library-background.webp', 'lab-background.webp', 'campus-background.webp'];
  await expect.poll(() => page.locator('.slide-background').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0))).toBe(true);
  for (let step = 0; step < 7; step++) {
    const index = step % 3;
    await active(page, index);
    const slide = page.locator('.home-slide.is-active');
    await expect(slide.locator('.slide-background')).toHaveAttribute('src', `/assets/hero/${backgrounds[index]}`);
    await expect(slide.locator('.slide-photo')).toHaveAttribute('src', `/assets/hero/${files[index]}`);
    await expect(slide.locator('.slide-photo')).toBeVisible();
    expect(await slide.locator('.slide-background-gradient').evaluate(el => getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    await expect(slide.locator('h2')).toBeVisible();
    await page.clock.fastForward(5000);
  }
});

test('reference-style welcome keeps member identity and adapts to both themes and mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const welcome = page.locator('.home-welcome');
  await welcome.scrollIntoViewIfNeeded();
  await expect(welcome.getByRole('heading', { name: 'Welcome to your online learning centre.' })).toBeVisible();
  await expect(welcome.locator('.welcome-personal')).toHaveText('Welcome back, Learner.');
  await expect(welcome.locator('code')).toHaveText('GW-26-123456');
  await expect(welcome.locator('.welcome-checklist li')).toHaveCount(3);
  await expect(welcome.locator('.welcome-highlights > div')).toHaveCount(3);
  await expect.poll(() => welcome.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(welcome.getByRole('heading')).toHaveCSS('color', 'rgb(15, 20, 25)');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(welcome.locator('.welcome-graduate')).toBeVisible();
  await expect(welcome.locator('.welcome-classroom')).toBeVisible();
  await welcome.getByRole('button', { name: 'Find your next course' }).click();
  await expect(page.getByRole('heading', { name: 'Our Faculties' })).toBeVisible();
});

test('welcome shows requested placeholder totals without fetching live statistics', async ({ page }) => {
  await openHome(page);
  const metrics = page.locator('.welcome-highlights');
  await expect(metrics.locator('small')).toHaveText(['Total achievements', 'Total students', 'Total instructors']);
  await expect(metrics.locator('strong')).toHaveText(['20', '30', '10']);
  await expect(page.locator('.welcome-metrics-note')).toContainText('Placeholder totals');
  await page.route('**/api/stats', route => route.fulfill({ json: { ok: true, metrics: { achievements: 0, students: 1, instructors: null } } }));
  await page.reload();
  await expect(page.locator('.intro')).toBeVisible();
  await page.clock.fastForward(2800);
  await expect(metrics.locator('strong')).toHaveText(['20', '30', '10']);
});

test('faculty showcase filters and all three faculties open their own roadmaps', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const showcase = page.locator('.home-faculties');
  await expect(showcase.locator('.faculty-card')).toHaveCount(3);
  await showcase.getByRole('button', { name: 'Art', exact: true }).click();
  await expect(showcase.locator('.faculty-card')).toHaveCount(1);
  await expect(showcase.getByRole('heading', { name: 'Faculty of Art', exact: true })).toBeVisible();
  await showcase.getByRole('button', { name: 'Explore faculty' }).click();
  await expect(page.getByRole('heading', { name: 'Faculty of Art', exact: true })).toBeVisible();
  await page.locator('article[data-a="course-english"]').click();
  await expect(page.getByRole('heading', { name: 'English Language', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'MAKE PAYMENT', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Return to faculty' }).click();
  await page.getByRole('button', { name: 'All faculties', exact: false }).click();
  await page.locator('button[data-a="faculty-science"]').click();
  await page.locator('article[data-a="course-mathematics"]').click();
  await expect(page.getByRole('heading', { name: 'Mathematics', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'MAKE PAYMENT', exact: true })).toHaveCount(0);
});

test('new homepage sections have working CTAs and fit narrow screens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  for (const selector of ['.subject-band', '.home-faculties', '.learning-invitation', '.home-access', '.approach-band', '.home-resources', '.learning-footer']) {
    await expect(page.locator(selector)).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Read the introduction', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'Introduction to Python', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'G WORLD home' }).click();
  await page.locator('.learning-footer').getByRole('button', { name: 'Contact support', exact: false }).click();
  await expect(page.getByRole('heading', { name: 'How can we help?' })).toBeVisible();
});

test('Excel card opens its topics directly and is also reachable from Tech Skills', async ({ page }) => {
  await openHome(page);
  await page.locator('.subject-band').getByRole('button', { name: 'Explore Excel', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Excel Topics', exact: true })).toBeVisible();
  await expect(page.locator('.doors .grid article')).toHaveCount(12);
  await expect(page.getByRole('heading', { name: 'Formulas and cell references' })).toBeVisible();
  await expect(page.locator('.site-nav-link[data-a="tech-skills"]')).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Back to Tech Skills' }).click();
  await page.locator('article[data-a="excel-course"]').click();
  await expect(page.getByRole('heading', { name: 'Excel Topics', exact: true })).toBeVisible();
});

test('subpage heroes have distinct art and grids adapt at desktop, tablet and narrow mobile widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const scenes = new Set();
  for (const screen of ['courses', 'tech-skills', 'ai-tech', 'jamb', 'opportunities', 'research', 'project-writer', 'academic', 'work-ready', 'support']) {
    await page.locator(`article[data-a="${screen}"]`).click();
    await expect(page.locator('.subpage-hero .page-illustration')).toBeVisible();
    const art = page.locator('.subpage-hero .page-illustration');
    await expect(art).toHaveAttribute('data-art', screen);
    const scene = await art.getAttribute('data-scene');
    expect(scenes.has(scene)).toBe(false); scenes.add(scene);
    for (const width of [1440, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 950 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('h1')).toHaveCount(1);
      if (width <= 390) {
        const grids = page.locator('.modern-subpage .grid');
        for (const grid of await grids.all()) expect(await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1);
      }
    }
    await page.locator('.page-breadcrumb button').click();
  }
});
test('course hero art and grid preserve navigation, themes and mobile course access', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openHome(page);
  await page.locator('.subject-band').getByRole('button', { name: 'Explore Excel', exact: true }).click();
  await expect(page.locator('.page-illustration')).toHaveAttribute('data-scene', 'spreadsheet');
  const columns = page.locator('.doors .grid');
  expect(await columns.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(3);
  await page.getByRole('button', { name: 'Switch colour theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.subpage-hero')).toBeVisible();
  await page.setViewportSize({ width: 820, height: 1000 });
  expect(await columns.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await columns.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(1);
  await page.getByRole('button', { name: 'Back to Tech Skills' }).click();
  await page.locator('article[data-a="python-course"]').click();
  await expect(page.locator('.page-illustration')).toHaveAttribute('data-scene', 'terminal');
  await page.locator('article[data-a="python-intro"]').click();
  await expect(page.locator('.page-illustration')).toHaveAttribute('data-scene', 'functions');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('faculty and resource sections load six distinct photographs and stay responsive', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const photographs = page.locator('.home-faculties img, .home-resources img');
  await expect(photographs).toHaveCount(6);
  const sources = await photographs.evaluateAll(images => images.map(image => image.getAttribute('src')));
  expect(new Set(sources).size).toBe(6);
  expect(sources.every(src => src.startsWith('/assets/sections/'))).toBe(true);
  for (const image of await photographs.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('.home-faculties').getByRole('button', { name: 'Art', exact: true }).click();
  await expect(page.locator('.home-faculties img')).toHaveAttribute('src', '/assets/sections/art.webp');
});

test('cached identity without a valid server session cannot enter the homepage', async ({ page }) => {
  await page.route('**/api/me', route => route.fulfill({ status: 401, json: { ok: false, error: 'Session ended.' } }));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await page.clock.fastForward(2800);
  await expect(page.getByRole('button', { name: 'EXISTING MEMBER', exact: true })).toBeVisible();
  await expect(page.locator('.home-slider')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('gworld'))).toBeNull();
});
test('unavailable session service fails closed and shows a connection notice', async ({ page }) => {
  await page.route('**/api/me', route => route.fulfill({ status: 503, json: { ok: false, error: 'Unavailable.' } }));
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto('/');
  await page.clock.fastForward(2800);
  await expect(page.getByRole('status')).toContainText('could not verify your session');
  await expect(page.locator('.home-slider')).toHaveCount(0);
});
test('configured prices are consistent across Python, Work Ready and payment', async ({ page }) => {
  await page.route('**/api/settings', route => route.fulfill({ json: { ok: true, payment: { amount: 4500, provider: 'Test Bank', accountName: 'Test Account', accountNumber: '1234567890' } } }));
  await openHome(page);
  await page.locator('.subject-band').getByRole('button', { name: 'Explore Python', exact: true }).click();
  await expect(page.locator('[data-payment-price]')).toContainText('4,500');
  await page.getByRole('button', { name: 'G WORLD home', exact: true }).click();
  await page.locator('article[data-a="work-ready"]').click();
  await page.locator('article[data-a="work-course"]').first().click();
  await expect(page.locator('[data-payment-price]')).toContainText('4,500');
});
test('late payment settings preserve a pending payment submission', async ({ page }) => {
  await openHome(page);
  await page.locator('.subject-band').getByRole('button', { name: 'Explore Python', exact: true }).click();
  let releaseSettings;
  const settingsWait = new Promise(resolve => { releaseSettings = resolve; });
  await page.route('**/api/settings', async route => { await settingsWait; await route.fulfill({ json: { ok: true, payment: { amount: 4700, provider: 'Updated Bank', accountName: 'Updated Account', accountNumber: '1234567890' } } }); });
  let releasePayment;
  const paymentWait = new Promise(resolve => { releasePayment = resolve; });
  await page.route('**/api/payment/submit', async route => { await paymentWait; await route.fulfill({ json: { ok: true }, status: 201 }); });
  await page.getByRole('button', { name: /UNLOCK FOR/ }).click();
  const submit = page.locator('button[data-a="payment-submitted"]');
  await submit.click();
  await expect(submit).toBeDisabled();
  releaseSettings();
  await expect(page.locator('[data-payment-detail="provider"]')).toHaveText('Updated Bank');
  await expect(submit).toBeDisabled();
  await expect(page.locator('[data-payment-copy]')).toHaveAttribute('data-copy', '1234567890');
  releasePayment();
  await expect(page.locator('main')).toHaveAttribute('data-screen', 'payment-status');
});

test('a failed offline logout cannot silently restore the cookie session on reload', async ({ page }) => {
  await openHome(page);
  await page.route('**/api/auth/logout', route => route.abort());
  await page.getByRole('button', { name: 'LOG OUT', exact: true }).click();
  await expect(page.getByRole('button', { name: 'EXISTING MEMBER', exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('gworld-logout-pending'))).toBe('1');
  await page.reload();
  await page.clock.fastForward(2800);
  await expect(page.getByRole('button', { name: 'EXISTING MEMBER', exact: true })).toBeVisible();
  await expect(page.locator('.home-slider')).toHaveCount(0);
});
