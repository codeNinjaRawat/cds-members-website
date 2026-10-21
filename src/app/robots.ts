/** O2.5 – /robots.txt. Preview servers (ISGH_NOINDEX=true) block everything; otherwise member and admin-preview areas stay out. */
import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  if (process.env.ISGH_NOINDEX === 'true') return { rules: { userAgent: '*', disallow: '/' } };
  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('host') ?? 'localhost:3000'}`;
  return { rules: { userAgent: '*', allow: '/', disallow: ['/portal', '/sign-in', '/pay', '/api', '/search', '/*?preview=1', '/masjid/*/screen'] }, sitemap: `${origin}/sitemap.xml` };
}
