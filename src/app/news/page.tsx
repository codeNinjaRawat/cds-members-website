import type { Metadata } from 'next';
import { getNews } from '@/lib/content/loaders';
import { NewsListView } from '@/components/cms/NewsListView';

export const metadata: Metadata = { title: 'News' };

export default async function NewsPage() {
  return <NewsListView news={await getNews(12)} />;
}
