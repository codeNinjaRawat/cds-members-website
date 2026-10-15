/**
 * Root layout. Loads the ADMIN-CONTROLLED site config + theme from the BE (or mock),
 * injects theme CSS variables, and renders the shared layout (announcement, header, footer).
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Amiri, Bricolage_Grotesque, Public_Sans } from 'next/font/google';
import './globals.css';
import { getSiteConfig } from '@/lib/site-config/get-site-config';
import { DEFAULT_BRANDING } from '@/lib/site-config/schema';
import { getThemeCss } from '@/lib/theme/get-theme';
import { makeModeScript } from '@/lib/theme/mode-script';
import { getHome } from '@/lib/content/loaders';
import { isOn } from '@/lib/flags/flags';
import { t } from '@/content/en-US/common';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { isWithinWindow } from '@/lib/site-config/announcement';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { withVersion } from '@/components/layout/Brand';
import { PreviewBridge } from '@/components/admin-preview/PreviewBridge';
import { NavProgress } from '@/components/ui/NavProgress';
import { currentTenant } from '@/lib/api/demo-store';
import { TenantClosed } from '@/components/layout/TenantClosed';

const display = Bricolage_Grotesque({ subsets: ['latin'], axes: ['opsz', 'wdth'], variable: '--font-bricolage', display: 'swap' });
const body = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans', display: 'swap' });
/** Quran verses (CMS › Giving) – Arabic naskh face; only the Arabic subset is downloaded */
const arabic = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri', display: 'swap' }); // theme --font-arabic stays the admin fallback

export async function generateMetadata(): Promise<Metadata> {
  const { org, branding = DEFAULT_BRANDING } = await getSiteConfig();
  const v = (src: string) => withVersion(src, branding.version); // data: URLs (admin demo uploads) stay as-is
  return {
    // Favicons, app icons and share image come from admin › Branding (uploaded files)
    icons: {
      icon: [{ url: v(branding.faviconIco), sizes: '48x48' }, { url: v(branding.favicon), type: 'image/svg+xml' }],
      apple: [{ url: v(branding.appleTouchIcon), sizes: '180x180' }],
    },
    manifest: branding.manifest,
    openGraph: { images: [{ url: v(branding.ogImage), width: 1200, height: 630, alt: org.productName }] },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: `${org.productName} – ${org.name}`, template: `%s – ${org.productName}` },
    description: `Join or renew your ${org.shortName} membership, check your voting eligibility, and find your Islamic Center in Greater Houston.`,
  };
}

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '');

export async function generateViewport() {
  const { branding = DEFAULT_BRANDING } = await getSiteConfig();
  return { themeColor: branding.themeColor };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  // SaaS: an address that belongs to no organization, or a suspended / cancelled one, gets a plain notice page
  const { tenant } = await currentTenant();
  if (!tenant || tenant.status === 'suspended' || tenant.status === 'cancelled') {
    return <html lang="en-US" className={`${display.variable} ${body.variable}`}><body><TenantClosed name={tenant?.name} reason={!tenant ? 'unknown' : tenant.status === 'suspended' ? 'suspended' : 'cancelled'} email={tenant?.email} /></body></html>;
  }
  const [config, home] = await Promise.all([getSiteConfig(), getHome()]);
  const themeCss = await getThemeCss(config.theme.active);
  const a = config.announcement;
  const showAnnouncement = !!a && isOn(config, 'site.announcement') && isWithinWindow(a);
  // Hide a dismissed announcement before first paint (mode script sets html[data-dismissed])
  const dismissCss = a ? `html[data-dismissed~="${safeId(a.id)}"] #announcement{display:none}` : '';

  return (
    <html lang="en-US" data-theme={config.theme.active} data-mode={config.theme.defaultMode === 'dark' ? 'dark' : 'light'} className={`${display.variable} ${body.variable} ${arabic.variable}`} suppressHydrationWarning>
      <head>
        <style id="isgh-theme" dangerouslySetInnerHTML={{ __html: themeCss + dismissCss }} />
        <script dangerouslySetInnerHTML={{ __html: makeModeScript(config.theme.defaultMode) }} />
      </head>
      <body>
        <NavProgress />
        <a className="skip-link" href="#main">{t.skipToContent}</a>
        {showAnnouncement && a && <AnnouncementBar announcement={a} />}
        <SiteHeader
          productName={config.org.productName}
          nav={config.nav}
          actions={config.actions}
          showThemeToggle={config.theme.allowUserModeToggle && isOn(config, 'site.themeToggle')}
          heroRoutes={home.layout === 'zones' ? ['/'] : []}
          branding={config.branding}
        />
        <main id="main" tabIndex={-1}>{children}</main>
        <SiteFooter config={config} />
        <PreviewBridge />
      </body>
    </html>
  );
}
