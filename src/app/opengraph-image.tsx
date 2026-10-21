/** O2.4 – default share card for pages without their own image. */
import { ImageResponse } from 'next/og';
import { getSiteConfig } from '@/lib/site-config/get-site-config';

export const dynamic = 'force-dynamic';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Organization';

export default async function Image() {
  const site = await getSiteConfig();
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 64, background: 'linear-gradient(135deg, #0E5A45 0%, #0B3B2E 100%)', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.05, display: 'flex' }}>{site.org.name}</div>
      <div style={{ fontSize: 32, marginTop: 16, opacity: .85, display: 'flex' }}>Prayer times · Masajid · Events · Membership · Giving</div>
    </div>,
    { ...size },
  );
}
