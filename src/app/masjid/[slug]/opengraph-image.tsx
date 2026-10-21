/** O2.4 – share card for a masjid (WhatsApp / Facebook preview): name, zone, address, next Jumuah. */
import { ImageResponse } from 'next/og';
import { getOrgStructure } from '@/lib/content/loaders';
import { fmtTime } from '@/lib/community/org-structure';
import { resolveMasjid } from '@/lib/masjid/masjid-site';
import { getSiteConfig } from '@/lib/site-config/get-site-config';

export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Masjid';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [map, site] = await Promise.all([getOrgStructure(), getSiteConfig()]);
  const r = resolveMasjid(map, slug);
  const name = r?.center.name ?? site.org.shortName;
  const line2 = r ? [r.zone?.name, r.center.address.city].filter(Boolean).join(' · ') : '';
  const jum = r?.center.jumuah.length ? `Jumuah ${r.center.jumuah.map((j) => fmtTime(j.khutbah)).join(' · ')}` : '';
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 64, background: 'linear-gradient(135deg, #0E5A45 0%, #0B3B2E 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 28, opacity: .8, display: 'flex' }}>{site.org.shortName}</div>
      <div style={{ fontSize: name.length > 28 ? 60 : 76, fontWeight: 700, lineHeight: 1.05, marginTop: 8, display: 'flex' }}>{name}</div>
      {line2 && <div style={{ fontSize: 32, marginTop: 18, opacity: .9, display: 'flex' }}>{line2}</div>}
      {jum && <div style={{ fontSize: 32, marginTop: 10, color: '#F1BA4A', display: 'flex' }}>{jum}</div>}
    </div>,
    { ...size },
  );
}
