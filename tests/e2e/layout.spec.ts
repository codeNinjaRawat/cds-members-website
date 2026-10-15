/**
 * W1 – shared layout (announcement, header, dropdowns, mobile menu, theme toggle, footer, newsletter).
 * Runs against mock data (ISGH_USE_MOCK_API=true). Admin-controlled values are read from the page, not hard-coded,
 * except where the mock config is the fixture.
 */
import { test, expect, type Page } from '@playwright/test';

const clearStorage = async (page: Page) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
};

test.describe('layout – desktop', () => {
  test.beforeEach(async ({ page }) => { await clearStorage(page); });

  test('no JS errors, no hydration errors on home and inner page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error' && /hydrat/i.test(m.text())) errors.push(m.text()); });
    for (const p of ['/', '/news']) { await page.goto(p); await page.waitForLoadState('networkidle'); }
    expect(errors).toEqual([]);
  });

  test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText('Skip to main content');
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('dropdown: Enter opens, arrows move, Escape closes and returns focus', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('.nav-list button').first();
    await btn.focus();
    await page.keyboard.press('Enter');
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    await expect(btn).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(':focus')).toContainText('Become a member');
    await page.keyboard.press('ArrowDown');
    await expect(page.locator(':focus')).toContainText('Renew');
  });

  test('dropdown: one open at a time, outside click closes', async ({ page }) => {
    await page.goto('/');
    const b0 = page.locator('.nav-list button').nth(0), b1 = page.locator('.nav-list button').nth(1);
    await b0.click(); await b1.click();
    await expect(b0).toHaveAttribute('aria-expanded', 'false');
    await expect(b1).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.click(640, 700);
    await expect(b1).toHaveAttribute('aria-expanded', 'false');
  });

  test('header is glass over the hero and solid after scrolling (zones layout)', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await page.locator('.home-zones').count()), 'zones layout not active');
    const header = page.locator('#site-header');
    await expect(header).toHaveAttribute('data-variant', 'over-hero');
    await expect(header).not.toHaveClass(/is-solid/);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(header).toHaveClass(/is-solid/);
  });

  test('inner page: solid header and current page marked', async ({ page }) => {
    await page.goto('/news');
    await expect(page.locator('#site-header')).toHaveAttribute('data-variant', 'solid');
    await expect(page.locator('.nav-list a[aria-current="page"]')).toHaveText('News');
  });

  test('announcement dismissal is remembered without flashing', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#announcement')).toBeVisible();
    await page.locator('#announcement .dismiss').click();
    await expect(page.locator('#announcement')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('#announcement')).toBeHidden();
  });

  test('newsletter: validation, consent, success', async ({ page }) => {
    await page.goto('/');
    await page.fill('#nlEmail', 'not-an-email');
    await page.click('#nlForm button[type=submit]');
    await expect(page.locator('#nlMsg')).toContainText('valid email');
    await expect(page.locator('#nlEmail')).toHaveAttribute('aria-invalid', 'true');
    await page.fill('#nlEmail', 'amina@example.com');
    await page.click('#nlForm button[type=submit]');
    await expect(page.locator('#nlMsg')).toContainText('Check the box');
    await page.check('#nlConsent');
    await page.click('#nlForm button[type=submit]');
    await expect(page.locator('#nlMsg')).toContainText('confirmation link');
  });

  test('newsletter API rejects bad input', async ({ request }) => {
    const bad = await request.post('/api/newsletter', { data: { email: 'x', consent: true, consentText: 'y' } });
    expect(bad.status()).toBe(422);
    const noConsent = await request.post('/api/newsletter', { data: { email: 'a@b.co', consent: false, consentText: 'y' } });
    expect(noConsent.status()).toBe(422);
    const ok = await request.post('/api/newsletter', { data: { email: 'a@b.co', consent: true, consentText: 'y' } });
    expect(ok.status()).toBe(202);
  });

  test('theme toggle cycles device → light → dark and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/news');
    await page.evaluate(() => localStorage.setItem('isgh-mode', 'system'));
    await page.reload();
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-mode', 'dark');
    await page.click('#modeBtn'); await expect(html).toHaveAttribute('data-mode', 'light');
    await page.click('#modeBtn'); await expect(html).toHaveAttribute('data-mode', 'dark');
    await page.reload();
    await expect(html).toHaveAttribute('data-mode-pref', 'dark');
  });

  test('every link and button has an accessible name', async ({ page }) => {
    await page.goto('/');
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('button, a')]
      .filter((el) => !((el.textContent || '').trim() || el.getAttribute('aria-label'))).map((el) => el.outerHTML.slice(0, 80)));
    expect(unnamed).toEqual([]);
  });
});

test.describe('layout – mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('no horizontal scroll at 390px and 320px', async ({ page }) => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    }
  });

  test('mobile menu: modal, focus trap, Escape closes, focus restored, scroll locked', async ({ page }) => {
    await page.goto('/');
    await page.click('#menuBtn');
    await expect(page.locator('#mobileMenu')).toBeVisible();
    await expect(page.locator('body')).toHaveClass(/locked/);
    await expect(page.locator('#sheetClose')).toBeFocused();
    for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.getElementById('mobileMenu')!.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobileMenu')).toBeHidden();
    await expect(page.locator('#menuBtn')).toBeFocused();
  });

  test('mobile menu accordion opens sub-links', async ({ page }) => {
    await page.goto('/');
    await page.click('#menuBtn');
    await page.locator('#mobileMenu .sheet-link').first().click();
    await expect(page.locator('#ms-0')).toBeVisible();
  });

  test('header touch targets are at least 40px', async ({ page }) => {
    await page.goto('/');
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('.site-header a, .site-header button')]
      .filter((el) => el.offsetParent && el.getBoundingClientRect().height < 40).map((el) => el.textContent?.trim() || el.id));
    expect(small).toEqual([]);
  });
});
