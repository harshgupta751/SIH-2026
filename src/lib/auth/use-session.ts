'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export type ClientSessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string | null;
  departmentCode?: string | null;
  citizenId?: string | null;
};

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

export function portalPathForRole(role: string) {
  if (role === 'CITIZEN') return '/citizen';
  if (role === 'ADMIN') return '/admin';
  if (role.startsWith('OFFICER_')) return '/department';
  return '/';
}

export async function fetchSessionUser(): Promise<ClientSessionUser | null> {
  const res = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
  const data = await res.json().catch(() => null);
  if (res.ok && data?.success && data.user?.id) return data.user as ClientSessionUser;
  return null;
}

export function useSession() {
  const pathname = usePathname();
  const [user, setUser] = useState<ClientSessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSessionUser();
      setUser(next);
      setStatus(next ? 'authenticated' : 'anonymous');
    } catch {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [pathname, refresh]);

  return { user, status, refresh, setUser, setStatus };
}
