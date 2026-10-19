import type { Metadata } from 'next';
import { VerifyView } from '@/components/forms/FormViews';
import { getSiteConfig } from '@/lib/site-config/get-site-config';

export const metadata: Metadata = { title: 'Verify a membership' };

export default async function VerifyPage() { return <VerifyView org={(await getSiteConfig()).org.shortName} />; }
