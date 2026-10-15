'use client';
/**
 * Image from the admin media library. If the file is missing (e.g. images not downloaded yet),
 * a themed pattern placeholder shows instead – the layout never breaks. Credit shown on hover/focus when given.
 */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { ImageRef } from '@/lib/content/home';

/** Pexels photos are resized by the Pexels CDN itself – the browser fetches the right width directly,
 *  so our server never downloads or re-encodes them (that work made pages slow in development). */
const pexelsLoader = ({ src, width }: { src: string; width: number }) => {
  const u = new URL(src); u.searchParams.set('w', String(width)); u.searchParams.set('auto', 'compress'); u.searchParams.set('cs', 'tinysrgb'); return u.toString();
};
const isPexels = (src: string) => src.startsWith('https://images.pexels.com/');

type Props = { image: ImageRef; sizes: string; className?: string; priority?: boolean; showCredit?: boolean };

export function Photo({ image, sizes, className = '', priority = false, showCredit = false }: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // The image may fail before React hydrates (onError missed) – check once after mount
  useEffect(() => { const i = ref.current; if (i && i.complete && i.naturalWidth === 0) setFailed(true); }, []);
  return (
    <figure className={`photo ${failed ? 'photo-missing' : ''} ${className}`} data-src={image.src}>
      {!failed && (
        <Image ref={ref} src={image.src} alt={image.alt} fill sizes={sizes} priority={priority}
          loader={isPexels(image.src) ? pexelsLoader : undefined} unoptimized={image.src.startsWith('data:')}
          style={{ objectFit: 'cover', objectPosition: image.focal ?? '50% 50%' }} onError={() => setFailed(true)} />
      )}
      {failed && <span className="sr-only">{image.alt}</span>}
      {showCredit && image.credit && !failed && (
        <figcaption className="photo-credit">Photo: {image.creditUrl ? <a href={image.creditUrl} target="_blank" rel="noopener noreferrer">{image.credit}</a> : image.credit}</figcaption>
      )}
    </figure>
  );
}
