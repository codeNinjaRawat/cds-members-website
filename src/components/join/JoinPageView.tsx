/** Become-a-member page (server-safe view). Data loaded in app/membership/join/page.tsx. */
import Link from 'next/link';
import type { MembershipSettings } from '@/lib/content/membership';
import type { ImageRef } from '@/lib/content/home';
import { Photo } from '@/components/ui/Photo';
import { JoinFlow } from './JoinFlow';
import { defaultJoinForm, type JoinForm } from '@/lib/join/form-def';
import type { Giving } from '@/lib/content/giving';
import type { OrgConfig } from '@/lib/community/org-config';

type Props = { settings: MembershipSettings; form?: JoinForm; initialPlan?: string; mockMode?: boolean; images?: ImageRef[]; giving?: Giving; config?: OrgConfig };

export function JoinPageView({ settings, form = defaultJoinForm, initialPlan, mockMode, images = [], giving, config }: Props) {
  const verse = giving?.verses.find((v) => v.ref === '3:92') ?? giving?.verses[0];
  return (
    <div className="join-page">
      <section className="join-hero">
        <div className="wrap join-hero-grid">
          <div>
            <h1>Become a member</h1>
            <p className="join-lead">Join the Islamic Society of Greater Houston in about five minutes. Your membership supports {settings.serviceArea.label}&apos;s Islamic Centers and gives you a voice in ISGH elections.</p>
            <ul className="join-facts">
              <li>Membership runs January 1 to December 31, {settings.year}.</li>
              <li>Pay by June 30 to vote in that year&apos;s elections.</li>
              <li>{config?.payments.check ? 'Card, Apple Pay, Google Pay or check.' : 'Card, Apple Pay or Google Pay.'} Receipt by email.</li>
            </ul>
            <p className="join-already">Already a member? <Link href="/sign-in">Sign in</Link> or <Link href="/membership/renew">renew</Link>.</p>
          </div>
          {images.length > 0 && (
            <div className="join-photos" aria-hidden={false}>
              {images.slice(0, 3).map((img, i) => <Photo key={img.src} image={img} sizes="(max-width: 900px) 33vw, 220px" className={`jp jp${i}`} />)}
            </div>
          )}
        </div>
      </section>
      <div className="wrap">
        <JoinFlow settings={settings} form={form} initialPlan={initialPlan} mockMode={mockMode} config={config} />
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
