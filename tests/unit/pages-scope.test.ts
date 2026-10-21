/** O1.5 white-box: masjid editors may change only their masjid's pages and never publish. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BUILT_IN_ROLES, pagesChangeProblem, type AccessDoc, type AdminUser } from '@/lib/community/access';

const me = { id: 'ed', name: 'Masjid Editor', email: 'ed@example.org', roleId: 'masjid-editor', status: 'active', zones: [], centers: ['North Islamic Center 1'], zips: [], more: [], twoStep: false, lastActive: '' } as unknown as AdminUser;
const doc = { requireTwoStepFor: 'sensitive', roles: BUILT_IN_ROLES, admins: [me] } as unknown as AccessDoc;
const centerName = (id: string) => ({ 'n-1': 'North Islamic Center 1', 'n-2': 'North Islamic Center 2' })[id] ?? '';
const zoneOf = () => 'n';
const P = (slug: string, status: string, center?: string) => ({ slug, status, scope: center ? { kind: 'masjid' as const, center } : { kind: 'org' as const } });

test('own masjid: drafts and review are fine; publishing is refused', () => {
  assert.equal(pagesChangeProblem({}, { 'masjid/n-1/ramadan': P('masjid/n-1/ramadan', 'draft', 'n-1') }, me, doc, centerName, zoneOf), null);
  assert.equal(pagesChangeProblem({ a: P('a', 'draft', 'n-1') }, { a: P('a', 'review', 'n-1') }, me, doc, centerName, zoneOf), null);
  assert.match(pagesChangeProblem({ a: P('a', 'draft', 'n-1') }, { a: P('a', 'published', 'n-1') }, me, doc, centerName, zoneOf) ?? '', /review/);
  assert.equal(pagesChangeProblem({ a: P('a', 'published', 'n-1') }, { a: P('a', 'published', 'n-1') }, me, doc, centerName, zoneOf), null, 'untouched published page is fine');
});

test('other masjid, organization pages and removals outside scope are refused; unchanged pages are ignored', () => {
  assert.match(pagesChangeProblem({}, { x: P('x', 'draft', 'n-2') }, me, doc, centerName, zoneOf) ?? '', /outside your masajid/);
  assert.match(pagesChangeProblem({}, { about: P('about', 'draft') }, me, doc, centerName, zoneOf) ?? '', /organization page/);
  assert.match(pagesChangeProblem({ about: P('about', 'published') }, {}, me, doc, centerName, zoneOf) ?? '', /organization page/);
  assert.equal(pagesChangeProblem({ about: P('about', 'published'), a: P('a', 'draft', 'n-1') }, { about: P('about', 'published'), a: P('a', 'draft', 'n-1') }, me, doc, centerName, zoneOf), null);
});
