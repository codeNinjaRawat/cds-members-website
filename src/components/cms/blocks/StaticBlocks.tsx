/** O1 static blocks – typed by admins in the Page Composer. Phone-first; only theme variables; no HTML from the CMS. */
import Link from 'next/link';
import { Photo } from '@/components/ui/Photo';
import { ALLOWED_EMBED_HOSTS, type StaticBlock } from '@/lib/content/pages';
import { embedAllowed } from '@/lib/content/page-rules';
import { inline, paragraphs } from './inline';

const isExternal = (href: string) => /^https?:\/\//.test(href);
function Smart({ href, className, children, ariaLabel }: { href: string; className?: string; children: React.ReactNode; ariaLabel?: string }) {
  return isExternal(href)
    ? <a href={href} className={className} rel="noopener" target="_blank" aria-label={ariaLabel}>{children}</a>
    : <Link href={href} className={className} aria-label={ariaLabel}>{children}</Link>;
}
const fmtDate = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00-05:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : s ?? '');

export function StaticBlockView({ b }: { b: StaticBlock }) {
  switch (b.type) {
    case 'heading': return b.level === '3' ? <h3>{b.text}</h3> : <h2>{b.text}</h2>;
    case 'paragraph': return <>{paragraphs(b.text)}</>;
    case 'list': return b.ordered ? <ol>{b.items.map((i, k) => <li key={k}>{inline(i)}</li>)}</ol> : <ul>{b.items.map((i, k) => <li key={k}>{inline(i)}</li>)}</ul>;
    case 'callout': return <aside className="callout" data-tone={b.tone}><b>{b.title}</b>{paragraphs(b.text)}</aside>;
    case 'faq': return (
      <div className="faq">{b.items.map((f) => (
        <details key={f.q}><summary>{f.q}</summary>{paragraphs(f.a)}</details>
      ))}</div>
    );
    case 'facts': return <div className="facts">{b.items.map((f) => <div key={f.label}><b>{f.value}</b><span>{f.label}</span></div>)}</div>;
    case 'cta': return (
      <div className="cta-box"><div><h3>{b.title}</h3><p>{b.text}</p></div><Smart className="btn btn-primary" href={b.href}>{b.label}</Smart></div>
    );
    case 'contact': return (
      <dl className="contact-list">{b.lines.map((l) => (
        <div key={l.label}><dt>{l.label}</dt><dd>{l.href ? <a href={l.href}>{l.value}</a> : l.value}</dd></div>
      ))}</dl>
    );
    case 'image': return (
      <figure className="blk-image">
        <Photo image={b.image} sizes="(max-width: 800px) 100vw, 980px" className="blk-image-ph" showCredit />
        {b.caption && <figcaption>{b.caption}</figcaption>}
      </figure>
    );
    case 'gallery': return (
      <figure className="blk-gallery">
        <div className="blk-gallery-grid" data-n={Math.min(b.images.length, 4)}>
          {b.images.map((im, k) => <Photo key={k} image={im} sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 320px" className="blk-gallery-ph" showCredit />)}
        </div>
        {b.caption && <figcaption>{b.caption}</figcaption>}
      </figure>
    );
    case 'columns': return (
      <div className="blk-columns" data-n={b.columns.length}>
        {b.columns.map((c, k) => <div key={k}>{c.title && <h3>{c.title}</h3>}{paragraphs(c.text)}</div>)}
      </div>
    );
    case 'cards': return (
      <ul className="blk-cards" data-n={b.columns ?? '3'}>
        {b.items.map((c, k) => {
          const inner = <>
            {c.image && <Photo image={c.image} sizes="(max-width: 640px) 100vw, 400px" className="blk-card-ph" />}
            <div className="blk-card-body"><h3>{c.title}</h3>{c.text && <p>{inline(c.text)}</p>}{c.href && <span className="blk-card-link">{c.label ?? 'Open'} →</span>}</div>
          </>;
          return <li key={k} className="blk-card">{c.href ? <Smart href={c.href} className="blk-card-a">{inner}</Smart> : inner}</li>;
        })}
      </ul>
    );
    case 'steps': return (
      <ol className="blk-steps">{b.items.map((s, k) => <li key={k}><span className="blk-step-n" aria-hidden>{k + 1}</span><div><h3>{s.title}</h3>{s.text && <p>{inline(s.text)}</p>}</div></li>)}</ol>
    );
    case 'people': return (
      <ul className="blk-people">{b.items.map((p, k) => (
        <li key={k} className="blk-person">
          {p.image ? <Photo image={p.image} sizes="96px" className="blk-person-ph" /> : <span className="blk-person-initial" aria-hidden>{p.name.trim().charAt(0)}</span>}
          <div><b>{p.name}</b>{p.role && <span className="blk-person-role">{p.role}</span>}{p.note && <span className="blk-person-note">{p.note}</span>}
            <span className="blk-person-links">{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}{p.phone && <a href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}>{p.phone}</a>}</span></div>
        </li>
      ))}</ul>
    );
    case 'buttons': return (
      <div className="blk-buttons">{b.items.map((x, k) => <Smart key={k} href={x.href} className={`btn ${x.style === 'secondary' ? 'btn-secondary' : x.style === 'ghost' ? 'btn-ghost' : 'btn-primary'}`}>{x.label}</Smart>)}</div>
    );
    case 'documents': return (
      <ul className="blk-docs">{b.items.map((d, k) => (
        <li key={k}><Smart href={d.href} className="blk-doc">
          <span className="blk-doc-kind" aria-hidden>{(d.kind ?? 'PDF').toUpperCase().slice(0, 4)}</span>
          <span className="blk-doc-title">{d.title}</span>
          <span className="blk-doc-meta">{[d.kind, d.size, fmtDate(d.date)].filter(Boolean).join(' · ')}</span>
        </Smart></li>
      ))}</ul>
    );
    case 'table': return (
      <div className="blk-table-wrap"><table className="blk-table">
        {b.caption && <caption>{b.caption}</caption>}
        <thead><tr>{b.header.map((h, k) => <th key={k} scope="col">{h}</th>)}</tr></thead>
        <tbody>{b.rows.map((r, i) => <tr key={i}>{r.map((c, k) => (k === 0 ? <th key={k} scope="row">{c}</th> : <td key={k}>{inline(c)}</td>))}</tr>)}</tbody>
      </table></div>
    );
    case 'embed': {
      const ok = embedAllowed(b.url, ALLOWED_EMBED_HOSTS);
      if (!ok) return <p className="blk-embed-link"><a href={b.url} rel="noopener" target="_blank">{b.title} ↗</a></p>;
      return (
        <figure className="blk-embed" data-kind={b.kind}>
          <iframe src={b.url} title={b.title} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
          <figcaption><a href={b.url} rel="noopener" target="_blank">{b.title} – open in a new tab</a></figcaption>
        </figure>
      );
    }
    case 'verse': return (
      <blockquote className="blk-verse">
        {b.arabic && <p className="blk-verse-ar" lang="ar" dir="rtl">{b.arabic}</p>}
        <p className="blk-verse-en">{b.text}</p>
        <cite>{b.source}</cite>
      </blockquote>
    );
    case 'divider': return b.label ? <div className="blk-divider" role="separator"><span>{b.label}</span></div> : <hr className="blk-divider" />;
    default: return null;
  }
}
