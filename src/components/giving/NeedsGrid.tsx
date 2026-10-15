'use client';
/**
 * "Who still needs help" – cases published by admins (CMS › Giving › Needs).
 * Dignity first: anonymized cases never show names, faces or exact places; stock photos are labeled.
 * Optional filters by category; urgent cases first, fully funded last.
 */
import { useMemo, useState } from 'react';
import { formatUSD } from '@/lib/content/membership';
import { NEED_LABEL, percent, STATUS_LABEL, type Need } from '@/lib/content/giving';
import { Photo } from '@/components/ui/Photo';
import { GiveDialog } from './GiveDialog';

const ORDER: Record<Need['status'], number> = { urgent: 0, open: 1, ongoing: 2, met: 3 };

export function NeedsGrid({ needs, showProgress = true, filters = false, limit }: { needs: Need[]; showProgress?: boolean; filters?: boolean; limit?: number }) {
  const [cat, setCat] = useState<Need['category'] | 'all'>('all');
  const [active, setActive] = useState<Need | null>(null);
  const cats = useMemo(() => Array.from(new Set(needs.map((n) => n.category))), [needs]);
  const list = needs.filter((n) => cat === 'all' || n.category === cat).sort((a, b) => ORDER[a.status] - ORDER[b.status]).slice(0, limit);

  return (
    <>
      {filters && cats.length > 1 && (
        <div className="need-filters" role="group" aria-label="Filter by type">
          <button type="button" className="chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All ({needs.length})</button>
          {cats.map((c) => (
            <button key={c} type="button" className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{NEED_LABEL[c]}</button>
          ))}
        </div>
      )}
      <ul className="need-grid" aria-live="polite">
        {list.map((n) => {
          const pct = percent(n);
          return (
            <li key={n.id} className={`need-card s-${n.status}`}>
              <div className="need-media">
                <Photo image={n.image} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px" />
                <div className="need-tags">
                  <span className={`tag t-${n.status}`}>{STATUS_LABEL[n.status]}</span>
                  {n.zakatEligible && <span className="tag t-zakat">Zakat eligible</span>}
                  {n.sample && <span className="tag t-sample" title="Demo content – admins replace it with verified cases">Sample</span>}
                </div>
                {n.stockPhoto && <span className="illus">Illustrative photo</span>}
              </div>
              <div className="need-body">
                <p className="need-cat">{NEED_LABEL[n.category]}{n.zone ? ` · ${n.zone} zone` : ''}</p>
                <h3>{n.title}</h3>
                <p className="need-sum">{n.summary}</p>
                {showProgress && pct !== null && (
                  <div className="need-progress">
                    <div className="bar" role="progressbar" aria-label={`${n.title}: funded`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div>
                    <p><b>{formatUSD(n.raisedCents ?? 0)}</b> of {formatUSD(n.goalCents!)} · {pct}%{n.donors ? ` · ${n.donors} donors` : ''}</p>
                  </div>
                )}
                {n.status === 'ongoing' && <p className="need-ongoing">Ongoing need – monthly gifts help most.</p>}
                <div className="need-foot">
                  {n.verifiedBy && <span className="verified"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>Verified by {n.verifiedBy}</span>}
                  {n.source && <a className="src" href={n.source.url} target="_blank" rel="noopener noreferrer">Source: {n.source.label}</a>}
                </div>
                {n.status === 'met'
                  ? <p className="need-met">Fully funded – thank you.</p>
                  : <button type="button" className="btn btn-primary need-give" onClick={() => setActive(n)}>Give to this need</button>}
              </div>
            </li>
          );
        })}
      </ul>
      <GiveDialog need={active} onClose={() => setActive(null)} />
    </>
  );
}
