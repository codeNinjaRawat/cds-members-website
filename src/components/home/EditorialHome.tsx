/**
 * R6.5 – the "editorial" home layout: isgh.org's five quick actions reimagined, then live sections from the admin
 * modules (today's prayer strip, this week, masajid, services, programs, giving, news, election). Server component –
 * every live section is a live block rendered through the same views as CMS pages, so admins can also compose a
 * home page from blocks if they prefer.
 */
import Link from 'next/link';
import { Photo } from '@/components/ui/Photo';
import { LiveBlockView } from '@/components/cms/blocks/LiveBlocks';
import { StaticBlockView } from '@/components/cms/blocks/StaticBlocks';
import { HomeVerse } from '@/components/giving/GivingViews';
import { Closing } from './HomeSections';
import type { Home, HomeSection } from '@/lib/content/home';
import type { Giving } from '@/lib/content/giving';
import type { MembershipSettings } from '@/lib/content/membership';
import { PageSchema, type LiveBlock, type Page, type StaticBlock } from '@/lib/content/pages';

const orgPage = (): Page => PageSchema.parse({ slug: 'home', title: 'Home', updatedAt: new Date().toISOString().slice(0, 10), template: 'hub', blocks: [] });

function Section({ id, title, lead, more, children, tone }: { id: string; title?: string; lead?: string; more?: { label: string; href: string }; children: React.ReactNode; tone?: 'muted' | 'hero' }) {
  return (
    <section className={`ed-section ed-${id}`} data-tone={tone} aria-labelledby={title ? `ed-${id}-h` : undefined}>
      <div className="wrap">
        {(title || more) && (
          <header className="ed-head">
            <div>{title && <h2 id={`ed-${id}-h`}>{title}</h2>}{lead && <p>{lead}</p>}</div>
            {more && <Link className="ed-more" href={more.href}>{more.label} →</Link>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function EditorialHome({ home, settings, giving, sections }: { home: Home; settings: MembershipSettings; giving?: Giving; sections: HomeSection[] }) {
  const e = home.editorial ?? { kicker: '', headline: home.hero.title, lead: home.hero.lead, quickActions: [], prayerCenter: '', services: [], giveTitle: 'Give', giveText: '' };
  const page = orgPage();
  const live = (b: LiveBlock) => <LiveBlockView b={b} page={page} />;
  const render = (s: HomeSection) => {
    switch (s) {
      case 'today': return (
        <Section key={s} id="today" title="Today" lead="Adhan, iqamah and the next Jumuah." more={{ label: 'Every masjid', href: '/prayer-times' }}>
          <div className="ed-today">{live({ type: 'prayer-times', masjid: e.prayerCenter, view: 'today', showIqamah: true })}{live({ type: 'next-jumuah', masjid: '' })}</div>
        </Section>);
      case 'deadline': return <Section key={s} id="deadline">{live({ type: 'deadline', title: home.bento.deadlineTitle })}</Section>;
      case 'week': return <Section key={s} id="week" title="This week across the network" more={{ label: 'All activity', href: '/activity' }}>{live({ type: 'activity', masjid: '', view: 'week', kinds: [], limit: 6 })}</Section>;
      case 'masajid': return <Section key={s} id="masajid" title="Our masajid" lead={home.hero.mapHint} more={{ label: 'Find my masjid', href: '/masajid' }} tone="muted">{live({ type: 'masjid-cards', zone: '' })}</Section>;
      case 'services': return e.services.length ? (
        <Section key={s} id="services" title="Services" more={{ label: 'All services', href: '/services' }}>
          <StaticBlockView b={{ type: 'cards', columns: '3', items: e.services.map((x) => ({ title: x.title, text: x.text, href: x.href, label: 'Learn more' })) } satisfies StaticBlock} />
        </Section>) : null;
      case 'programs': return <Section key={s} id="programs" title="Programs and events" more={{ label: 'All programs', href: '/programs' }}>{live({ type: 'events', masjid: '', category: '', limit: 6, emptyText: 'Programs and events are published by the office and the masajid.' })}</Section>;
      case 'give': return (
        <Section key={s} id="give" title={e.giveTitle} lead={e.giveText} more={{ label: 'All ways to give', href: '/give' }} tone="hero">
          {live({ type: 'campaigns', masjid: '', limit: 3, emptyText: '' })}
          <div className="blk-buttons ed-give-buttons"><Link className="btn btn-primary" href="/give?fund=zakat">Give Zakat</Link><Link className="btn btn-secondary" href="/give">Give Sadaqah</Link><Link className="btn btn-ghost" href="/masajid">Support my masjid</Link></div>
        </Section>);
      case 'latest': return <Section key={s} id="latest" title="News and announcements" more={{ label: 'All news', href: '/news' }}>{live({ type: 'news', limit: 3 })}</Section>;
      case 'election': return <Section key={s} id="election" title="Elections">{live({ type: 'election', year: 0 })}</Section>;
      case 'verse': return giving ? <HomeVerse key={s} giving={giving} /> : null;
      case 'closing': return <Closing key={s} closing={home.closing} />;
      default: return null;
    }
  };
  return (
    <div className="home home-editorial">
      <header className="ed-hero" data-photo={e.photo ? 'yes' : 'no'}>
        {e.photo && <Photo image={e.photo} sizes="100vw" className="ed-hero-photo" priority />}
        <div className="wrap ed-hero-in">
          {e.kicker && <p className="ed-kicker">{e.kicker}</p>}
          <h1 className="ed-headline">{e.headline}</h1>
          {e.lead && <p className="ed-lead">{e.lead}</p>}
        </div>
        {e.quickActions.length > 0 && (
          <nav className="wrap ed-quick" aria-label="Quick actions">
            {e.quickActions.map((a) => <Link key={a.href + a.label} href={a.href} className="ed-quick-a" data-tone={a.tone}><b>{a.label}</b>{a.hint && <span>{a.hint}</span>}</Link>)}
          </nav>
        )}
      </header>
      {sections.map(render)}
      <p className="sr-only">Membership year {settings.year}</p>
    </div>
  );
}
