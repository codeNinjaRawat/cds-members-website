'use client';
/**
 * "Classic" home hero (owner's pick, 2026-10-13): headline + buttons on the left, digital member card and
 * live June 30 countdown on the right, Islamic 8-point lattice texture. Texts from CMS, deadline from settings.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Home } from '@/lib/content/home';
import type { MembershipSettings } from '@/lib/content/membership';

type Props = { hero: Home['hero']; classic: NonNullable<Home['classicHero']>; settings: MembershipSettings; centerName: string };

export function ClassicHero({ hero, classic, settings, centerName }: Props) {
  const deadline = Date.parse(settings.recordDate);
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setDays(Math.max(0, Math.ceil((deadline - Date.now()) / 864e5)));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);
  const dl = new Date(settings.recordDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: settings.timezone });

  return (
    <section className="classic-hero" aria-label="Introduction">
      <svg className="classic-lattice" width="100%" height="100%" aria-hidden="true">
        <defs>
          <pattern id="lattice" width="80" height="80" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="20" y="20" width="40" height="40" />
              <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
              <path d="M0 40 H11.7 M68.3 40 H80 M40 0 V11.7 M40 68.3 V80" />
              <circle cx="0" cy="0" r="11.7" /><circle cx="80" cy="0" r="11.7" /><circle cx="0" cy="80" r="11.7" /><circle cx="80" cy="80" r="11.7" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lattice)" />
      </svg>
      <div className="wrap classic-grid">
        <div>
          <h1>{classic.title}</h1>
          <p className="lead">{classic.lead}</p>
          <div className="cta">
            <Link className="btn btn-primary" href={hero.primary.href}>{hero.primary.label}</Link>
            <Link className="btn btn-outline" href={hero.secondary.href}>{hero.secondary.label}</Link>
          </div>
        </div>
        <div className="card-stack">
          <div className="member-card" aria-label="Example digital member card">
            <svg className="card-star" viewBox="0 0 100 100" aria-hidden="true"><use href="#star8" /></svg>
            <div className="mc-top"><div className="mc-org">ISGH<small>Member card {settings.year}</small></div><span className="mc-pill">Voting eligible</span></div>
            <div className="mc-name">Aisha Rahman</div>
            <div className="mc-meta">
              <div><span>Member ID</span>HOU-204781</div>
              <div><span>Islamic Center</span>{centerName}</div>
              <div><span>Expires</span>12/31/{settings.year}</div>
            </div>
          </div>
          <div className="countdown">
            <strong aria-live="polite">{days ?? '—'}</strong>
            <p><b>days left</b> to renew and vote in the {settings.year} elections. Deadline: {dl}.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
