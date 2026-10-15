import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap page-head">
      <h1>We can't find that page</h1>
      <p>The link may be old or mistyped. <Link href="/">Go to the home page</Link>.</p>
    </div>
  );
}
