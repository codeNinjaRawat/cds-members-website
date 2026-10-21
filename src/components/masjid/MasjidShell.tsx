/** O3 – the band + chip menu above every masjid route. Server component; accent color from the profile. */
import Link from 'next/link';
import { Photo } from '@/components/ui/Photo';
import type { Resolved } from '@/lib/masjid/masjid-site';
import { addressOf, mapsUrl, masjidHref } from '@/lib/masjid/masjid-site';
import { RememberMasjid } from '@/components/layout/MyMasjid';
import { PrintButton } from '@/components/ui/PrintButton';

export function MasjidShell({ r, menu, current, children }: { r: Resolved; menu: { key: string; label: string; href: string }[]; current: string; children: React.ReactNode }) {
  const c = r.center; const p = c.profile;
  const ld = { '@context': 'https://schema.org', '@type': 'Mosque', name: c.name, alternateName: c.aka || undefined, telephone: c.phone || undefined, url: c.website || undefined, email: p.email || undefined,
    address: { '@type': 'PostalAddress', streetAddress: c.address.street, addressLocality: c.address.city, addressRegion: 'TX', postalCode: c.address.zip, addressCountry: 'US' }, image: p.photo?.src };
  return (
    <div className="masjid" data-accent={p.accent}>
      <RememberMasjid id={c.id} name={c.name} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <header className="masjid-band">
        {p.photo && <Photo image={p.photo} sizes="100vw" className="masjid-band-photo" priority />}
        <div className="wrap masjid-band-in">
          <p className="masjid-crumbs"><Link href="/masajid">Masajid</Link>{r.zone && <> · <Link href={`/zones/${r.zone.id}`}>{r.zone.name}</Link></>}</p>
          <h1 className="masjid-name">{c.name}</h1>
          {c.aka && <p className="masjid-aka">{c.aka}</p>}
          <p className="masjid-meta">
            {addressOf(c) && <a href={mapsUrl(c)} rel="noopener" target="_blank">{addressOf(c)} · Directions</a>}
            {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>{c.phone}</a>}
          </p>
        </div>
      </header>
      <nav className="masjid-nav" aria-label={`${c.name} pages`}>
        <div className="wrap"><ul>
          {menu.map((m) => <li key={m.key}><Link href={m.href} aria-current={m.key === current ? 'page' : undefined}>{m.label}</Link></li>)}
          <li><Link href={masjidHref(r.slug, 'screen')} className="masjid-nav-screen" aria-label="Lobby screen view">Screen</Link></li>
        </ul></div>
      </nav>
      {(current === 'prayer-times' || current === 'jumuah') && <div className="wrap masjid-tools"><PrintButton label="Print this page" /></div>}
      {children}
    </div>
  );
}
