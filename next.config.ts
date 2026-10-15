import type { NextConfig } from 'next';

/** Admin app may show the site in its live-preview frame (theme editor). Empty = no framing at all. */
const ADMIN_ORIGIN = process.env.ISGH_ADMIN_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');
/** SaaS: every organization's admin (name-admin.<base domain>) may frame its own website. Dev: name.localhost:3001. */
const BASE = process.env.PLATFORM_BASE_DOMAIN ?? 'nextgrow.pro';
const FRAMERS = [ADMIN_ORIGIN, `https://*.${BASE}`, process.env.NODE_ENV === 'production' ? '' : 'http://*.localhost:3001'].filter(Boolean).join(' ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Demo photos load from the Pexels CDN (free license). Remove once images are self-hosted / in the media library.
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.pexels.com', pathname: '/photos/**' }] },
  // Security headers – tighten CSP once BE/Stripe domains are final (see memory/20-integrations.md)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // replaces X-Frame-Options: DENY – same protection, but allows the admin preview frame
          { key: 'Content-Security-Policy', value: `frame-ancestors 'self' ${FRAMERS}` },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          // preview servers (demo content) must not appear in search results – set ISGH_NOINDEX=true there
          ...(process.env.ISGH_NOINDEX === 'true' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
