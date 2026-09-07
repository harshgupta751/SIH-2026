'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Radio, ShieldCheck, ArrowDownUp } from 'lucide-react';
import { portalPathForRole, useSession } from '@/lib/auth/use-session';

export default function HomePage() {
  const router = useRouter();
  const { user, status } = useSession();
  const signedIn = status === 'authenticated' && Boolean(user?.id);

  return (
    <div>
      <section className="relative overflow-hidden ms-grid-bg border-b border-line">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-canvas/40 to-canvas pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 relative">
          <p className="ms-label mb-5">Government of Maharashtra</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.65rem] leading-[1.12] tracking-tight text-ink max-w-3xl">
            One gateway.
            <span className="italic text-mute"> Existing systems stay.</span>
          </h1>
          <p className="mt-6 text-base sm:text-[17px] text-mute max-w-xl leading-relaxed">
            MahaSetu connects departmental systems so citizens apply once, share data only with consent, and officers work from verified records instead of duplicate files.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-8">
            {signedIn ? (
              <button onClick={() => router.push(portalPathForRole(user!.role))} className="ms-btn ms-btn-primary h-11 px-5">
                Open your portal
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button onClick={() => router.push('/register')} className="ms-btn ms-btn-primary h-11 px-5">
                  Create citizen account
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => router.push('/login')} className="ms-btn ms-btn-secondary h-11 px-5">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="ms-label mb-2">Connected now</p>
            <h2 className="font-display text-2xl sm:text-3xl text-ink">Three systems. One consent layer.</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line rounded-ms overflow-hidden border border-line">
          {[
            { n: '01', title: 'Revenue & land records', text: 'Address, cadastral holding, and property-tax clearance exchanged through the revenue adapter.' },
            { n: '02', title: 'Municipal corporation', text: 'Trade licensing uses verified revenue clearances instead of repeated document uploads.' },
            { n: '03', title: 'Employment & skills', text: 'Subsidy eligibility uses an approved trade license and domicile records already on file.' },
          ].map((d) => (
            <div key={d.n} className="bg-surface p-6 sm:p-8">
              <span className="font-mono text-[11px] text-copper">{d.n}</span>
              <h3 className="mt-3 font-medium text-ink">{d.title}</h3>
              <p className="mt-2 text-sm text-mute leading-relaxed">{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <p className="ms-label mb-8">How the gateway works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ArrowDownUp, title: 'Common data model', text: 'Department payloads are mapped into a shared model without replacing legacy systems.' },
              { icon: Lock, title: 'Consent-based sharing', text: 'Cross-department access is purpose-bound, field-specific, time-limited, and revocable.' },
              { icon: Radio, title: 'Unified tracking', text: 'Citizens and officers see the same application timeline with live status updates.' },
              { icon: ShieldCheck, title: 'Audit & access control', text: 'Every exchange is hash-chained. Officers only act on applications for their department.' },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="w-4 h-4 text-copper mb-3" strokeWidth={1.6} />
                <h3 className="text-sm font-medium text-ink mb-2">{item.title}</h3>
                <p className="text-sm text-mute leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
