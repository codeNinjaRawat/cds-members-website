/** Become-a-member page (server-safe view). Data loaded in app/membership/join/page.tsx. */
import Link from 'next/link';
import type { MembershipSettings } from '@/lib/content/membership';
import { JoinFlow, type OrgNames } from './JoinFlow';
import { defaultJoinForm, type JoinForm } from '@/lib/join/form-def';
import type { Giving } from '@/lib/content/giving';
import type { OrgConfig } from '@/lib/community/org-config';

type Props = { settings: MembershipSettings; form?: JoinForm; initialPlan?: string; mockMode?: boolean; giving?: Giving; config?: OrgConfig; org?: OrgNames };

export function JoinPageView({ settings, form = defaultJoinForm, initialPlan, mockMode, giving, config, org = { name: 'our organization', shortName: 'the organization' } }: Props) {
  const verse = giving?.verses.find((v) => v.ref === '3:92') ?? giving?.verses[0];
  return (
    <div className="join-page">
      <section className="join-top" aria-label="Become a member">
        <div className="wrap join-top-row">
          <h1>Become a member</h1>
          <p className="join-top-facts"><span>About 5 minutes</span><span>Jan 1 – Dec 31, {settings.year}</span><span>Pay by June 30 to vote</span><span>{config?.payments.check ? 'Card or check' : 'Card'} · receipt by email</span></p>
          <p className="join-already">Already a member? <Link href="/sign-in">Sign in</Link> or <Link href="/membership/renew">renew</Link>.</p>
        </div>
      </section>
      <div className="wrap">
        <JoinFlow settings={settings} form={form} initialPlan={initialPlan} mockMode={mockMode} config={config} org={org} />
      </div>
      {giving && (
        <section className="join-why" aria-labelledby="jw-h">
          <div className="wrap join-why-grid">
            <div>
              <p className="eyebrow">Why your membership matters</p>
              <h2 className="sec-title" id="jw-h">More than a card. A share in everything we do.</h2>
              <ol className="jw-list">{giving.reasons.slice(0, 3).map((r) => <li key={r.title}><b>{r.title}</b><span>{r.text}</span></li>)}</ol>
              <div className="jw-totals">{giving.totals.slice(0, 2).map((t) => <p key={t.label}><b>{t.value}</b><span>{t.label}</span></p>)}</div>
              <Link className="jw-link" href="/impact">See how the community helped →</Link>
            </div>
            {verse && (
              <figure className="jw-verse">
                <p className="verse-ar" lang="ar" dir="rtl">{verse.arabic}</p>
                <blockquote><p>&ldquo;{verse.english}&rdquo;</p></blockquote>
                <figcaption>Quran {verse.ref} · {verse.translation}</figcaption>
              </figure>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
