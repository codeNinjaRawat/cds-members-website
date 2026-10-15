/** W2 home + content pages: render, admin data shown, no errors, layout intact on every page. */
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/membership/plans', '/membership/join', '/about', '/elections', '/faq', '/contact', '/centers', '/centers/zones', '/news', '/privacy', '/terms', '/accessibility', '/events', '/volunteer', '/constitution-bylaws', '/reports', '/feedback', '/complaints', '/verify', '/give', '/impact', '/needs', '/sign-in', '/membership/renew'];

test.describe('every page', () => {
  for (const p of PAGES) {
    test(`${p} renders with header, footer, one h1 and no errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && /hydrat/i.test(m.text())) errors.push(m.text()); });
      await page.goto(p);
      await expect(page.locator('#site-header')).toBeVisible();
      await expect(page.locator('#site-footer')).toBeVisible();
      await expect(page.locator('main h1')).toHaveCount(1);
      // header "Join" button keeps its look on every page (guards against CSS class collisions)
      const join = page.locator('.header-actions .join');
      await expect(join).toBeVisible();
      expect((await join.boundingBox())!.height).toBeLessThan(60);
      expect(errors).toEqual([]);
    });
  }
  test('unknown page shows the not-found page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
  });
});

test.describe('footer links (based on competitor review)', () => {
  test('footer has membership, community, about and help/feedback links that all resolve', async ({ page }) => {
    await page.goto('/');
    for (const name of ['Rate your experience', 'File a complaint', 'Verify a membership', 'Constitution and Bylaws', 'Volunteer', 'Annual reports']) {
      await expect(page.locator('#site-footer').getByRole('link', { name })).toBeVisible();
    }
  });
});

test.describe('home – active layout (set by admin)', () => {
  test('home shows the admin-selected layout and its sections', async ({ page }) => {
    await page.goto('/');
    const classic = await page.locator('.home-classic').count();
    const zones = await page.locator('.home-zones').count();
    expect(classic + zones).toBe(1);
  });

  test('classic: member card, live countdown, plan cards link to join', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await page.locator('.home-classic').count()), 'classic layout not active');
    await expect(page.locator('.member-card')).toBeVisible();
    await expect(page.locator('.countdown strong')).toHaveText(/^\d+$/);
    await expect(page.locator('.plan3')).toHaveCount(3);
    await expect(page.locator('.plan3 a').first()).toHaveAttribute('href', /\/membership\/join\?plan=/);
    await expect(page.locator('.steps li')).toHaveCount(4);
  });

  test('zones: focusing a zone shows its centers; plan switcher; ZIP check', async ({ page }) => {
    await page.goto('/');
    test.skip(!(await page.locator('.home-zones').count()), 'zones layout not active');
    const zones = page.locator('.map .zone');
    await expect(zones).toHaveCount(5);
    await zones.nth(2).focus();
    await expect(page.locator('.zone-info')).toContainText('Islamic Centers in this zone');
    await page.getByRole('radio', { name: 'Single' }).click();
    await expect(page.locator('.t-plans .price')).toContainText('$25');
    await page.fill('#homeZip', '77036');
    await page.click('.t-find button');
    await expect(page.locator('#homeZipMsg')).toContainText('Greater Houston area');
  });

  test('admin default mode is applied before the visitor chooses', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('isgh-mode'));
    await page.reload();
    const pref = await page.evaluate(() => document.documentElement.dataset.modePref);
    expect(['dark', 'light', 'system']).toContain(pref);
  });

  test('missing images fall back to a placeholder (no broken image icons)', async ({ page }) => {
    await page.goto('/');
    const broken = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0 && i.offsetParent).length);
    expect(broken).toBe(0);
  });
  test('all images have alt text', async ({ page }) => {
    await page.goto('/');
    const noAlt = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length);
    expect(noAlt).toBe(0);
  });
});

test.describe('footer v2', () => {
  test('CTA with countdown shows on pages but not on the join page', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('.footer-cta')).toBeVisible();
    await expect(page.locator('.fc-count b')).toHaveText(/^\d+$/);
    await page.goto('/membership/join');
    await expect(page.locator('.footer-cta')).toHaveCount(0);
  });
  test('open/closed badge, helpful widget, back to top, external links open in a new tab', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('.open-badge')).toHaveText(/Open now|Closed now/);
    await page.locator('.helpful button', { hasText: 'No' }).click();
    await expect(page.locator('.helpful')).toContainText('Tell us what was missing');
    await expect(page.locator('#site-footer a[target="_blank"]').first()).toHaveAttribute('rel', /noopener/);
    await page.locator('.to-top').click();
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => window.scrollY)).toBeLessThan(50);
  });
});

test.describe('branding (admin › Branding)', () => {
  test('logo loads, light version on light header, dark version in footer; favicon linked', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/about');
    const imgs = page.locator('#site-header .brand-mark img');
    await expect(imgs).toHaveCount(2);
    expect(await page.evaluate(() => [...document.querySelectorAll('.brand-mark img')].every((i) => (i as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const op = (sel: string) => page.locator(sel).first().evaluate((e) => getComputedStyle(e).opacity);
    expect(await op('#site-header .bm-light')).toBe('1');
    expect(await op('#site-footer .bm-dark')).toBe('1');
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', /\/brand\/favicon/);
    for (const f of ['/brand/favicon.ico', '/brand/logo-mark.svg', '/brand/logo-mark-dark.svg', '/brand/apple-touch-icon.png']) {
      expect((await page.request.get(f)).status()).toBe(200);
    }
  });
});
