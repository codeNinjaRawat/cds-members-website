/** Plans and dues view – all values from admin Settings › Membership & dues. */
import Link from 'next/link';
import { formatUSD, rulesInWords, type MembershipSettings } from '@/lib/content/membership';

export function PlansView({ settings: s }: { settings: MembershipSettings }) {
  const deadline = new Date(s.recordDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: s.timezone });
  return (
    <article className="cms-page">
      <div className="wrap">
        <header className="cms-head narrow-head">
          <h1>Plans and dues</h1>
          <p className="intro">Membership runs January 1 to December 31, {s.year}. Pay by {deadline} to vote in that year&apos;s elections. Dues are not refundable.{s.guide.enabled && <> New here? Read <Link href="/membership/guide">{s.guide.title.toLowerCase()}</Link>.</>}</p>
        </header>
        <div className="plan-grid">
          {s.plans.filter((p) => p.visible).map((p) => (
            <section key={p.id} className={`plan-card${p.featured ? ' featured' : ''}`} aria-labelledby={`plan-${p.id}`}>
              <h2 id={`plan-${p.id}`}>{p.name}</h2>
              <p className="price-sm">{formatUSD(p.priceCents)} <small>{p.unit}</small></p>
              <p className="sub">{p.summary}</p>
              <ul className="perks">{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>
              {p.multiYearDiscountPct > 0 && p.maxYearsAhead > 1 && <p className="note-sm">Save {p.multiYearDiscountPct}% when you pay up to {p.maxYearsAhead} years ahead.</p>}
              <Link className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`} href={`/membership/join?plan=${p.id}`}>Choose {p.name.toLowerCase()}</Link>
            </section>
          ))}
        </div>
        {rulesInWords(s).length > 0 && (
          <section className="plan-rules" aria-labelledby="plan-rules-h">
            <h2 id="plan-rules-h">How membership works</h2>
            <ul>{rulesInWords(s).map((w) => <li key={w}>{w}</li>)}</ul>
          </section>
        )}
      </div>
    </article>
  );
}
