/** Server-rendered home sections: stats, "what your membership supports", journey, Houston band, closing CTA. */
import Link from 'next/link';
import type { Home } from '@/lib/content/home';
import { Photo } from '@/components/ui/Photo';

export function StatsStrip({ stats }: { stats: Home['stats'] }) {
  return (
    <section className="stats" aria-label="ISGH at a glance">
      <div className="wrap stats-grid">
        {stats.map((s) => <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}
      </div>
    </section>
  );
}

/** One quiet line from the Prophet ﷺ – admin: CMS › Home page › Heart line */
export function HeartLine({ line }: { line: NonNullable<Home['heartLine']> }) {
  return (
    <section className="heart-line" aria-label="A saying of the Prophet Muhammad">
      <figure className="wrap">
        <svg className="hl-star" width="14" height="14" aria-hidden="true"><use href="#star8" /></svg>
        <blockquote><p>The Prophet Muhammad ﷺ said: <q>{line.text}</q></p></blockquote>
        {line.arabic && <p className="hl-ar verse-ar" lang="ar" dir="rtl">{line.arabic}</p>}
        <figcaption>{line.source}</figcaption>
      </figure>
    </section>
  );
}

export function LifeMosaic({ life }: { life: Home['life'] }) {
  return (
    <section className="life" aria-labelledby="life-h">
      <div className="wrap">
        <div className="life-head"><h2 className="sec-title" id="life-h">{life.title}</h2><p className="sub">{life.text}</p></div>
        <div className="mosaic">
          {life.tiles.map((t, i) => {
            const body = (<>
              <Photo image={t.image} sizes={i === 0 ? '(max-width: 960px) 100vw, 50vw' : '(max-width: 960px) 100vw, 25vw'} />
              <div className="mosaic-text"><h3>{t.title}</h3><p>{t.text}</p></div>
            </>);
            return t.href
              ? <Link key={t.title} className={`mosaic-tile m${i}`} href={t.href}>{body}</Link>
              : <div key={t.title} className={`mosaic-tile m${i}`}>{body}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

export function Journey({ journey }: { journey: Home['journey'] }) {
  return (
    <section className="journey" aria-labelledby="j-h">
      <div className="wrap">
        <h2 className="sec-title" id="j-h">{journey.title}</h2>
        <ol className="track">{journey.steps.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
      </div>
    </section>
  );
}

export function HoustonBand({ houston }: { houston: Home['houston'] }) {
  return (
    <section className="houston" aria-labelledby="hou-h">
      <Photo image={houston.image} sizes="100vw" className="houston-photo" showCredit />
      <div className="wrap houston-inner">
        <div className="houston-card">
          <h2 id="hou-h">{houston.title}</h2>
          <p>{houston.text}</p>
          <Link className="btn btn-primary" href={houston.cta.href}>{houston.cta.label}</Link>
        </div>
      </div>
    </section>
  );
}

export function Closing({ closing }: { closing: Home['closing'] }) {
  return (
    <section className="closing" aria-labelledby="close-h">
      <div className="wrap closing-grid">
        <div>
          <h2 className="sec-title" id="close-h">{closing.title}</h2>
          <p className="sub">{closing.text}</p>
          <Link className="btn btn-highlight" href={closing.cta.href}>{closing.cta.label}</Link>
        </div>
        <Photo image={closing.image} sizes="(max-width: 960px) 100vw, 45vw" className="closing-photo" />
      </div>
    </section>
  );
}
