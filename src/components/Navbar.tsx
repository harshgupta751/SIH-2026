'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  User,
  ShieldCheck,
  Sliders,
  PlayCircle,
  Radio,
  Building2,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sseConnected, setSseConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');
      eventSource.onopen = () => setSseConnected(true);
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.eventType) {
            setLastEvent(`${data.eventType}: ${data.summary?.slice(0, 45)}...`);
            setTimeout(() => setLastEvent(null), 6000);
          }
        } catch {
          // ignore non-json
        }
      };
      eventSource.onerror = () => setSseConnected(false);
    } catch {
      setSseConnected(false);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const navItems = [
    { href: '/', label: 'Overview', icon: Layers },
    { href: '/citizen', label: 'Citizen Portal', icon: User, badge: 'Rahul' },
    { href: '/department', label: 'Department Portal', icon: Building2, badge: 'Officer' },
    { href: '/admin', label: 'Interop Admin', icon: Sliders, badge: 'Gateway' },
    { href: '/demo', label: 'Killer Demo', icon: PlayCircle, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      {/* Tricolor accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-india-saffron via-white to-india-green" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
                    MahaSetu
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    SIH26129
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Govt Interoperability & Unified Service Delivery Platform
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Role Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-amber-500/10 text-amber-900 hover:bg-amber-500/20 border border-amber-300/60 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="hidden md:inline-block text-[10px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-normal">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse hidden sm:inline-block" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Live Reactive Event Indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
              <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-500 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-[11px] text-slate-600 font-medium">
                {sseConnected ? 'Event Mesh Live' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating notification ticker if active event received */}
      {lastEvent && (
        <div className="bg-indigo-900 text-white text-xs py-1 px-4 flex items-center justify-between animate-fadeIn border-t border-indigo-700">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-amber-300">Reactive Event Bus:</span>
            <span className="truncate text-slate-200">{lastEvent}</span>
          </div>
        </div>
      )}
    </header>
  );
}
