/** Renders a CMS page (blocks edited by admins in CMS › Pages). Unknown block types are skipped safely. */
import Link from 'next/link';
import { Photo } from '@/components/ui/Photo';
import type { Block, Page } from '@/lib/content/pages';

function BlockView({ b }: { b: Block }) {
  switch (b.type) {
    case 'heading': return <h2>{b.text}</h2>;
    case 'paragraph': return <p>{b.text}</p>;
    case 'list': return b.ordered ? <ol>{b.items.map((i) => <li key={i}>{i}</li>)}</ol> : <ul>{b.items.map((i) => <li key={i}>{i}</li>)}</ul>;
    case 'callout': return <aside className="callout" data-tone={b.tone}><b>{b.title}</b><p>{b.text}</p></aside>;
    case 'faq': return (
      <div className="faq">{b.items.map((f) => (
        <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
      ))}</div>
    );
    case 'facts': return <div className="facts">{b.items.map((f) => <div key={f.label}><b>{f.value}</b><span>{f.label}</span></div>)}</div>;
    case 'cta': return (
      <div className="cta-box"><div><h3>{b.title}</h3><p>{b.text}</p></div><Link className="btn btn-primary" href={b.href}>{b.label}</Link></div>
    );
    case 'contact': return (
      <dl className="contact-list">{b.lines.map((l) => (
        <div key={l.label}><dt>{l.label}</dt><dd>{l.href ? <a href={l.href}>{l.value}</a> : l.value}</dd></div>
      ))}</dl>
    );
    default: return null;
  }
}

export function PageView({ page }: { page: Page }) {
  return (
    <article className="cms-page">
      <div className="wrap narrow">
        <header className="cms-head">
          {page.status === 'draft' && <p className="draft-badge">Draft</p>}
          <h1>{page.title}</h1>
          {page.intro && <p className="intro">{page.intro}</p>}
        </header>
        {page.image && <Photo image={page.image} sizes="(max-width: 800px) 100vw, 760px" className="cms-hero-img" priority showCredit />}
        <div className="cms-body">{page.blocks.map((b, i) => <BlockView key={i} b={b} />)}</div>
        <p className="updated">Last updated {new Date(page.updatedAt + 'T12:00:00-05:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </article>
  );
}
