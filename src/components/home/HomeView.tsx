/**
 * Home page view. Admin controls (CMS › Home page):
 *   layout   → "zones" (interactive five-zone map hero) or "classic" (member card hero)
 *   sections → which sections show below the hero, and in what order (verse / impact / needs come from CMS › Giving)
 * Data is loaded in app/page.tsx.
 */
import { DEFAULT_SECTIONS, type Home, type HomeSection } from '@/lib/content/home';
import type { MembershipSettings } from '@/lib/content/membership';
import type { NewsItem } from '@/lib/content/pages';
import type { Giving } from '@/lib/content/giving';
import { HomeImpact, HomeNeeds, HomeVerse } from '@/components/giving/GivingViews';
import { StarSymbol } from '@/components/layout/StarSymbol';
import { HeroZones } from './HeroZones';
import { ClassicHero } from './ClassicHero';
import { HomeBento } from './HomeBento';
import { Closing, HeartLine, HoustonBand, Journey, LifeMosaic, StatsStrip } from './HomeSections';
import { PlanCards, StepsBand } from './ClassicSections';

export function HomeView({ home, settings, news, giving }: { home: Home; settings: MembershipSettings; news: NewsItem[]; giving?: Giving }) {
  const layout = home.layout ?? 'zones';
  const sections: HomeSection[] = home.sections?.length ? home.sections : DEFAULT_SECTIONS[layout];
  const zoneName = home.zones[3]?.name ?? home.zones[0]?.name ?? '';

  const render = (s: HomeSection) => {
    switch (s) {
      case 'stats': return <StatsStrip key={s} stats={home.stats} />;
      case 'heart': return home.heartLine ? <HeartLine key={s} line={home.heartLine} /> : null;
      case 'bento': return <HomeBento key={s} bento={home.bento} settings={settings} news={news} />;
      case 'steps': return <StepsBand key={s} journey={home.journey} />;
      case 'plans': return <PlanCards key={s} settings={settings} />;
      case 'life': return <LifeMosaic key={s} life={home.life} />;
      case 'verse': return giving ? <HomeVerse key={s} giving={giving} /> : null;
      case 'impact': return giving ? <HomeImpact key={s} giving={giving} /> : null;
      case 'needs': return giving ? <HomeNeeds key={s} giving={giving} /> : null;
      case 'journey': return <Journey key={s} journey={home.journey} />;
      case 'houston': return <HoustonBand key={s} houston={home.houston} />;
      case 'closing': return <Closing key={s} closing={home.closing} />;
      default: return null;
    }
  };

  return (
    <div className={`home home-${layout}`}>
      <StarSymbol />
      {layout === 'classic' && home.classicHero ? (
        <ClassicHero hero={home.hero} classic={home.classicHero} settings={settings} centerName={`${zoneName} zone`} />
      ) : (
        <HeroZones hero={home.hero} zones={home.zones}
          card={{ name: 'Aisha Rahman', memberId: 'HOU-204781', center: zoneName, validThrough: `12/31/${settings.year}`, tag: 'Voting eligible' }} />
      )}
      {sections.map(render)}
    </div>
  );
}
