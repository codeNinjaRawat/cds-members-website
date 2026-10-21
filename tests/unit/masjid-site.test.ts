/** O3 white-box: masjid resolution, menu and built-in pages.
 *  Run: node --experimental-strip-types --import ./tests/unit/register.mjs --test tests/unit/masjid-site.test.ts */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ISGH_REAL_STRUCTURE, mockOrgStructure } from '@/lib/community/org-structure';
import { PageSchema } from '@/lib/content/pages';
import { builtInPage, isBuiltInRoute, masjidHref, masjidMenu, MASJID_ROUTES, resolveMasjid } from '@/lib/masjid/masjid-site';

const real = ISGH_REAL_STRUCTURE;
const first = real.centers[0];

test('resolve by id, by slugified name (non-canonical), unknown and bad slugs', () => {
  const byId = resolveMasjid(real, first.id);
  assert.ok(byId && byId.canonical && byId.center.id === first.id && byId.zone);
  const demo = resolveMasjid(mockOrgStructure, 'north-islamic-center-1');
  assert.ok(demo && !demo.canonical, 'slugified name resolves but is not canonical');
  assert.equal(demo!.slug, 'n-1');
  assert.equal(resolveMasjid(real, 'nowhere'), null);
  assert.equal(resolveMasjid(real, 'Bad Slug!'), null);
  assert.equal(masjidHref('n-1', 'events'), '/masjid/n-1/events');
});

test('menu: built-in routes (gallery only with photos) + extra admin pages under the masjid', () => {
  const r = resolveMasjid(mockOrgStructure, 'n-1')!;
  const custom = [
    PageSchema.parse({ slug: 'masjid/n-1/ramadan', title: 'Ramadan at N1', updatedAt: '2026-10-21', blocks: [] }),
    PageSchema.parse({ slug: 'masjid/n-1/events', title: 'Custom events page', updatedAt: '2026-10-21', blocks: [] }),  // replaces a built-in → not added twice
    PageSchema.parse({ slug: 'masjid/n-2/other', title: 'Other masjid', updatedAt: '2026-10-21', blocks: [] }),
    PageSchema.parse({ slug: 'masjid/n-1/deep/page', title: 'Nested', updatedAt: '2026-10-21', blocks: [] }),
  ];
  const menu = masjidMenu(r, custom);
  const keys = menu.map((m) => m.key);
  assert.equal(keys.filter((k) => k === 'events').length, 1);
  assert.ok(keys.includes('ramadan') && !keys.includes('other') && !keys.includes('deep'));
  assert.ok(!keys.includes('gallery'), 'no gallery without photos');
  assert.equal(menu[0].href, '/masjid/n-1');
  assert.ok(isBuiltInRoute('prayer-times') && !isBuiltInRoute('ramadan'));
});

test('every built-in route builds a valid page scoped to the masjid, with live blocks bound to it', () => {
  const r = resolveMasjid(mockOrgStructure, 'n-1')!;
  for (const route of MASJID_ROUTES) {
    const p = builtInPage(r, route.key, [{ slug: 'x', title: 'Hello', date: '2026-10-20', excerpt: 'e', masjid: 'n-1', showOnMasjids: false }]);
    assert.ok(PageSchema.safeParse(p).success, `route ${route.key || 'overview'} is a valid page`);
    assert.deepEqual(p.scope, { kind: 'masjid', center: 'n-1' });
    for (const b of p.blocks) if ('masjid' in b && b.type !== 'leadership') assert.equal(b.masjid, 'n-1', `${route.key}: ${b.type} bound to the masjid`);
  }
  const ann = builtInPage(r, 'announcements', [{ slug: 'a', title: 'Mine', date: '2026-10-20', excerpt: '', masjid: 'n-1', showOnMasjids: false }, { slug: 'b', title: 'Org wide', date: '2026-10-19', excerpt: '', masjid: '', showOnMasjids: true }, { slug: 'c', title: 'Other masjid', date: '2026-10-18', excerpt: '', masjid: 'n-2', showOnMasjids: false }]);
  const cards = ann.blocks.find((b) => b.type === 'cards') as { items: { title: string }[] };
  assert.deepEqual(cards.items.map((i) => i.title), ['Mine', 'Org wide']);
  const visit = builtInPage(r, 'visit');
  assert.ok(visit.blocks.some((b) => b.type === 'embed' && b.url.startsWith('https://www.google.com/maps')), 'visit has a map embed');
});
