import type { Metadata } from 'next';
import { getMembershipSettings } from '@/lib/content/loaders';
import { PlansView } from '@/components/cms/PlansView';

export const metadata: Metadata = { title: 'Plans and dues' };

export default async function PlansPage() {
  return <PlansView settings={await getMembershipSettings()} />;
}
