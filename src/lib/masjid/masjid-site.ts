/**
 * O3 – masjid micro-sites. Resolves /masjid/<slug>, lists the routes of a masjid and builds the built-in
 * ("virtual") pages from live blocks + the masjid profile. An admin-composed page with the same address replaces
 * a built-in route; other admin pages under masjid/<slug>/ join the menu. Pure functions – data is passed in.
 */
import type { Center, OrgStructure, Zone } from '@/lib/community/org-structure';
import { FACILITY_LABEL, SERVICE_LABEL, fmtTime, slugify } from '@/lib/community/org-structure';
import type { Block, Page } from '@/lib/content/pages';
import { PageSchema } from '@/lib/content/pages';

/** The path segment for masjid sites (a tenant setting later – e.g. "center"). */
export const MASJID_BASE = 'masjid';
export const masjidHref = (slug: string, sub = '') => `/${MASJID_BASE}/${slug}${sub ? `/${sub}` : ''}`;

export const MASJID_ROUTES = [
  { key: '', label: 'Overview' },
  { key: 'prayer-times', label: 'Prayer times' },
  { key: 'jumuah', label: 'Jumuah' },
  { key: 'activity', label: 'Activity' },
  { key: 'events', label: 'Events' },
  { key: 'programs', label: 'Programs' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'give', label: 'Give' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'visit', label: 'Visit' },
] as const;
export type MasjidRouteKey = (typeof MASJID_ROUTES)[number]['key'];
export const isBuiltInRoute = (k: string): k is MasjidRouteKey => MASJID_ROUTES.some((r) => r.key === k);

export type Resolved = { center: Center; zone: Zone | null; slug: string; canonical: boolean };
/** Finds a masjid by slug: its id, or its slugified name (then `canonical` is false → redirect to the id). */
export function resolveMasjid(map: OrgStructure, slug: string): Resolved | null {
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return null;
  const center = map.centers.find((c) => c.id === slug) ?? map.centers.find((c) => slugify(c.name) === slug);
  if (!center) return null;
  return { center, zone: map.zones.find((z) => z.id === center.zone) ?? null, slug: center.id, canonical: center.id === slug };
}

/** Routes shown in the masjid menu: built-ins + extra admin pages under masjid/<slug>/ (the gallery only when there are photos). */
export function masjidMenu(r: Resolved, customPages: Page[]): { key: string; label: string; href: string }[] {
  const built = MASJID_ROUTES.filter((x) => x.key !== 'gallery' || r.center.profile.gallery.length > 0)
    .map((x) => ({ key: x.key, label: x.label, href: masjidHref(r.slug, x.key) }));
  const prefix = `${MASJID_BASE}/${r.slug}/`;
  const extra = customPages.filter((p) => p.slug.startsWith(prefix) && !isBuiltInRoute(p.slug.slice(prefix.length)) && !p.slug.slice(prefix.length).includes('/'))
    .map((p) => ({ key: p.slug.slice(prefix.length), label: p.title, href: `/${p.slug}` }));
  return [...built, ...extra];
}

const H = (text: string): Block => ({ type: 'heading', text });
const addressOf = (c: Center) => [c.address.street, [c.address.city, 'TX', c.address.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
const mapsUrl = (c: Center) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${addressOf(c)}`)}`;
const mapEmbed = (c: Center) => `https://www.google.com/maps?q=${encodeURIComponent(`${c.name} ${addressOf(c)}`)}&output=embed`;

function visitBlocks(c: Center): Block[] {
  const p = c.profile;
  const lines = [
    { label: 'Address', value: addressOf(c), href: mapsUrl(c) },
    ...(c.phone ? [{ label: 'Phone', value: c.phone, href: `tel:${c.phone.replace(/[^\d+]/g, '')}` }] : []),
    ...(p.email ? [{ label: 'Email', value: p.email, href: `mailto:${p.email}` }] : []),
    ...(p.hours ? [{ label: 'Hours', value: p.hours }] : []),
    ...(c.website ? [{ label: 'Website', value: c.website.replace(/^https?:\/\//, ''), href: c.website }] : []),
  ];
  const out: Block[] = [{ type: 'contact', lines }];
  if (p.facilities.length || c.services.length) out.push({ type: 'list', items: [...c.services.map((s) => SERVICE_LABEL[s]), ...p.facilities.map((f) => FACILITY_LABEL[f])] });
  if (p.parking) out.push({ type: 'callout', tone: 'info', title: 'Parking', text: p.parking });
  if (addressOf(c)) out.push({ type: 'embed', kind: 'map', url: mapEmbed(c), title: `Map – ${c.name}` });
  const social = Object.entries(p.social).filter(([, v]) => v).map(([k, v]) => ({ label: k[0].toUpperCase() + k.slice(1), href: v, style: 'ghost' as const }));
  if (social.length) out.push({ type: 'buttons', items: social });
  return out;
}

/** The built-in page for a route. Admin pages at the same address replace it (see loaders). */
export function builtInPage(r: Resolved, route: MasjidRouteKey, news: { slug: string; title: string; date: string; excerpt: string; masjid: string; showOnMasjids: boolean }[] = []): Page {
  const c = r.center; const p = c.profile; const m = c.id; const today = new Date().toISOString().slice(0, 10);
  const base = { scope: { kind: 'masjid' as const, center: m }, status: 'published' as const, updatedAt: today, seo: { title: '', description: '', noIndex: false }, visibility: 'public' as const, publishAt: '', unpublishAt: '', owner: '', reviewedAt: '' };
  const title = (s: string) => `${s} · ${c.name}`;
  const mine = news.filter((n) => n.masjid === m || (!n.masjid && n.showOnMasjids));
  const newsBlocks: Block[] = mine.length
    ? [{ type: 'cards', columns: '2', items: mine.slice(0, 12).map((n) => ({ title: n.title, text: `${n.date.slice(5, 7)}/${n.date.slice(8, 10)}/${n.date.slice(0, 4)} – ${n.excerpt}`, href: `/news/${n.slug}`, label: 'Read' })) }]
    : [{ type: 'callout', tone: 'info', title: 'No announcements yet', text: 'Announcements from this masjid will appear here.' }];
  switch (route) {
    case '': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}`, title: c.name, template: 'hub', intro: p.story || c.aka || undefined, image: p.photo, blocks: [
      { type: 'prayer-times', masjid: m, view: 'today', showIqamah: true }, { type: 'next-jumuah', masjid: m },
      H('This week'), { type: 'activity', masjid: m, view: 'week', kinds: [], limit: 8 },
      H('Events'), { type: 'events', masjid: m, category: '', limit: 6, emptyText: 'No events scheduled this week.' },
      H('Announcements'), ...newsBlocks.slice(0, 1),
      H('Support this masjid'), { type: 'campaigns', masjid: m, limit: 3, emptyText: '' }, { type: 'buttons', items: [{ label: `Give to ${c.name}`, href: `/give?center=${encodeURIComponent(c.name)}`, style: 'primary' }] },
      H('Leadership'), { type: 'leadership', scope: 'masjid', masjid: m, zone: '' },
      H('Visit'), ...visitBlocks(c).slice(0, 2),
    ] });
    case 'prayer-times': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/prayer-times`, title: title('Prayer times'), template: 'hub', blocks: [
      { type: 'prayer-times', masjid: m, view: 'today', showIqamah: true }, { type: 'next-jumuah', masjid: m },
      H('This month'), { type: 'prayer-times', masjid: m, view: 'month', showIqamah: true },
      { type: 'buttons', items: [{ label: 'Add to my calendar (iCal)', href: `/prayer-times/ical?masjid=${m}`, style: 'secondary' }, { label: 'All masajid', href: '/prayer-times', style: 'ghost' }] },
    ] });
    case 'jumuah': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/jumuah`, title: title('Jumuah'), template: 'article', intro: c.jumuah.length ? `Khutbah ${c.jumuah.map((j) => `${j.label ? `${j.label} ` : ''}${fmtTime(j.khutbah)}`).join(' · ')}.` : 'Jumuah times will be announced.', blocks: [
      { type: 'next-jumuah', masjid: m },
      H('Coming Fridays'), { type: 'khutbah', masjid: m, weeks: 8 },
      ...(p.languages.length ? [{ type: 'facts' as const, items: p.languages.map((l) => ({ value: l, label: 'Khutbah language' })) }] : []),
      ...(p.parking ? [{ type: 'callout' as const, tone: 'info' as const, title: 'Parking on Fridays', text: p.parking }] : []),
      { type: 'buttons', items: [{ label: 'Friday schedule for all masajid', href: '/khutbah', style: 'secondary' }, { label: 'Rate the khutbah', href: '/feedback?topic=khutbah', style: 'ghost' }] },
    ] });
    case 'activity': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/activity`, title: title('Activity'), template: 'hub', intro: 'Everything happening here – events, announcements, campaigns, leadership, prayer-time changes and documents – in one stream.', blocks: [
      { type: 'activity', masjid: m, view: 'feed', kinds: [], limit: 60 },
      { type: 'buttons', items: [{ label: 'RSS feed', href: `/${MASJID_BASE}/${m}/feed`, style: 'ghost' }] },
    ] });
    case 'events': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/events`, title: title('Events'), template: 'hub', blocks: [
      { type: 'events', masjid: m, category: '', limit: 24, emptyText: 'No upcoming events at this masjid. See all events across the network.' },
      { type: 'buttons', items: [{ label: 'All events', href: '/events', style: 'secondary' }] },
    ] });
    case 'programs': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/programs`, title: title('Programs'), template: 'hub', intro: 'Classes, weekend school, halaqas, youth and sisters’ programs at this masjid.', blocks: [
      { type: 'events', masjid: m, category: 'education', limit: 12, emptyText: 'No classes or programs listed yet.' },
      { type: 'events', masjid: m, category: 'youth', limit: 6, emptyText: '' },
      { type: 'events', masjid: m, category: 'sisters', limit: 6, emptyText: '' },
    ] });
    case 'announcements': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/announcements`, title: title('Announcements'), template: 'hub', blocks: [...newsBlocks, { type: 'buttons', items: [{ label: 'All news', href: '/news', style: 'secondary' }] }] });
    case 'leadership': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/leadership`, title: title('Leadership'), template: 'hub', blocks: [
      { type: 'leadership', scope: 'masjid', masjid: m, zone: '' },
      ...(p.staff.length ? [H('Imam and staff'), { type: 'people' as const, items: p.staff.map((s) => ({ name: s.name, role: s.role, email: s.email || undefined, phone: s.phone || undefined })) }] : []),
      ...(r.zone ? [H(`${r.zone.name} leadership`), { type: 'leadership' as const, scope: 'zone' as const, masjid: '', zone: r.zone.id }] : []),
      { type: 'buttons', items: [{ label: 'All ISGH leaders', href: '/leadership', style: 'secondary' }] },
    ] });
    case 'give': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/give`, title: title('Give'), template: 'hub', intro: `Your gift keeps ${c.name} open for prayers, classes and community every day.`, blocks: [
      { type: 'campaigns', masjid: m, limit: 6, emptyText: '' },
      { type: 'buttons', items: [{ label: `Give to ${c.name}`, href: `/give?center=${encodeURIComponent(c.name)}`, style: 'primary' }, { label: 'Zakat', href: '/give?fund=zakat', style: 'secondary' }] },
      { type: 'verse', text: 'The example of those who spend their wealth in the way of Allah is like a seed of grain that sprouts seven ears; in every ear a hundred grains.', arabic: '', source: 'Quran 2:261' },
    ] });
    case 'gallery': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/gallery`, title: title('Gallery'), template: 'hub', blocks: p.gallery.length ? [{ type: 'gallery', images: p.gallery }] : [{ type: 'callout', tone: 'info', title: 'No photos yet', text: 'Photos of this masjid will appear here.' }] });
    case 'visit': return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}/visit`, title: title('Visit'), template: 'article', intro: p.story || undefined, image: p.photo, blocks: visitBlocks(c) });
    default: return PageSchema.parse({ ...base, slug: `${MASJID_BASE}/${m}`, title: c.name, template: 'hub', blocks: [] });
  }
}

export const accentOf = (c: Center) => c.profile.accent;
export { addressOf, mapsUrl };
