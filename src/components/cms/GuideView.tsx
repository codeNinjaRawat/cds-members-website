/** J3 – "How to sign up": the organization's own steps from Membership rules › Join form policies. */
import Link from 'next/link';
import type { MembershipSettings } from '@/lib/content/membership';

export function GuideView({ settings: s }: { settings: MembershipSettings }) {
  const g = s.guide;
  return (
    <article className="cms-page guide">
      <div className="wrap">
        <header className="cms-head narrow-head"><p className="eyebrow">Membership</p><h1>{g.title}</h1><p className="intro">{g.intro}</p></header>
        <ol className="guide-steps">{g.steps.map((st, i) => <li key={i}><span className="guide-n" aria-hidden="true">{i + 1}</span><div><h2>{st.title}</h2><p>{st.text}</p></div></li>)}</ol>
        {g.help && <p className="guide-help">{g.help}</p>}
        <p className="guide-cta"><Link className="btn btn-primary" href="/membership/join">Start your application</Link> <Link className="btn btn-outline" href="/membership/plans">See the plans</Link></p>
      </div>
    </article>
  );
}

/** J1 – the identity policy as a page of its own (when no outside page is linked). */
export function IdentityPolicyView({ settings: s }: { settings: MembershipSettings }) {
  const p = s.identity.policy;
  return (
    <article className="cms-page policy">
      <div className="wrap narrow">
        <header className="cms-head narrow-head"><p className="eyebrow">Membership</p><h1>{p.title}</h1></header>
        {p.text.split(/\n{2,}/).filter(Boolean).map((para, i) => { const m = para.match(/^([^.]{3,60}\.)\s+([\s\S]*)$/); return <p key={i}>{m ? <><b>{m[1]}</b> {m[2]}</> : para}</p>; })}
        {s.identity.consentRequired && <p className="policy-consent">When you apply you will be asked to confirm: “{s.identity.consentText}”</p>}
      </div>
    </article>
  );
}
