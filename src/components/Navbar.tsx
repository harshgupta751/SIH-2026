'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, User, Building2, Sliders, LogOut, Radio } from 'lucide-react';

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
        else setUser(null);
      })
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');
      eventSource.onopen = () => setSseConnected(true);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.eventType) {
            setLastEvent(`${data.eventType}: ${String(data.summary || '').slice(0, 80)}`);
            setTimeout(() => setLastEvent(null), 6000);
          }
        } catch {
          // ignore
        }
      };
      eventSource.onerror = () => setSseConnected(false);
    } catch {
      setSseConnected(false);
    }
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: 'Home', show: true },
    { href: '/citizen', label: 'Citizen services', show: user?.role === 'CITIZEN', icon: User },
    { href: '/department', label: 'Officer console', show: user?.role?.startsWith('OFFICER_') || user?.role === 'ADMIN', icon: Building2 },
    { href: '/admin', label: 'Gateway admin', show: user?.role === 'ADMIN', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-india-saffron via-white to-india-green" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => router.push('/')} className="flex items-center gap-2.5 text-left group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
                MahaSetu
              </span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Government interoperability platform
              </p>
            </div>
          </button>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
                <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                <span className="text-[11px] text-slate-600">{sseConnected ? 'Live updates' : 'Connecting'}</span>
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs text-slate-600 max-w-[140px] truncate">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  Sign in
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {lastEvent && (
        <div className="bg-indigo-900 text-white text-xs py-1 px-4">
          <div className="flex items-center gap-2 max-w-7xl mx-auto">
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">{lastEvent}</span>
          </div>
        </div>
      )}
    </header>
  );
}
