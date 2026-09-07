import { Suspense } from 'react';
import LoginPage from './page-client';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-sm text-mute">Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}
