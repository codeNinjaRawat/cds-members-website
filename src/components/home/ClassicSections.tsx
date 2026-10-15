/** Sections used by the classic layout (and available to any layout via admin section list). */
import Link from 'next/link';
import type { Home } from '@/lib/content/home';
import { formatUSD, type MembershipSettings } from '@/lib/content/membership';

export function StepsBand({ journey }: { journey: Home['journey'] }) {
  return (
    <section className="steps-band" aria-labelledby="steps-h">
      <div className="wrap">
        <div className="section-head"><h2 id="steps-h">How membership works</h2><p>{journey.steps.length} steps, about five minutes. You can save and finish later.</p></div>
        <ol className="steps">{journey.steps.map((s) => <li key={s.title}><h3>{s.title}</h3><p>{s.text}</p></li>)}</ol>
      </div>
    </section>
  );
}

export function PlanCards({ settings }: { settings: MembershipSettings }) {
  const plans = settings.plans.filter((p) => p.visible && p.memberClass === 'natural');
  const dl = new Date(settings.recordDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: settings.timezone });
  return (
    <section className="plans-band" id="plans" aria-labelledby="plans-h">
      <div className="wrap">
        <div className="section-head"><h2 id="plans-h">Choose your membership</h2><p>Dues run January 1 to December 31. Pay by {dl} to vote that year.</p></div>
        <div className="plans3">
          {plans.map((p) => (
            <article key={p.id} className={`plan3${p.featured ? ' featured' : ''}`}>
              <h3>{p.name}</h3>
              <div className="p3-price">{formatUSD(p.priceCents)} <small>{p.unit}</small></div>
              <ul>{p.perks.map((x) => <li key={x}>{x}</li>)}</ul>
              <Link className={`btn ${p.featured ? 'btn-primary' : 'btn-outline'}`} href={`/membership/join?plan=${p.id}`}>Choose {p.name.toLowerCase()}</Link>
            </article>
          ))}
        </div>
        <p className="note">Prices are set by the ISGH Board each year. <Link href="/membership/plans">See all plans and dues</Link>.</p>
      </div>
    </section>
  );
}
