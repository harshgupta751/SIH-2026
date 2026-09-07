import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="ms-page text-center py-24">
      <p className="ms-label mb-3">404</p>
      <h1 className="font-display text-3xl text-ink">This page is not on the gateway</h1>
      <p className="text-sm text-mute mt-3 mb-8">The route does not exist, or you do not have access to it.</p>
      <Link href="/" className="ms-btn ms-btn-primary">
        Return home
      </Link>
    </div>
  );
}
