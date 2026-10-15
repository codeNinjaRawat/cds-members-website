'use client';
/** Full-screen mobile menu (≤1020px). Modal dialog: focus trap, Escape closes, page scroll locked. */
import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Link as LinkT, NavItem } from '@/lib/site-config/schema';
import { t } from '@/content/en-US/common';
import { ChevronIcon, CloseIcon } from './icons';
import { BrandMark } from './Brand';
import type { Branding } from '@/lib/site-config/schema';

type Props = { open: boolean; onClose: () => void; productName: string; nav: NavItem[]; actions: { signIn: LinkT; join: LinkT }; branding?: Branding };

export function MobileMenu({ open, onClose, productName, nav, actions, branding }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('locked');
    closeRef.current?.focus();
    const mq = matchMedia('(min-width: 1141px)');
    const onWide = (e: MediaQueryListEvent) => { if (e.matches) onClose(); };
    mq.addEventListener('change', onWide);
    return () => { document.body.classList.remove('locked'); mq.removeEventListener('change', onWide); };
  }, [open, onClose]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const f = Array.from(ref.current.querySelectorAll<HTMLElement>('a, button')).filter((el) => el.offsetParent !== null);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  };

  return (
    <div className="sheet" id="mobileMenu" role="dialog" aria-modal="true" aria-label={t.menu} hidden={!open} ref={ref} onKeyDown={onKeyDown}>
      <div className="sheet-top">
        <Link className="brand" href="/" onClick={onClose}><BrandMark branding={branding} /><span>{productName}</span></Link>
        <button ref={closeRef} className="icon-btn" id="sheetClose" type="button" onClick={onClose}>
          <CloseIcon /><span className="sr-only">{t.closeMenu}</span>
        </button>
      </div>
      <ul>
        {nav.map((item, i) => (
          <li key={item.label}>
            {item.children?.length ? (
              <>
                <button className="sheet-link" type="button" aria-expanded={expanded === i} aria-controls={`ms-${i}`}
                  onClick={() => setExpanded(expanded === i ? null : i)}>
                  {item.label}<ChevronIcon />
                </button>
                <div className="sub" id={`ms-${i}`} hidden={expanded !== i}>
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} onClick={onClose}>{c.label}{c.description && <span>{c.description}</span>}</Link>
                  ))}
                </div>
              </>
            ) : (
              <Link className="sheet-link" href={item.href ?? '#'} onClick={onClose}>{item.label}</Link>
            )}
          </li>
        ))}
      </ul>
      <div className="sheet-actions">
        <Link className="btn btn-primary" href={actions.join.href} onClick={onClose}>{actions.join.label}</Link>
        <Link className="btn btn-outline" href={actions.signIn.href} onClick={onClose}>{actions.signIn.label}</Link>
      </div>
    </div>
  );
}
