/**
 * Renders a CMS page composed by admins (O1): static blocks + live blocks, three templates (article / landing / hub),
 * per-block width, members-only gate. Unknown block types are skipped safely.
 */
import { Photo } from '@/components/ui/Photo';
import { isLiveBlock, type Block, type Page } from '@/lib/content/pages';
import { blockWidth, liveReason } from '@/lib/content/page-rules';
import { StaticBlockView } from './blocks/StaticBlocks';
import { LiveBlockView } from './blocks/LiveBlocks';
import { MembersGate } from './MembersGate';

function BlockView({ b, page }: { b: Block; page: Page }) {
  return isLiveBlock(b) ? <LiveBlockView b={b} page={page} /> : <StaticBlockView b={b} />;
}
const updated = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00-05:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export function PageView({ page, preview = false }: { page: Page; preview?: boolean }) {
  const t = page.template;
  const reason = liveReason(page);
  const body = (
    <div className={`cms-body cms-body-${t}`}>
      {page.blocks.map((b, i) => (
        <section key={i} className={`blk blk-${b.type}`} data-width={blockWidth(b, t)}><div className="blk-in">
          <BlockView b={b} page={page} />
        </div></section>
      ))}
      <p className="updated blk-in" data-width="narrow">Last updated {updated(page.updatedAt)}</p>
    </div>
  );
  return (
    <article className={`cms-page cms-${t}`} data-scope={page.scope.kind}>
      {t === 'landing' && page.image ? (
        <header className="cms-hero">
          <Photo image={page.image} sizes="100vw" className="cms-hero-bg" priority />
          <div className="wrap cms-hero-in">{reason && preview && <p className="draft-badge">{reason}</p>}<h1>{page.title}</h1>{page.intro && <p className="intro">{page.intro}</p>}</div>
        </header>
      ) : (
        <div className={`wrap ${t === 'article' ? 'narrow' : ''}`}>
          <header className="cms-head">
            {reason && <p className="draft-badge">{reason}</p>}
            <h1>{page.title}</h1>
            {page.intro && <p className="intro">{page.intro}</p>}
          </header>
          {page.image && <Photo image={page.image} sizes="(max-width: 800px) 100vw, 980px" className="cms-hero-img" priority showCredit />}
        </div>
      )}
      <div className="wrap">
        {page.visibility === 'members' ? <MembersGate>{body}</MembersGate> : body}
      </div>
    </article>
  );
}
