/** Any CMS page (about, elections, faq, contact, masjid pages …) – composed by admins in Website › Pages (O1). */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/content/loaders';
import { effectiveSeo } from '@/lib/content/page-rules';
import { PageView } from '@/components/cms/PageView';

type Params = { params: Promise<{ slug: string[] }>; searchParams: Promise<{ preview?: string }> };

// Rendered for each visit: the pages belong to the organization at this address (no generateStaticParams – a page
// listed there is static, and reading the address in it made Next.js answer 500 on the server).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await getPage((await params).slug.join('/'), { includeUnpublished: true });
  if (!page) return {};
  const seo = effectiveSeo(page);
  return {
    title: seo.title, description: seo.description,
    robots: seo.noIndex ? { index: false } : undefined,
    openGraph: { title: seo.title, description: seo.description, type: 'website', images: seo.image ? [{ url: seo.image.src, alt: seo.image.alt }] : undefined },
  };
}

export default async function CmsPage({ params, searchParams }: Params) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const preview = sp.preview === '1'; // admin preview (the admin app opens pages with ?preview=1 inside its preview frame)
  const page = await getPage(slug.join('/'), { includeUnpublished: preview });
  if (!page) notFound();
  return <PageView page={page} preview={preview} />;
}
