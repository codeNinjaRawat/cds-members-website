/** Tiny inline formatting for admin text: **bold** and [label](href). Nothing else – no HTML from the CMS. */
import Link from 'next/link';
import type { ReactNode } from 'react';

const RE = /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:\/|https?:\/\/|mailto:|tel:)[^)\s]+\))/g;
const SAFE = /^(\/|https?:\/\/|mailto:|tel:)/;

export function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0; let i = 0;
  for (const m of text.matchAll(RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(<strong key={i++}>{tok.slice(2, -2)}</strong>);
    else {
      const label = tok.slice(1, tok.indexOf(']('));
      const href = tok.slice(tok.indexOf('](') + 2, -1);
      if (!SAFE.test(href)) out.push(label);
      else if (href.startsWith('/')) out.push(<Link key={i++} href={href}>{label}</Link>);
      else out.push(<a key={i++} href={href} rel={href.startsWith('http') ? 'noopener' : undefined} target={href.startsWith('http') ? '_blank' : undefined}>{label}</a>);
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Paragraph text may contain blank lines → several <p>. */
export function paragraphs(text: string): ReactNode[] {
  return text.split(/\n\s*\n/).filter((t) => t.trim()).map((t, i) => <p key={i}>{inline(t.trim())}</p>);
}
