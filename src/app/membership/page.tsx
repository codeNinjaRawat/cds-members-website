/** /membership: the organization's own "membership" page when it wrote one (CMS › Pages), else the plans. */
import { redirect } from 'next/navigation';
import { getPage } from '@/lib/content/loaders';
import { PageView } from '@/components/cms/PageView';
export const dynamic = 'force-dynamic';
export default async function MembershipIndex() {
  const page = await getPage('membership');
  if (page) return <PageView page={page} />;
  redirect('/membership/plans');
}
