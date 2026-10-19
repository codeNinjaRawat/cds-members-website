/**
 * Giving pages + home sections. Content: GET /public/giving (admin: CMS › Giving).
 *   /give    – why give (verses, hadith, reasons) + needs + impact preview
 *   /impact  – "How we helped": real, sourced programs and events + consented stories
 *   /needs   – "Who still needs help": open cases with progress and a demo Give dialog
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { visible, VERSE_IMAGE, type Giving, type Impact } from '@/lib/content/giving';
import { Photo } from '@/components/ui/Photo';
import { formatUSD } from '@/lib/content/membership';
import { VerseBand } from './VerseBand';
import { NeedsGrid } from './NeedsGrid';
import type { MonthlyOffer } from '@/lib/content/membership';

const KIND: Record<Impact['kind'], string> = { program: 'Program', event: 'Community response', story: 'Story' };

export function ImpactCard({ item, big = false }: { item: Impact; big?: boolean }) {
  return (
    <article className={`impact-card${big ? ' big' : ''}`}>
      <div className="impact-media">
        <Photo image={item.image} sizes={big ? '(max-width: 900px) 100vw, 60vw' : '(max-width: 700px) 100vw, 33vw'} />
        {item.stockPhoto && <span className="illus">Illustrative photo</span>}
      </div>
      <div className="impact-body">
        <p className="impact-meta">
          <span className="tag t-kind">{KIND[item.kind]}</span>
          {item.when && item.when !== 'Sample' && <span>{item.when}</span>}
          {item.zone && <span>{item.zone} zone</span>}
          {item.sample && <span className="tag t-sample">Sample story</span>}
        </p>
        <h3>{item.title}</h3>
        <p className="impact-sum">{item.summary}</p>
        {big && item.body.map((p) => <p key={p} className="impact-p">{p}</p>)}
        {item.metrics.length > 0 && (
          <dl className="impact-metrics">
            {item.metrics.map((m) => <div key={m.label}><dt>{m.label}</dt><dd>{m.value}</dd></div>)}
          </dl>
        )}
        <p className="impact-foot">
          {item.source
            ? <a href={item.source.url} target="_blank" rel="noopener noreferrer">Source: {item.source.label}</a>
            : item.consent === 'anonymized' ? <span>Shared with permission · names and details changed</span> : null}
        </p>
      </div>
    </article>
  );
}

/* ---------------- home sections ---------------- */
export function HomeVerse({ giving }: { giving: Giving }) {
  return <VerseBand verses={giving.verses} image={VERSE_IMAGE} rotate={giving.flags.rotateVerses} cta={{ label: 'See who needs help', href: '/needs' }} />;
}

export function HomeImpact({ giving }: { giving: Giving }) {
  const items = visible(giving.impact, giving).filter((i) => i.featured || !i.sample).slice(0, 3);
  if (!items.length) return null;
  return (
    <section className="impact-sec" aria-labelledby="imp-h">
      <div className="wrap">
        <div className="sec-head">
          <div><p className="eyebrow">How we helped</p><h2 className="sec-title" id="imp-h">When Houston needed us, we showed up.</h2></div>
          <Link className="btn btn-outline" href="/impact">All stories</Link>
        </div>
        <div className="impact-grid home">
          {items.map((it, k) => <ImpactCard key={it.id} item={it} big={k === 0} />)}
        </div>
      </div>
    </section>
  );
}

export function HomeNeeds({ giving }: { giving: Giving }) {
  const needs = visible(giving.needs, giving).filter((n) => n.status !== 'met');
  if (!needs.length) return null;
  return (
    <section className="needs-sec" aria-labelledby="need-h">
      <div className="wrap">
        <div className="sec-head">
          <div><p className="eyebrow">Who still needs help</p><h2 className="sec-title" id="need-h">Neighbors waiting on someone like you.</h2></div>
          <Link className="btn btn-outline" href="/needs">See all needs</Link>
        </div>
        <NeedsGrid needs={needs} showProgress={giving.flags.showProgress} limit={3} />
      </div>
    </section>
  );
}

/* ---------------- pages ---------------- */
function GivingHero({ eyebrow, title, intro, children, stats, statsTitle }: { eyebrow: string; title: string; intro: string; children?: ReactNode; stats?: { value: string; label: string }[]; statsTitle?: string }) {
  return (
    <header className="giving-hero">
      <div className={`wrap${stats?.length ? ' gh-grid' : ''}`}>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="intro">{intro}</p>
          {children && <div className="giving-hero-cta">{children}</div>}
        </div>
        {!!stats?.length && (
          <aside className="gh-stats" aria-label={statsTitle ?? 'At a glance'}>
            <p className="gh-stats-title"><svg width="14" height="14" aria-hidden="true"><use href="#star8" /></svg>{statsTitle ?? 'At a glance'}</p>
            <dl>{stats.map((s) => <div key={s.label}><dd>{s.value}</dd><dt>{s.label}</dt></div>)}</dl>
          </aside>
        )}
      </div>
    </header>
  );
}

export function GiveView({ giving, offer = null }: { giving: Giving; offer?: MonthlyOffer | null }) {
  const needs = visible(giving.needs, giving);
  const impact = visible(giving.impact, giving).filter((i) => !i.sample).slice(0, 3);
  return (
    <div className="giving-page">
      <GivingHero eyebrow="Give" title={giving.title} intro={giving.intro} stats={giving.totals} statsTitle="Your giving in Houston">
        <a className="btn btn-primary" href="#needs">Give to a need</a>
        <a className="btn btn-outline" href={giving.zakatUrl} target="_blank" rel="noopener noreferrer">Pay Zakat to ISGH</a>
        <Link className="btn btn-outline" href="/membership/join">Become a member</Link>
      </GivingHero>
      <VerseBand verses={giving.verses} image={VERSE_IMAGE} rotate={giving.flags.rotateVerses} eyebrow="What Allah says about giving" />
      <section className="wrap reasons" aria-labelledby="why-h">
        <h2 className="sec-title" id="why-h">Why give through ISGH?</h2>
        <ol className="reason-grid">
          {giving.reasons.map((r, i) => <li key={r.title}><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{r.title}</h3><p>{r.text}</p></li>)}
        </ol>
        {giving.hadith.map((h) => (
          <figure key={h.id} className="hadith"><blockquote><p>&ldquo;{h.text}&rdquo;</p></blockquote><figcaption>The Prophet Muhammad ﷺ · {h.source}</figcaption></figure>
        ))}
      </section>
      <section className="wrap giving-block" id="needs" aria-labelledby="gn-h">
        <div className="sec-head"><h2 className="sec-title" id="gn-h">Who still needs help</h2><Link className="btn btn-outline" href="/needs">All needs</Link></div>
        <NeedsGrid needs={needs} showProgress={giving.flags.showProgress} limit={6} offer={offer} />
      </section>
      <section className="wrap giving-block" aria-labelledby="gi-h">
        <div className="sec-head"><h2 className="sec-title" id="gi-h">What your giving already did</h2><Link className="btn btn-outline" href="/impact">How we helped</Link></div>
        <div className="impact-grid">{impact.map((it) => <ImpactCard key={it.id} item={it} />)}</div>
      </section>
      <SamplesNote giving={giving} />
    </div>
  );
}

export function ImpactView({ giving }: { giving: Giving }) {
  const items = visible(giving.impact, giving);
  const [first, ...rest] = items;
  return (
    <div className="giving-page">
      <GivingHero eyebrow="How we helped" title="Your giving, at work in Houston." intro="Real programs and moments from the ISGH community, with sources. Personal stories are shared only with permission, and names are changed when people ask." stats={giving.totals} statsTitle="By the numbers">
        <Link className="btn btn-primary" href="/needs">Help someone now</Link>
        <Link className="btn btn-outline" href="/membership/join">Become a member</Link>
      </GivingHero>
      <div className="wrap">
        {first && <div className="impact-lead"><ImpactCard item={first} big /></div>}
        <div className="impact-grid">{rest.map((it) => <ImpactCard key={it.id} item={it} />)}</div>
      </div>
      <VerseBand verses={giving.verses.slice(0, 4)} image={VERSE_IMAGE} rotate={giving.flags.rotateVerses} eyebrow="Why we give" cta={{ label: 'Give today', href: '/give' }} />
      <SamplesNote giving={giving} />
    </div>
  );
}

export function NeedsView({ giving }: { giving: Giving }) {
  const needs = visible(giving.needs, giving);
  const open = needs.filter((n) => n.status !== 'met');
  const gap = open.reduce((sum, n) => sum + (n.goalCents ? Math.max(0, n.goalCents - (n.raisedCents ?? 0)) : 0), 0);
  const stats = [
    { value: String(open.length), label: 'open needs right now' },
    { value: String(open.filter((n) => n.status === 'urgent').length), label: 'marked urgent' },
    { value: formatUSD(gap), label: 'still needed for funded cases' },
    { value: String(open.filter((n) => n.zakatEligible).length), label: 'eligible for Zakat' },
  ];
  return (
    <div className="giving-page">
      <GivingHero stats={stats} statsTitle="Today" eyebrow="Who still needs help" title="Every case here is a neighbor." intro="Cases are verified by ISGH staff before they are published. We never show names, faces or addresses of people asking for help.">
        <a className="btn btn-outline" href={giving.zakatUrl} target="_blank" rel="noopener noreferrer">Pay Zakat to ISGH</a>
        <Link className="btn btn-outline" href="/impact">See how we helped</Link>
      </GivingHero>
      <section className="wrap giving-block" aria-label="Open needs">
        <NeedsGrid needs={needs} showProgress={giving.flags.showProgress} filters />
      </section>
      <section className="wrap need-help-cta">
        <div className="cta-box"><div><h3>Do you or someone you know need help?</h3><p>The ISGH Financial Assistance Office is at 10333 Harwin Dr, Suite 245, Houston, TX 77036. Call (713) 524-6615. Everything you share is confidential.</p></div><Link className="btn btn-primary" href="/contact">Contact us</Link></div>
      </section>
      <SamplesNote giving={giving} />
    </div>
  );
}

function SamplesNote({ giving }: { giving: Giving }) {
  if (!giving.flags.showSamples) return null;
  return (
    <p className="wrap samples-note">
      Items marked <b>Sample</b> are demo content to show the layout; admins replace them with verified, consented cases. Items with a source are real and link to where we found them. Photos are illustrative stock images (Pexels).
    </p>
  );
}
