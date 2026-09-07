'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, LogOut, Menu, Radio, Sliders, User, X } from 'lucide-react';
import BrandMark from '@/components/BrandMark';
import ThemeToggle from '@/components/theme/ThemeToggle';

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
  const [menuOpen, setMenuOpen] = useState(false);

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
    setMenuOpen(false);
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

  const go = (href: string) => {
    router.push(href);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[3.75rem] gap-3">
          <button onClick={() => go('/')} className="flex items-center gap-2.5 text-left min-w-0">
            <BrandMark className="h-8 w-8 shrink-0" />
            <span className="min-w-0">
              <span className="block font-display text-[1.15rem] leading-none tracking-tight text-ink">MahaSetu</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.16em] text-mute mt-1">Interoperability</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className={`px-3 py-1.5 rounded-ms text-[13px] transition ${
                      isActive ? 'bg-ink text-canvas' : 'text-mute hover:text-ink hover:bg-elevated'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
          </nav>

          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden lg:flex items-center gap-2 px-2.5 h-8 rounded-full border border-line text-[11px] text-mute">
                <span className={`h-1.5 w-1.5 rounded-full ${sseConnected ? 'bg-success' : 'bg-warn'}`} />
                {sseConnected ? 'Live' : 'Connecting'}
              </div>
            )}
            <ThemeToggle />
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-[13px] text-mute max-w-[120px] truncate">{user.name}</span>
                <button onClick={handleLogout} className="ms-btn ms-btn-ghost h-9 px-3 text-[13px]">
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                <button onClick={() => go('/login')} className="ms-btn ms-btn-ghost h-9 px-3 text-[13px]">
                  Sign in
                </button>
                <button onClick={() => go('/register')} className="ms-btn ms-btn-primary h-9 px-3 text-[13px]">
                  Register
                </button>
              </div>
            )}
            <button
              type="button"
              className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-ms border border-line text-ink"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-line bg-surface px-4 py-3 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className={`w-full text-left px-3 py-2.5 rounded-ms text-sm ${
                  pathname === item.href ? 'bg-ink text-canvas' : 'text-ink hover:bg-elevated'
                }`}
              >
                {item.label}
              </button>
            ))}
          {user ? (
            <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 rounded-ms text-sm text-mute">
              Sign out
            </button>
          ) : (
            <>
              <button onClick={() => go('/login')} className="w-full text-left px-3 py-2.5 rounded-ms text-sm">
                Sign in
              </button>
              <button onClick={() => go('/register')} className="w-full text-left px-3 py-2.5 rounded-ms text-sm bg-accent text-accent-fg">
                Register
              </button>
            </>
          )}
        </div>
      )}

      {lastEvent && (
        <div className="border-t border-line bg-elevated text-[12px] py-1.5 px-4">
          <div className="flex items-center gap-2 max-w-6xl mx-auto text-mute">
            <Radio className="w-3.5 h-3.5 text-copper shrink-0" />
            <span className="truncate font-mono">{lastEvent}</span>
          </div>
        </div>
      )}
    </header>
  );
}
