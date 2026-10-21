/**
 * O2.2 – site search over admin content: pages (public, live), masajid, zones, news, events, campaigns, public records.
 * Server-side, no index to maintain: documents are small (hundreds of items) and already cached per request.
 * Pure functions; the loader builds the corpus.
 */
import type { Block, Page } from '@/lib/content/pages';
import { isLive } from '@/lib/content/page-rules';

export type SearchDoc = { kind: 'page' | 'masjid' | 'zone' | 'news' | 'event' | 'campaign' | 'record'; title: string; href: string; text: string; date?: string; masjid?: string };
export const KIND_LABEL: Record<SearchDoc['kind'], string> = { page: 'Pages', masjid: 'Masajid', zone: 'Zones', news: 'News', event: 'Events', campaign: 'Campaigns', record: 'Documents' };

/** Visible words of a page's blocks (static text only – live blocks are data, not words). */
export function pageText(blocks: Block[]): string {
  const out: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case 'heading': case 'paragraph': out.push(b.text); break;
      case 'list': out.push(...b.items); break;
      case 'callout': out.push(b.title, b.text); break;
      case 'faq': out.push(...b.items.flatMap((i) => [i.q, i.a])); break;
      case 'facts': out.push(...b.items.map((i) => `${i.value} ${i.label}`)); break;
      case 'cta': out.push(b.title, b.text, b.label); break;
      case 'contact': out.push(...b.lines.map((l) => `${l.label} ${l.value}`)); break;
      case 'columns': out.push(...b.columns.flatMap((c) => [c.title ?? '', c.text])); break;
      case 'cards': out.push(...b.items.flatMap((c) => [c.title, c.text ?? ''])); break;
      case 'steps': out.push(...b.items.flatMap((c) => [c.title, c.text ?? ''])); break;
      case 'people': out.push(...b.items.flatMap((c) => [c.name, c.role ?? '', c.note ?? ''])); break;
      case 'documents': out.push(...b.items.map((d) => d.title)); break;
      case 'table': out.push(b.caption ?? '', ...b.header, ...b.rows.flat()); break;
      case 'verse': out.push(b.text, b.source); break;
      case 'image': case 'gallery': out.push(b.caption ?? ''); break;
      case 'embed': out.push(b.title); break;
      default: break;
    }
  }
  return out.filter(Boolean).join(' ');
}
export const pageDoc = (p: Page): SearchDoc | null => (p.visibility === 'public' && isLive(p) && !p.seo.noIndex ? { kind: 'page', title: p.title, href: `/${p.slug}`, text: `${p.intro ?? ''} ${pageText(p.blocks)}`, date: p.updatedAt, masjid: p.scope.kind === 'masjid' ? p.scope.center : '' } : null);

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '');
const tokens = (q: string) => norm(q).split(/[^a-z0-9]+/).filter((t) => t.length > 1);

export type Hit = SearchDoc & { score: number; snippet: string };
/** Simple scoring: title matches weigh 10, phrase match 6, each word in text 1; fewer than one matching word → no hit. */
export function search(docs: SearchDoc[], query: string, limit = 30): Hit[] {
  const ts = tokens(query); if (!ts.length) return [];
  const phrase = norm(query).trim();
  const hits: Hit[] = [];
  for (const d of docs) {
    const title = norm(d.title); const text = norm(d.text);
    let score = 0; let matched = 0;
    for (const t of ts) {
      const inTitle = title.includes(t); const inText = text.includes(t);
      if (inTitle) score += 10; if (inText) score += 1; if (inTitle || inText) matched++;
    }
    if (!matched) continue;
    if (phrase.length > 3 && (title.includes(phrase) || text.includes(phrase))) score += 6;
    if (matched === ts.length) score += 3;
    hits.push({ ...d, score, snippet: snippetFor(d.text, ts) });
  }
  return hits.sort((a, b) => b.score - a.score || (b.date ?? '').localeCompare(a.date ?? '')).slice(0, limit);
}
export function snippetFor(text: string, ts: string[], width = 150): string {
  const low = norm(text); let at = -1;
  for (const t of ts) { const i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; }
  if (at < 0) return text.slice(0, width).trim() + (text.length > width ? '…' : '');
  const start = Math.max(0, at - Math.floor(width / 3));
  return (start > 0 ? '…' : '') + text.slice(start, start + width).trim() + (start + width < text.length ? '…' : '');
}
export const grouped = (hits: Hit[]) => (Object.keys(KIND_LABEL) as SearchDoc['kind'][]).map((k) => ({ kind: k, label: KIND_LABEL[k], hits: hits.filter((h) => h.kind === k) })).filter((g) => g.hits.length);
