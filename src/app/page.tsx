'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Lock, Radio, ShieldCheck, ArrowDownUp } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-900 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
            One gateway for government service delivery
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            MahaSetu connects existing departmental systems so citizens apply once, share data only with consent,
            and officers see verified records without collecting the same documents again.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => router.push('/register')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm"
            >
              Create citizen account
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/20 text-sm"
            >
              Sign in
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Connected departments</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/40">
              <h3 className="font-bold text-slate-900">Revenue &amp; land records</h3>
              <p className="text-xs text-slate-600 mt-2">Address, cadastral holding, and property-tax clearance exchanged through the revenue adapter.</p>
            </div>
            <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/40">
              <h3 className="font-bold text-slate-900">Municipal corporation</h3>
              <p className="text-xs text-slate-600 mt-2">Trade licensing uses verified revenue clearances instead of repeated document uploads.</p>
            </div>
            <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/40">
              <h3 className="font-bold text-slate-900">Employment &amp; skills</h3>
              <p className="text-xs text-slate-600 mt-2">Subsidy eligibility uses an approved trade license and domicile records already on file.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ArrowDownUp, title: 'Common data model', text: 'Department payloads are mapped into a shared model without replacing legacy systems.' },
            { icon: Lock, title: 'Consent-based sharing', text: 'Cross-department access is purpose-bound, field-specific, time-limited, and revocable.' },
            { icon: Radio, title: 'Unified tracking', text: 'Citizens and officers see the same application timeline with live status updates.' },
            { icon: ShieldCheck, title: 'Audit & access control', text: 'Every exchange is hash-chained. Officers only act on applications for their department.' },
          ].map((item) => (
            <div key={item.title} className="p-6 rounded-xl bg-white border border-slate-200">
              <item.icon className="w-5 h-5 text-blue-700 mb-3" />
              <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
