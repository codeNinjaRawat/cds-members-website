'use client';
/**
 * Quran verse band (admin: CMS › Giving › Verses). Arabic + English + reference, one verse at a time.
 * Auto-advances every 10 s only when the admin allows it, the visitor has not asked for reduced motion,
 * and nobody is hovering/focusing it (WCAG 2.2.2 Pause, Stop, Hide – there is also a pause button).
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ImageRef } from '@/lib/content/home';
import type { Verse } from '@/lib/content/giving';
import { Photo } from '@/components/ui/Photo';

const quranUrl = (ref: string) => `https://quran.com/${ref.replace(':', '/')}`;

type Props = { verses: Verse[]; image?: ImageRef; rotate?: boolean; eyebrow?: string; cta?: { label: string; href: string } };

export function VerseBand({ verses, image, rotate = true, eyebrow = 'Why we give', cta }: Props) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [motionOk, setMotionOk] = useState(false);
  const v = verses[i % verses.length];

  useEffect(() => { setMotionOk(!window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);
  useEffect(() => {
    if (!rotate || paused || hold || !motionOk || verses.length < 2) return;
    const t = setTimeout(() => setI((x) => (x + 1) % verses.length), 10000);
    return () => clearTimeout(t);
  }, [i, rotate, paused, hold, motionOk, verses.length]);

  if (!v) return null;
  const go = (d: number) => setI((x) => (x + d + verses.length) % verses.length);

  return (
    <section className="verse-band" aria-roledescription="carousel" aria-label="Verses from the Quran about giving"
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)} onFocus={() => setHold(true)} onBlur={() => setHold(false)}>
      {image && <Photo image={image} sizes="100vw" className="verse-bg" />}
      <div className="wrap verse-inner">
        <p className="verse-eyebrow"><svg width="16" height="16" aria-hidden="true"><use href="#star8" /></svg>{eyebrow}</p>
        <figure className="verse" key={v.id} aria-roledescription="slide" aria-label={`Quran ${v.ref}`}>
          <p className="verse-ar" lang="ar" dir="rtl">{v.arabic}</p>
          <blockquote className="verse-en"><p>&ldquo;{v.english}&rdquo;</p></blockquote>
          <figcaption>
            <a href={quranUrl(v.ref)} target="_blank" rel="noopener noreferrer">Quran {v.ref} · Surah {v.surah}</a>
            <span>Translation: {v.translation}</span>
          </figcaption>
        </figure>
        <div className="verse-controls">
          <button type="button" className="v-btn" onClick={() => go(-1)} aria-label="Previous verse">‹</button>
          <ol className="v-dots">
            {verses.map((x, k) => (
              <li key={x.id}><button type="button" aria-label={`Show Quran ${x.ref}`} aria-current={k === i || undefined} onClick={() => setI(k)} /></li>
            ))}
          </ol>
          <button type="button" className="v-btn" onClick={() => go(1)} aria-label="Next verse">›</button>
          {rotate && motionOk && verses.length > 1 && (
            <button type="button" className="v-pause" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button>
          )}
          {cta && <Link className="btn btn-highlight btn-sm verse-cta" href={cta.href}>{cta.label}</Link>}
        </div>
      </div>
    </section>
  );
}
