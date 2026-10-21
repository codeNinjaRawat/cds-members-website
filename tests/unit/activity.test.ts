/** O4 white-box: derived activity. Run: node --experimental-strip-types --import ./tests/unit/register.mjs --test tests/unit/activity.test.ts */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockOrgStructure } from '@/lib/community/org-structure';
import { mockEvents } from '@/lib/community/events';
import { mockFundraising } from '@/lib/community/fundraising';
import { mockOfficials } from '@/lib/community/officials';
import { mockPrayerSettings } from '@/lib/community/prayer';
import { mockRecords } from '@/lib/community/records';
import { mockNews } from '@/lib/content/pages';
import { deriveActivity, forMasjid, thisWeek, toRss, byKind } from '@/lib/activity/activity';

const map = mockOrgStructure;
const today = '2026-10-21';
const all = () => deriveActivity({ map, events: mockEvents, news: mockNews, fundraising: mockFundraising, officials: mockOfficials, prayer: mockPrayerSettings, records: mockRecords }, today, { pastDays: 400, futureDays: 400 });

test('derives items from every public source, deduplicated, upcoming first then past newest-first', () => {
  const items = all();
  assert.ok(items.length > 5);
  assert.equal(new Set(items.map((i) => i.id)).size, items.length, 'ids unique');
  const kinds = new Set(items.map((i) => i.kind));
  assert.ok(kinds.has('announcement') && kinds.has('event'), 'news and events present');
  const firstPast = items.findIndex((i) => i.tense === 'past');
  assert.ok(items.slice(0, firstPast).every((i) => i.tense === 'upcoming'));
  for (let k = firstPast + 1; k < items.length; k++) assert.ok(items[k - 1].at >= items[k].at, 'past items newest first');
});

test('never leaks members-only data: no draft or members events, no members records', () => {
  const items = all();
  const privateTitles = [...mockEvents.events.filter((e) => e.status === 'draft' || e.visibility !== 'public').map((e) => e.title), ...mockRecords.items.filter((r) => r.audience !== 'public').map((r) => r.title)];
  for (const t of privateTitles) assert.ok(!items.some((i) => i.title === t || i.title === `Cancelled: ${t}`), `private item leaked: ${t}`);
});

test('masjid filter keeps the masjid’s own items plus organization-wide ones; kind filter works', () => {
  const items = all();
  const m = map.centers[0].id;
  const mine = forMasjid(items, m);
  assert.ok(mine.every((i) => i.masjid === m || i.masjid === ''));
  assert.ok(forMasjid(items, m, false).every((i) => i.masjid === m));
  assert.ok(byKind(items, ['announcement']).every((i) => i.kind === 'announcement'));
  assert.equal(byKind(items, []).length, items.length);
});

test('window: items outside the window are dropped; this-week splits around today', () => {
  const narrow = deriveActivity({ map, news: [{ slug: 'old', title: 'Old', date: '2025-01-01', excerpt: '', masjid: '', showOnMasjids: false }, { slug: 'new', title: 'New', date: '2026-10-19', excerpt: '', masjid: '', showOnMasjids: false }] }, today);
  assert.deepEqual(narrow.map((i) => i.title), ['New']);
  const w = thisWeek(all(), today);
  assert.ok(w.recent.every((i) => i.tense === 'past' && i.at.slice(0, 10) >= '2026-10-14'));
  assert.ok(w.upcoming.every((i) => i.tense === 'upcoming' && i.at.slice(0, 10) <= '2026-10-28'));
});

test('iqamah rule boundaries become upcoming "times change" items; RSS escapes and lists items', () => {
  const p = { ...mockPrayerSettings, website: { ...mockPrayerSettings.website, enabled: true } };
  const items = deriveActivity({ map, prayer: p }, today, { futureDays: 400 });
  assert.ok(items.some((i) => i.kind === 'prayer' && i.tense === 'upcoming'), 'a future iqamah change exists in the mock rules');
  const rss = toRss([{ id: 'x', kind: 'event', masjid: '', masjidName: '', at: '2026-10-20T19:00', title: 'A & B <test>', summary: 's', href: '/events/x', tense: 'past' }], { title: 'T', link: 'https://example.org', description: 'd' });
  assert.ok(rss.includes('<title>A &amp; B &lt;test&gt;</title>') && rss.includes('<link>https://example.org/events/x</link>'));
});
