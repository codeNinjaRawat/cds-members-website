'use client';
/** Light / dark / match-device toggle. Allowed only if admin flag "site.themeToggle" is on. */
import { useEffect, useState } from 'react';
import { MODE_STORAGE_KEY } from '@/lib/theme/mode-script';
import { t } from '@/content/en-US/common';
import { AutoIcon, MoonIcon, SunIcon } from './icons';

type Pref = 'system' | 'light' | 'dark';
const ORDER: Pref[] = ['system', 'light', 'dark'];

function apply(pref: Pref) {
  const dark = pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.mode = dark ? 'dark' : 'light';
  document.documentElement.dataset.modePref = pref;
}

export function ThemeToggle() {
  const [pref, setPref] = useState<Pref>('system');

  useEffect(() => {
    const stored = (document.documentElement.dataset.modePref as Pref) || 'system';
    setPref(ORDER.includes(stored) ? stored : 'system');
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (document.documentElement.dataset.modePref === 'system') apply('system'); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const next = () => {
    const p = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    try { localStorage.setItem(MODE_STORAGE_KEY, p); } catch { /* storage unavailable */ }
    apply(p);
    setPref(p);
  };

  const label = t.theme[pref];
  return (
    <button className="icon-btn" id="modeBtn" type="button" onClick={next} title={`${label} (${t.theme.hint})`}>
      {pref === 'system' ? <AutoIcon /> : pref === 'light' ? <SunIcon /> : <MoonIcon />}
      <span className="sr-only">{label}</span>
    </button>
  );
}
