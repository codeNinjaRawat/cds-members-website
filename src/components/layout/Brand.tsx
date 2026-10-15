/**
 * Logo (admin › Branding). Shows the light-background or dark-background version automatically:
 * dark mode, the glass header over the dark hero, and the footer use the dark version.
 * Files come from site-config.branding (uploaded by admins); defaults in /public/brand.
 */
import { DEFAULT_BRANDING, type Branding } from '@/lib/site-config/schema';

/** Adds ?v= for cache busting; uploaded data: URLs (admin demo uploads) are used as-is. */
export const withVersion = (src: string, v?: string) => (v && !src.startsWith('data:') ? `${src}${src.includes('?') ? '&' : '?'}v=${encodeURIComponent(v)}` : src);

export function BrandMark({ branding, size = 30 }: { branding?: Branding; size?: number }) {
  const b = branding ?? DEFAULT_BRANDING;
  return (
    <span className="brand-mark" style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bm-light" src={withVersion(b.logoLight, b.version)} alt="" width={size} height={size} decoding="async" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="bm-dark" src={withVersion(b.logoDark, b.version)} alt="" width={size} height={size} decoding="async" />
    </span>
  );
}
