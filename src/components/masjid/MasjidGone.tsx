/** A masjid that is no longer active in Admin › Zones and centers. */
import Link from 'next/link';

export function MasjidGone({ name }: { name: string }) {
  return (
    <article className="cms-page"><div className="wrap narrow">
      <header className="cms-head"><h1>{name}</h1><p className="intro">This masjid is no longer part of the network, so its pages are not available.</p></header>
      <p><Link className="btn btn-primary" href="/masajid">See all masajid</Link></p>
    </div></article>
  );
}
