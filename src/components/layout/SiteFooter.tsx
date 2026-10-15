/**
 * Site footer – everything admin-controlled:
 *   CMS › Footer: call-to-action card, link columns, social links, legal links, newsletter texts, tagline
 *   Settings › Organization: name, address, phone, email, office hours (live open/closed in Houston time), map link, 501(c)(3) note
 *   Flags: cms.newsletter
 * Smart bits: CTA with live June 30 countdown (hidden on the join page), "Open now" badge, one-tap
 * "Was this page helpful?", back to top. Links to external sites open in a new tab and say so.
 */
import Link from 'next/link';
import type { SiteConfig } from '@/lib/site-config/schema';
import { isOn } from '@/lib/flags/flags';
import { t } from '@/content/en-US/common';
import { NewsletterForm } from './NewsletterForm';
import { BrandMark } from './Brand';
import { BackToTop, FooterCta, HelpfulWidget, OpenBadge } from './footer/FooterBits';

const isExternal = (href: string) => /^https?:\/\//.test(href);

function FLink({ href, label }: { href: string; label: string }) {
  return isExternal(href)
    ? <a href={href} target="_blank" rel="noopener noreferrer">{label}<span className="ext" aria-hidden="true">↗</span><span className="sr-only"> {t.opensNewTab}</span></a>
    : <Link href={href}>{label}</Link>;
}

const Icon = {
  phone: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor" /></svg>,
  mail: <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  pin: <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>,
  clock: <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
};

export function SiteFooter({ config }: { config: SiteConfig }) {
  const { org, footer } = config;
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer" id="site-footer">
      <div className="footer-pattern" aria-hidden="true" />
      <div className="wrap">
        {footer.cta && <FooterCta cta={footer.cta} />}

        <div className="footer-main">
          <div className="footer-org">
            <Link href="/" className="footer-brand">
              <BrandMark branding={config.branding} size={34} />
              <span>{org.productName}</span>
            </Link>
            <h2 className="sr-only">{org.name}</h2>
            {footer.tagline && <p className="tagline">{footer.tagline}</p>}
            <ul className="contact">
              <li>{Icon.phone}<a href={`tel:${org.phone.tel}`}>{org.phone.display}</a></li>
              <li>{Icon.mail}<a href={`mailto:${org.email}`}>{org.email}</a></li>
              <li>{Icon.pin}{footer.mapUrl
                ? <a href={footer.mapUrl} target="_blank" rel="noopener noreferrer">{org.address.join(', ')}<span className="sr-only"> (opens map in a new tab)</span></a>
                : <span>{org.address.join(', ')}</span>}</li>
              {footer.hoursLabel && <li>{Icon.clock}<span>{footer.hoursLabel}</span>{footer.hours && <OpenBadge hours={footer.hours} />}</li>}
            </ul>
            <div className="social" aria-label="ISGH on social media">
              {footer.social.map((s) => (
                <a key={s.href} href={s.href} rel="noopener noreferrer" target="_blank">{s.label}<span className="ext" aria-hidden="true">↗</span><span className="sr-only"> {t.opensNewTab}</span></a>
              ))}
            </div>
          </div>

          <nav className="footer-cols" aria-label="Footer">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <h3>{col.title}</h3>
                <ul>{col.links.map((l) => <li key={l.href + l.label}><FLink href={l.href} label={l.label} /></li>)}</ul>
              </div>
            ))}
          </nav>
        </div>

        {isOn(config, 'cms.newsletter') && footer.newsletter && <NewsletterForm {...footer.newsletter} />}

        <div className="footer-utility">
          <HelpfulWidget />
          <BackToTop />
        </div>

        <div className="footer-bottom">
          <p>{t.footer.rights(year, org.name)} {org.taxNote}</p>
          <ul>{footer.legal.map((l) => <li key={l.href}><FLink href={l.href} label={l.label} /></li>)}</ul>
        </div>
        <div className="wordmark" aria-hidden="true">{org.productName}</div>
      </div>
    </footer>
  );
}
