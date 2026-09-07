'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { portalPathForRole, useSession } from '@/lib/auth/use-session';

function safeNextPath(value: string | null) {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && user) {
      const next = safeNextPath(searchParams.get('next'));
      router.replace(next || portalPathForRole(user.role));
    }
  }, [status, user, router, searchParams]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Sign in failed');
        return;
      }
      const next = safeNextPath(searchParams.get('next'));
      if (next) router.push(next);
      else router.push(portalPathForRole(data.user.role));
      router.refresh();
    } catch {
      setError('Unable to sign in. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ms-grid-bg min-h-[calc(100vh-12rem)]">
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="ms-card p-7 sm:p-8 space-y-7">
          <div>
            <p className="ms-label mb-2">Access</p>
            <h1 className="font-display text-3xl text-ink">Sign in</h1>
            <p className="text-sm text-mute mt-2 leading-relaxed">Citizens, officers, and administrators use the same sign-in.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ms-input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="ms-input"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={loading} className="ms-btn ms-btn-primary w-full h-11">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-sm text-mute">
            New citizen?{' '}
            <Link href="/register" className="text-accent hover:underline underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
