'use client';
/**
 * Live preview bridge for the admin app (module A8 theme editor).
 * Only active when this page is shown inside the admin's preview frame AND the message comes from the
 * configured admin origin. Applies an unsaved theme instantly; nothing is stored. Production: set
 * NEXT_PUBLIC_ISGH_ADMIN_ORIGIN to the admin domain (or leave empty to disable).
 */
import { useEffect } from 'react';
import { siblingOrigin } from '@/lib/platform/platform';

const ADMIN_ORIGIN = process.env.NEXT_PUBLIC_ISGH_ADMIN_ORIGIN ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

type Msg =
  | { type: 'isgh:preview-theme'; css: string; theme?: string; mode?: 'light' | 'dark' }
  | { type: 'isgh:preview-join-form'; form: unknown; step?: string }
  | { type: 'isgh:preview-clear' }
  | { type: 'isgh:reload' };

export function PreviewBridge() {
  useEffect(() => {
    // SaaS: each organization's admin lives at its own address (name-admin.<domain> / name.localhost:3001)
    const own = siblingOrigin(window.location.origin, 'admin');
    const allowed = [ADMIN_ORIGIN, own].filter(Boolean) as string[];
    if (!allowed.length || window.self === window.top) return;
    const onMsg = (e: MessageEvent<Msg>) => {
      if (!allowed.includes(e.origin) || !e.data || typeof e.data !== 'object') return;
      const html = document.documentElement;
      if (e.data.type === 'isgh:preview-theme' && typeof e.data.css === 'string' && !/<\/?style|<script/i.test(e.data.css)) {
        let el = document.getElementById('isgh-theme-preview') as HTMLStyleElement | null;
        if (!el) { el = document.createElement('style'); el.id = 'isgh-theme-preview'; document.head.appendChild(el); }
        el.textContent = e.data.css;
        if (e.data.theme && /^[a-z0-9-]+$/.test(e.data.theme)) html.dataset.theme = e.data.theme;
        if (e.data.mode === 'light' || e.data.mode === 'dark') html.dataset.mode = e.data.mode;
      } else if (e.data.type === 'isgh:preview-join-form') {
        // join form builder: the sign-up page checks the definition with its own schema before using it
        const step = typeof e.data.step === 'string' && /^(account|about|plan|pledge|review|s:[a-z0-9-]+)$/.test(e.data.step) ? e.data.step : undefined;
        window.dispatchEvent(new CustomEvent('isgh:join-form-preview', { detail: { form: e.data.form, step } }));
      } else if (e.data.type === 'isgh:preview-clear') {
        document.getElementById('isgh-theme-preview')?.remove();
      } else if (e.data.type === 'isgh:reload') {
        window.location.reload();
      }
    };
    window.addEventListener('message', onMsg);
    let parentOrigin = '';
    try { parentOrigin = document.referrer ? new URL(document.referrer).origin : ''; } catch { /* no referrer */ }
    for (const o of allowed) if (!parentOrigin || o === parentOrigin) window.parent.postMessage({ type: 'isgh:preview-ready', path: window.location.pathname }, o);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return null;
}
