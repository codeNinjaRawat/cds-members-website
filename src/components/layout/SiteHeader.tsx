'use client';
/**
 * Site header – admin: CMS › Menus (nav items, dropdown descriptions, Sign in / Join buttons)
 * + flags ("site.themeToggle"). Floats as glass over the home hero (element with [data-hero]),
 * solid everywhere else. Menus follow the WAI-ARIA disclosure pattern.
 */
import Link from 'next/link';
import { MyMasjidLink } from './MyMasjid';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import type { Link as LinkT, NavItem } from '@/lib/site-config/schema';
import { t } from '@/content/en-US/common';
import { ChevronIcon, MenuIcon } from './icons';
import { BrandMark } from './Brand';
import type { Branding } from '@/lib/site-config/schema';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';
import { useSignedInName } from '@/lib/demo/demo-member';

export type SiteHeaderProps = {
  productName: string;
  nav: NavItem[];
  actions: { signIn: LinkT; join: LinkT };
  showThemeToggle: boolean;
  branding?: Branding;
  /** Routes whose first section is a dark hero (header floats as glass over it). */
  heroRoutes?: string[];
};

const isActive = (pathname: string, href?: string) =>
  !!href && href !== '/' && (pathname === href || pathname.startsWith(href + '/'));

export function SiteHeader({ productName, nav, actions, showThemeToggle, heroRoutes = ['/'], branding }: SiteHeaderProps) {
  const pathname = usePathname() || '/';
  const member = useSignedInName();
  const signIn = member ? { label: 'My membership', href: '/portal' } : actions.signIn;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const overHero = heroRoutes.includes(pathname);
  const [solid, setSolid] = useState(!overHero);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  // Glass over a hero, solid after it scrolls away
  useEffect(() => {
    const hero = overHero ? document.querySelector('[data-hero]') : null;
    if (!hero || !('IntersectionObserver' in window)) { setSolid(true); return; }
    setSolid(false);
    const io = new IntersectionObserver(([e]) => setSolid(!e.isIntersecting), { rootMargin: '-90px 0px 0px 0px' });
    io.observe(hero);
    return () => io.disconnect();
  }, [pathname, overHero]);

  // Close dropdowns on route change
  useEffect(() => { setOpenIndex(null); setMobileOpen(false); }, [pathname]);

  const close = useCallback((focusButton = false) => {
    setOpenIndex((current) => {
      if (focusButton && current !== null) {
        navRef.current?.querySelector<HTMLButtonElement>(`button[data-index="${current}"]`)?.focus();
      }
      return null;
    });
  }, []);

  // Escape and outside click close the open dropdown
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') close(true); };
    const onClick = (e: MouseEvent) => { if (!navRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick); };
  }, [openIndex, close]);

  const closeMobile = useCallback(() => { setMobileOpen(false); menuBtnRef.current?.focus(); }, []);

  const panelId = (i: number) => `${baseId}-dd-${i}`;

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpenIndex(i);
      requestAnimationFrame(() => document.getElementById(panelId(i))?.querySelector<HTMLAnchorElement>('a')?.focus());
    }
  };

  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const links = Array.from(e.currentTarget.querySelectorAll<HTMLAnchorElement>('a'));
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % links.length : (i - 1 + links.length) % links.length;
    links[next]?.focus();
  };

  const onItemBlur = (e: FocusEvent<HTMLLIElement>, i: number) => {
    if (openIndex === i && !e.currentTarget.contains(e.relatedTarget as Node)) setOpenIndex(null);
  };

  return (
    <>
      <header className={`site-header${solid ? ' is-solid' : ''}`} id="site-header" data-variant={overHero ? 'over-hero' : 'solid'}>
        <div className="wrap">
          <div className="nav-shell">
            <Link className="brand" href="/" aria-label={`${productName} home`}><BrandMark branding={branding} /><span>{productName}</span></Link>

            <nav aria-label={t.mainNav}>
              <ul className="nav-list" ref={navRef}>
                {nav.map((item, i) =>
                  item.children?.length ? (
                    <li key={item.label} onBlur={(e) => onItemBlur(e, i)}>
                      <button className="nav-link" type="button" data-index={i}
                        aria-expanded={openIndex === i} aria-controls={panelId(i)}
                        onClick={() => setOpenIndex(openIndex === i ? null : i)}
                        onKeyDown={(e) => onButtonKey(e, i)}>
                        {item.label}<ChevronIcon />
                      </button>
                      <div className="dropdown" id={panelId(i)} hidden={openIndex !== i} onKeyDown={onPanelKey}>
                        {item.children.map((c) => (
                          <Link key={c.href} href={c.href} aria-current={isActive(pathname, c.href) ? 'page' : undefined}
                                onClick={() => setOpenIndex(null)}>
                            <b>{c.label}</b>{c.description && <span>{c.description}</span>}
                          </Link>
                        ))}
                      </div>
                    </li>
                  ) : (
                    <li key={item.label}>
                      <Link className="nav-link" href={item.href ?? '#'} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
                        {item.label}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </nav>

            <div className="header-actions">
              <MyMasjidLink />
              <Link className="header-search" href="/search" aria-label="Search the site"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg></Link>
              {showThemeToggle && <ThemeToggle />}
              <Link className="btn btn-outline btn-sm signin" href={signIn.href}>{signIn.label}</Link>
              <Link className="btn btn-primary btn-sm join" href={actions.join.href}>{actions.join.label}</Link>
              <button ref={menuBtnRef} className="icon-btn menu-btn" id="menuBtn" type="button"
                aria-expanded={mobileOpen} aria-controls="mobileMenu" onClick={() => setMobileOpen(true)}>
                <MenuIcon /><span className="sr-only">{t.openMenu}</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu open={mobileOpen} productName={productName} nav={nav} actions={{ ...actions, signIn }} onClose={closeMobile} branding={branding} />
    </>
  );
}
