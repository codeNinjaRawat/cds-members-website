'use client';
/**
 * Home hero – stylized Greater Houston: rings (610 Loop, Beltway 8, Grand Parkway), radial freeways,
 * five zone wedges converging downtown (Bylaws), one star per Islamic Center. Zones + centers come from admin.
 * Interactive: hover / focus / tap a zone to see its centers. Map is illustrative, not to scale.
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Home } from '@/lib/content/home';

const C = 300, R = 285;
const pt = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [+(C + r * Math.cos(a)).toFixed(2), +(C + r * Math.sin(a)).toFixed(2)];
};
// Deterministic pseudo-random so server and client render the same positions (no hydration mismatch)
function seeded(seed: number) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

type Props = { hero: Home['hero']; zones: Home['zones']; card: { name: string; memberId: string; center: string; validThrough: string; tag: string } };

export function HeroZones({ hero, zones, card }: Props) {
  const [active, setActive] = useState<string | null>(null);
  const total = zones.reduce((n, z) => n + z.centers.length, 0);

  const geometry = useMemo(() => {
    const rnd = seeded(7);
    let delay = 1.1;
    return zones.map((z) => {
      const [x1, y1] = pt(z.fromDeg, R), [x2, y2] = pt(z.toDeg, R);
      const large = z.toDeg - z.fromDeg > 180 ? 1 : 0;
      const [lx, ly] = pt((z.fromDeg + z.toDeg) / 2, 214);
      const stars = z.centers.map((name) => {
        const a = z.fromDeg + 8 + rnd() * (z.toDeg - z.fromDeg - 16), r = 60 + rnd() * 190;
        const [x, y] = pt(a, r);
        delay += 0.05;
        return { name, x, y, delay: +delay.toFixed(2) };
      });
      return { ...z, d: `M${C},${C} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`, lx, ly, stars };
    });
  }, [zones]);

  const activeZone = geometry.find((z) => z.id === active);

  return (
    <section className="hero" data-hero aria-label="Introduction">
      <div className="wrap hero-grid">
        <div>
          <h1>{hero.title}</h1>
          <p className="lead">{hero.lead}</p>
          <div className="cta">
            <Link className="btn hero-primary" href={hero.primary.href}>{hero.primary.label}</Link>
            <Link className="btn hero-secondary" href={hero.secondary.href}>{hero.secondary.label}</Link>
          </div>
        </div>
        <div className="map-wrap" onMouseLeave={() => setActive(null)}>
          <div className="zone-info" aria-live="polite">
            {activeZone ? (
              <><b>{activeZone.name}</b>{activeZone.centers.length} Islamic Centers in this zone</>
            ) : (
              <><b>Greater Houston</b>{hero.mapHint}</>
            )}
          </div>
          <svg className="map" viewBox="0 0 600 600" role="group" aria-label={`Stylized map of Greater Houston with ${zones.length} ISGH zones and ${total} Islamic Centers`}>
            <g>
              {geometry.map((z) => (
                <path key={z.id} className={`zone${active === z.id ? ' active' : ''}`} d={z.d} tabIndex={0} role="button"
                  aria-pressed={active === z.id} aria-label={`${z.name} zone, ${z.centers.length} Islamic Centers`}
                  onMouseEnter={() => setActive(z.id)} onFocus={() => setActive(z.id)} onClick={() => setActive(z.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(z.id); } }} />
              ))}
            </g>
            <circle className="ring" cx="300" cy="300" r="78" /><circle className="ring" cx="300" cy="300" r="165" /><circle className="ring" cx="300" cy="300" r="262" />
            <g aria-hidden="true">
              {[18, 62, 100, 145, 192, 238, 262, 285, 330].map((a) => {
                const [x0, y0] = pt(a, 20), [x, y] = pt(a, 295);
                return <line key={a} className="road" x1={x0} y1={y0} x2={x} y2={y} />;
              })}
              {geometry.flatMap((z) => z.stars.map((s) => (
                <use key={z.id + s.name} href="#star8" className="center-dot" x={s.x - 8} y={s.y - 8} width={16} height={16} style={{ animationDelay: `${s.delay}s` }} />
              )))}
              {geometry.map((z) => <text key={z.id} className="zone-label" x={z.lx} y={z.ly} textAnchor="middle">{z.name}</text>)}
            </g>
          </svg>
          <div className="glass-card" aria-label="Example digital member card">
            <div className="row"><svg width="30" height="30" aria-hidden="true" style={{ color: 'var(--hero-accent)' }}><use href="#star8" /></svg><span className="tag">{card.tag}</span></div>
            <div className="name">{card.name}</div>
            <div className="meta"><div><span>Member ID</span>{card.memberId}</div><div><span>Zone</span>{card.center}</div><div><span>Valid through</span>{card.validThrough}</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
