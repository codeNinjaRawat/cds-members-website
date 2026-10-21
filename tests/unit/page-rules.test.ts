/** O1 white-box: page rules. Run: node --experimental-strip-types --test tests/unit/page-rules.test.ts */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLive, liveReason, effectiveSeo, blockMasjid, embedAllowed, masjidPageSlug, blockWidth } from '../../src/lib/content/page-rules.ts';

const NOW = '2026-10-21T10:00';
const base = { status: 'published' as const, publishAt: '', unpublishAt: '' };

test('published page is live; drafts, reviews and archived are not', () => {
  assert.equal(isLive(base, NOW), true);
  assert.equal(isLive({ ...base, status: 'draft' }, NOW), false);
  assert.equal(isLive({ ...base, status: 'review' }, NOW), false);
  assert.equal(isLive({ ...base, status: 'archived' }, NOW), false);
});

test('scheduled pages go live at publishAt (Houston time) and a date alone means midnight', () => {
  assert.equal(isLive({ status: 'scheduled', publishAt: '2026-10-21T10:00', unpublishAt: '' }, NOW), true);
  assert.equal(isLive({ status: 'scheduled', publishAt: '2026-10-21T10:01', unpublishAt: '' }, NOW), false);
  assert.equal(isLive({ status: 'scheduled', publishAt: '2026-10-21', unpublishAt: '' }, NOW), true);
  assert.equal(isLive({ status: 'scheduled', publishAt: '', unpublishAt: '' }, NOW), false, 'scheduled without a date never goes live');
  assert.match(liveReason({ status: 'scheduled', publishAt: '2026-11-01T09:00', unpublishAt: '' }, NOW), /Goes live on 2026-11-01 at 09:00/);
});

test('unpublishAt takes a page down, published pages with a future publishAt wait', () => {
  assert.equal(isLive({ ...base, unpublishAt: '2026-10-21T10:00' }, NOW), false);
  assert.equal(isLive({ ...base, unpublishAt: '2026-10-21T10:01' }, NOW), true);
  assert.equal(isLive({ ...base, publishAt: '2026-12-01' }, NOW), false);
  assert.match(liveReason({ ...base, unpublishAt: '2026-10-01' }, NOW), /Taken down/);
  assert.equal(liveReason(base, NOW), '');
});

test('SEO falls back to title, intro and page image; drafts are noIndex', () => {
  const img = { src: '/images/x.jpg', alt: 'x' };
  const s = effectiveSeo({ title: 'About', intro: 'Intro', image: img, status: 'published', seo: { title: '', description: '', noIndex: false } });
  assert.deepEqual([s.title, s.description, s.image, s.noIndex], ['About', 'Intro', img, false]);
  const d = effectiveSeo({ title: 'About', status: 'draft', seo: { title: 'SEO title', description: 'Desc', noIndex: false } });
  assert.deepEqual([d.title, d.description, d.noIndex], ['SEO title', 'Desc', true]);
});

test('live blocks default to the page’s masjid', () => {
  const masjidPage = { scope: { kind: 'masjid' as const, center: 'c-champions' } };
  assert.equal(blockMasjid({ masjid: '' }, masjidPage), 'c-champions');
  assert.equal(blockMasjid({ masjid: 'c-katy' }, masjidPage), 'c-katy');
  assert.equal(blockMasjid({ masjid: '' }, { scope: { kind: 'org' } }), '');
  assert.equal(masjidPageSlug('masjid-al-salam', 'events'), 'masjid/masjid-al-salam/events');
  assert.equal(masjidPageSlug('masjid-al-salam', ''), 'masjid/masjid-al-salam');
});

test('only allow-listed https hosts may be embedded', () => {
  const hosts = ['www.youtube-nocookie.com', 'docs.google.com'];
  assert.equal(embedAllowed('https://www.youtube-nocookie.com/embed/abc', hosts), true);
  assert.equal(embedAllowed('http://www.youtube-nocookie.com/embed/abc', hosts), false, 'http is refused');
  assert.equal(embedAllowed('https://evil.example/embed', hosts), false);
  assert.equal(embedAllowed('javascript:alert(1)', hosts), false);
  assert.equal(embedAllowed('not a url', hosts), false);
});

test('block width: own setting wins, else the template decides', () => {
  assert.equal(blockWidth({ type: 'paragraph', text: 'x' }, 'article'), 'narrow');
  assert.equal(blockWidth({ type: 'paragraph', text: 'x' }, 'hub'), 'wide');
  assert.equal(blockWidth({ type: 'paragraph', text: 'x', width: 'full' }, 'article'), 'full');
  assert.equal(blockWidth({ type: 'divider' }, 'landing'), 'wide');
});
