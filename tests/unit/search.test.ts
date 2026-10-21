/** O2 white-box: site search. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grouped, pageDoc, pageText, search, snippetFor } from '@/lib/search/search';
import { mockPages, PageSchema } from '@/lib/content/pages';

test('page text gathers static blocks only; drafts, members-only and noIndex pages are not searchable', () => {
  const sg = mockPages['style-guide'];
  const text = pageText(sg.blocks);
  assert.ok(text.includes('Two columns') && text.includes('Membership levels (example)') && text.includes('Quran 2:43'));
  assert.equal(pageDoc(sg), null, 'style guide is a draft');
  assert.ok(pageDoc(mockPages.about));
  assert.equal(pageDoc(PageSchema.parse({ ...mockPages.about, visibility: 'members' })), null);
  assert.equal(pageDoc(PageSchema.parse({ ...mockPages.about, seo: { title: '', description: '', noIndex: true } })), null);
});

test('search ranks title matches first, requires a match, groups by kind, makes snippets', () => {
  const docs = [
    { kind: 'page' as const, title: 'Zakat ul Maal', href: '/zakat', text: 'How zakat is calculated and distributed.' },
    { kind: 'news' as const, title: 'Office closed', href: '/news/x', text: 'The zakat office is closed on Monday.', date: '2026-10-01' },
    { kind: 'event' as const, title: 'Family night', href: '/events/f', text: 'Games and dinner.', date: '2026-10-20' },
  ];
  const hits = search(docs, 'zakat');
  assert.deepEqual(hits.map((h) => h.href), ['/zakat', '/news/x']);
  assert.equal(search(docs, 'basketball').length, 0);
  assert.equal(search(docs, 'a').length, 0, 'one-letter queries are ignored');
  assert.deepEqual(grouped(hits).map((g) => g.kind), ['page', 'news']);
  assert.ok(snippetFor('aaaa bbbb cccc zakat dddd', ['zakat']).includes('zakat'));
  assert.ok(search(docs, 'office closed')[0].score > search(docs, 'closed')[0].score, 'phrase match scores higher');
});
