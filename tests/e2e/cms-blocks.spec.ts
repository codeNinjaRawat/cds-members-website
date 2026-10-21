/**
 * O1 black-box: admin-composed pages render every block on a phone and a desktop, scheduling hides pages,
 * embeds are allow-listed. Needs the website in demo mode (start-dev.cmd) – the style-guide page is a draft,
 * so it is opened with ?preview=1 like the admin preview does.
 */
import { expect, test, type Page } from '@playwright/test';

const noHorizontalScroll = async (page: Page) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'no horizontal scroll').toBeLessThanOrEqual(1);
};

for (const vp of [{ name: 'phone', width: 390, height: 844 }, { name: 'desktop', width: 1280, height: 900 }]) {
  test(`style guide renders every block (${vp.name})`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/style-guide?preview=1');
    await expect(page.getByRole('heading', { level: 1, name: /Page blocks/ })).toBeVisible();
    await expect(page.locator('.draft-badge')).toContainText('Draft');
    for (const t of ['heading', 'paragraph', 'columns', 'list', 'callout', 'verse', 'facts', 'steps', 'faq', 'divider', 'image', 'gallery', 'embed', 'cards', 'people', 'buttons', 'documents', 'table', 'cta', 'contact',
      'deadline', 'prayer-times', 'next-jumuah', 'events', 'campaigns', 'leadership', 'masjid-cards', 'news', 'plans', 'form']) {
      expect(await page.locator(`.blk-${t}`).count(), `block ${t} present`).toBeGreaterThan(0);
    }
    // inline formatting: bold + internal link, no raw markdown left on the page
    await expect(page.locator('.blk-paragraph strong').first()).toHaveText('bold');
    await expect(page.locator('.blk-paragraph a[href="/membership"]').first()).toHaveText('links');
    expect(await page.locator('.blk-paragraph').first().innerText()).not.toContain('**');
    // embeds: the allowed host is an iframe, the other host is only a link
    expect(await page.locator('.blk-embed iframe[src^="https://www.youtube-nocookie.com/"]').count()).toBe(1);
    await expect(page.locator('.blk-embed-link a[href="https://example.org/not-allowed"]')).toBeVisible();
    expect(await page.locator('iframe[src*="example.org"]').count()).toBe(0);
    // live blocks show real data from the admin modules
    await expect(page.locator('.blk-prayer-list li')).toHaveCount(6);
    await expect(page.locator('.blk-prayer-list li[data-next]')).toHaveCount(1);
    expect(await page.locator('.blk-masjids .blk-card').count()).toBeGreaterThan(3);
    await expect(page.locator('.blk-deadline .blk-deadline-n')).toBeVisible();
    await expect(page.locator('.blk-table tbody tr')).toHaveCount(3);
    await noHorizontalScroll(page);
  });
}

test('a draft page is not shown to visitors, only with the admin preview flag', async ({ page }) => {
  const r = await page.goto('/style-guide');
  expect(r?.status()).toBe(404);
  const p = await page.goto('/style-guide?preview=1');
  expect(p?.status()).toBe(200);
});

test('old pages still render (v1 blocks are valid v2 pages)', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('About');
  expect(await page.locator('.blk-facts').count()).toBe(1);
  await expect(page.locator('.cta-box .btn')).toHaveAttribute('href', '/membership/join');
});

test('gallery is two columns on a phone and more on a desktop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/style-guide?preview=1');
  const cols = async () => page.locator('.blk-gallery-grid').first().evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  expect(await cols()).toBe(2);
  await page.setViewportSize({ width: 1280, height: 900 });
  expect(await cols()).toBeGreaterThanOrEqual(3);
});
