/* W1 test suite – black-box (behavior from the spec) + white-box (DOM/ARIA state) checks.
   Run: node tests/w1.test.cjs   (needs Playwright: npm i -D playwright, or a global install) */
const path = require('path');
const { chromium } = require('playwright');
const base = 'file://' + path.resolve(__dirname, '..');
const results = [];
const test = async (name, fn) => { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name, e.message]); } };
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const browser = await chromium.launch();
  const page = async (file, opts = {}) => {
    const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 800 }, isMobile: !!opts.mobile, colorScheme: opts.scheme || 'light', reducedMotion: 'reduce' });
    const p = await ctx.newPage(); const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(base + '/' + file); await p.waitForTimeout(150); p.errors = errors; return p;
  };

  await test('No JS errors on home and inner pages', async () => {
    for (const f of ['w1-home.html', 'w1-inner.html']) { const p = await page(f); assert(p.errors.length === 0, f + ': ' + p.errors.join('; ')); }
  });

  for (const [w, h, mobile] of [[1280, 800, false], [768, 1024, false], [390, 844, true], [320, 640, true]]) {
    await test(`No horizontal scroll at ${w}px`, async () => {
      const p = await page('w1-home.html?announce=on', { viewport: { width: w, height: h }, mobile });
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(ov <= 0, `overflow ${ov}px`);
    });
  }

  await test('Skip link is first focusable and becomes visible, moves focus to main', async () => {
    const p = await page('w1-home.html');
    await p.keyboard.press('Tab');
    const txt = await p.evaluate(() => document.activeElement.textContent.trim());
    assert(txt === 'Skip to main content', 'first tab stop was: ' + txt);
    const top = await p.evaluate(() => document.activeElement.getBoundingClientRect().top);
    assert(top >= 0, 'skip link not visible');
    await p.keyboard.press('Enter'); await p.waitForTimeout(50);
    assert(await p.evaluate(() => document.activeElement.id === 'main'), 'focus did not move to main');
  });

  await test('Dropdown: Enter opens, ArrowDown moves into links, Escape closes and returns focus', async () => {
    const p = await page('w1-home.html');
    const btn = p.locator('.nav-list button').first();
    await btn.focus(); await p.keyboard.press('Enter');
    assert(await btn.getAttribute('aria-expanded') === 'true', 'not expanded');
    assert(await p.locator('#dd-0').isVisible(), 'panel hidden');
    await p.keyboard.press('ArrowDown'); // from button? focus is on button → opens + focuses first link
    const a1 = await p.evaluate(() => document.activeElement.textContent);
    assert(a1.includes('Become a member'), 'focus not on first link: ' + a1);
    await p.keyboard.press('ArrowDown');
    assert((await p.evaluate(() => document.activeElement.textContent)).includes('Renew'), 'arrow did not move');
    await p.keyboard.press('Escape');
    assert(await btn.getAttribute('aria-expanded') === 'false', 'not closed');
    assert(await p.evaluate(() => document.activeElement.classList.contains('nav-link')), 'focus not returned');
  });

  await test('Dropdown: only one open at a time; outside click closes', async () => {
    const p = await page('w1-home.html');
    const [b0, b1] = [p.locator('.nav-list button').nth(0), p.locator('.nav-list button').nth(1)];
    await b0.click(); await b1.click();
    assert(await b0.getAttribute('aria-expanded') === 'false' && await b1.getAttribute('aria-expanded') === 'true', 'two open');
    await p.mouse.click(640, 600);
    assert(await b1.getAttribute('aria-expanded') === 'false', 'outside click did not close');
  });

  await test('Mobile menu: opens as modal, traps focus, Escape closes and restores focus, body scroll locked', async () => {
    const p = await page('w1-home.html', { viewport: { width: 390, height: 844 }, mobile: true });
    await p.click('#menuBtn');
    assert(await p.locator('#mobileMenu').isVisible(), 'sheet hidden');
    assert(await p.evaluate(() => document.body.classList.contains('locked')), 'scroll not locked');
    assert(await p.evaluate(() => document.activeElement.id === 'sheetClose'), 'focus not in sheet');
    for (let i = 0; i < 30; i++) await p.keyboard.press('Tab');
    assert(await p.evaluate(() => document.getElementById('mobileMenu').contains(document.activeElement)), 'focus escaped the sheet');
    await p.keyboard.press('Escape');
    assert(await p.locator('#mobileMenu').isHidden(), 'not closed');
    assert(await p.evaluate(() => document.activeElement.id === 'menuBtn'), 'focus not restored');
  });

  await test('Mobile menu accordion expands sub-links', async () => {
    const p = await page('w1-home.html', { viewport: { width: 390, height: 844 }, mobile: true });
    await p.click('#menuBtn'); await p.click('#mobileMenu .sheet-link >> nth=0');
    assert(await p.locator('#ms-0').isVisible(), 'submenu hidden');
  });

  await test('Header: glass over hero, solid after scrolling past hero', async () => {
    const p = await page('w1-home.html');
    assert(!(await p.locator('#site-header').evaluate((e) => e.classList.contains('is-solid'))), 'solid at top');
    await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(300);
    assert(await p.locator('#site-header').evaluate((e) => e.classList.contains('is-solid')), 'not solid after scroll');
  });

  await test('Inner page marks current nav item (aria-current)', async () => {
    const p = await page('w1-inner.html');
    assert(await p.locator('.nav-list a[aria-current="page"]').textContent() === 'News', 'no aria-current');
  });

  await test('Announcement: dismiss hides it and remembers across reloads', async () => {
    const p = await page('w1-home.html?resetdismiss=1');
    assert(await p.locator('#announcement').isVisible(), 'banner not shown');
    await p.click('#announcement .dismiss');
    assert(await p.locator('#announcement').count() === 0, 'not removed');
    await p.goto(base + '/w1-home.html'); await p.waitForTimeout(100);
    assert(await p.locator('.announce').count() === 0, 'came back after reload');
  });

  await test('Announcement: hidden when admin flag is off, and when outside its date window', async () => {
    const p = await page('w1-home.html?announce=off&resetdismiss=1');
    assert(await p.locator('.announce').count() === 0, 'shown with flag off');
    // Simulate an expired announcement by editing data before layout runs
    const ctx2 = await browser.newContext(); const r = await ctx2.newPage();
    await r.addInitScript(() => { let v; Object.defineProperty(window, 'SITE', { configurable: true, get: () => v, set: (x) => { x.announcement.endsAt = '2000-01-01T00:00:00Z'; v = x; } }); });
    await r.goto(base + '/w1-home.html'); await r.waitForTimeout(150);
    assert(await r.locator('.announce').count() === 0, 'expired banner shown');
  });

  await test('Newsletter: rejects bad email, requires consent, then confirms', async () => {
    const p = await page('w1-home.html');
    await p.fill('#nlEmail', 'not-an-email'); await p.click('#nlForm button');
    assert((await p.textContent('#nlMsg')).includes('valid email'), 'no email error');
    assert(await p.getAttribute('#nlEmail', 'aria-invalid') === 'true', 'aria-invalid not set');
    await p.fill('#nlEmail', 'amina@example.com'); await p.click('#nlForm button');
    assert((await p.textContent('#nlMsg')).includes('Check the box'), 'no consent error');
    await p.check('#nlConsent'); await p.click('#nlForm button');
    assert((await p.textContent('#nlMsg')).includes('confirmation link'), 'no success');
  });

  await test('Newsletter hidden when admin flag is off', async () => {
    const p = await page('w1-home.html?newsletter=off');
    assert(await p.locator('#nlForm').count() === 0, 'newsletter shown');
  });

  await test('Theme toggle cycles system → light → dark and persists', async () => {
    const p = await page('w1-inner.html', { scheme: 'dark' });
    await p.evaluate(() => localStorage.removeItem('isgh-mode')); await p.reload(); await p.waitForTimeout(100);
    assert(await p.evaluate(() => document.documentElement.dataset.mode) === 'dark', 'system dark not applied');
    await p.click('#modeBtn'); assert(await p.evaluate(() => document.documentElement.dataset.mode) === 'light', 'not light');
    await p.click('#modeBtn'); assert(await p.evaluate(() => document.documentElement.dataset.mode) === 'dark', 'not dark');
    await p.reload(); await p.waitForTimeout(100);
    assert(await p.evaluate(() => document.documentElement.dataset.modePref) === 'dark', 'not persisted');
  });

  await test('All three themes render header and footer in light and dark (no errors)', async () => {
    for (const t of ['bayou', 'iznik', 'dusk']) for (const s of ['light', 'dark']) {
      const p = await page(`w1-inner.html?theme=${t}`, { scheme: s });
      assert(p.errors.length === 0, `${t}/${s} errors`);
      assert(await p.locator('.site-footer').isVisible(), `${t}/${s} footer missing`);
    }
  });

  await test('Every image-free control has an accessible name', async () => {
    const p = await page('w1-home.html');
    const unnamed = await p.evaluate(() => [...document.querySelectorAll('button, a')].filter((el) => !(el.textContent.trim() || el.getAttribute('aria-label'))).map((el) => el.outerHTML.slice(0, 80)));
    assert(unnamed.length === 0, 'unnamed: ' + unnamed.join(' | '));
  });

  await test('Touch targets in header are at least 40px', async () => {
    const p = await page('w1-home.html', { viewport: { width: 390, height: 844 }, mobile: true });
    const small = await p.evaluate(() => [...document.querySelectorAll('.site-header a, .site-header button')].filter((el) => el.offsetParent && el.getBoundingClientRect().height < 40).map((el) => el.textContent.trim() || el.id));
    assert(small.length === 0, 'too small: ' + small.join(', '));
  });

  await browser.close();
  const pass = results.filter((r) => r[0] === 'PASS').length;
  for (const r of results) console.log(r[0] === 'PASS' ? '✔' : '✖', r[1], r[2] ? '— ' + r[2] : '');
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
