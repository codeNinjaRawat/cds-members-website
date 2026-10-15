/** Home – content from admin CMS (GET /public/pages/home), plans/deadline from settings, latest news. */
import { getGiving, getHome, getMembershipSettings, getNews } from '@/lib/content/loaders';
import { HomeView } from '@/components/home/HomeView';

export default async function HomePage() {
  const [home, settings, news, giving] = await Promise.all([getHome(), getMembershipSettings(), getNews(2), getGiving()]);
  return <HomeView home={home} settings={settings} news={news} giving={giving} />;
}
