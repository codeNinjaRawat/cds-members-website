/** Any CMS page (about, elections, faq, contact, centers, privacy …) – content from admin CMS › Pages. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/content/loaders';
import { PageView } from '@/components/cms/PageView';

type Params = { params: Promise<{ slug: string[] }> };

// Rendered for each visit: the pages belong to the organization at this address (no generateStaticParams – a page
// listed there is static, and reading the address in it made Next.js answer 500 on the server).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await getPage((await params).slug.join('/'));
  return page ? { title: page.title, description: page.intro, robots: page.status === 'draft' ? { index: false } : undefined } : {};
}

export default async function CmsPage({ params }: Params) {
  const page = await getPage((await params).slug.join('/'));
  if (!page) notFound();
  return <PageView page={page} />;
}
