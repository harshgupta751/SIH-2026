'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  KeyRound,
  FileCheck,
  Network,
  Cpu,
  Radio,
  CheckCircle2,
  Lock,
  Zap,
  Building,
  Sparkles,
  ArrowDownUp,
  Server,
  Terminal,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/integrations')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setIntegrations(data.integrations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-900 text-white pt-14 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide uppercase shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Smart India Hackathon • SIH26129 Prototype
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white max-w-4xl mx-auto">
            Government Digital Platform <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
              Interoperability & Middleware Layer
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Connecting disparate, legacy departmental systems through standardized adapters, dynamic JSON-schema mapping, 
            DPDP-compliant consent authorization, and reactive cross-department event orchestration.
          </p>

          {/* Value Proposition Callout */}
          <div className="max-w-2xl mx-auto p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-xs sm:text-sm text-slate-200">
            <span className="font-bold text-amber-300">Core Innovation: </span>
            We do not rebuild government websites. We bridge them. MahaSetu sits between RevNet, MuniSys, and KaushalPortal to enable seamless, consent-governed data exchange.
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => router.push('/demo')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all transform hover:-translate-y-0.5 text-sm"
            >
              <Zap className="w-4 h-4 fill-current" />
              Launch Killer Demo Walkthrough
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push('/citizen')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/20 transition-all text-sm"
            >
              Citizen Portal View
            </button>

            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/20 transition-all text-sm"
            >
              Admin & Schema Studio
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Architecture Topology Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
                <Network className="w-4 h-4" />
                Live Distributed Interoperability Topology
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Heterogeneous Departments Connected via MahaSetu Middleware
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-600">All 3 Adapters Online</span>
            </div>
          </div>

          {/* Visual Node Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Dept A: Revenue */}
            <div className="p-5 rounded-xl border-2 border-indigo-100 bg-indigo-50/40 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-800">
                  SYSTEM A • MOCK
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 38ms
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Revenue Department</h3>
              <p className="text-xs text-indigo-700 font-semibold mb-2">RevNet Registry</p>
              <p className="text-xs text-slate-600 mb-4">
                Cadastral land parcels, 7/12 land extract, residential property tax clearance.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-indigo-100 text-[11px] font-mono text-slate-700 space-y-1">
                <div className="text-slate-400 text-[10px]">Idiosyncratic Schema:</div>
                <div>citizen.fullName</div>
                <div>address_record.city_name</div>
                <div>address_record.property_tax_cleared</div>
              </div>
            </div>

            {/* Dept B: Municipal */}
            <div className="p-5 rounded-xl border-2 border-emerald-100 bg-emerald-50/40 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                  SYSTEM B • MOCK
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 42ms
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Municipal Corporation</h3>
              <p className="text-xs text-emerald-700 font-semibold mb-2">MuniSys Trade Licensing</p>
              <p className="text-xs text-slate-600 mb-4">
                Trade license issuance, commercial zoning verification, municipal inspections.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 text-[11px] font-mono text-slate-700 space-y-1">
                <div className="text-slate-400 text-[10px]">Idiosyncratic Schema:</div>
                <div>applicant_name</div>
                <div>premises_address</div>
                <div>revenue_clearance_ref</div>
              </div>
            </div>

            {/* Dept C: Employment */}
            <div className="p-5 rounded-xl border-2 border-amber-100 bg-amber-50/40 hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                  SYSTEM C • MOCK
                </span>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 35ms
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Employment & Skill Dept</h3>
              <p className="text-xs text-amber-700 font-semibold mb-2">KaushalPortal Schemes</p>
              <p className="text-xs text-slate-600 mb-4">
                PMEGP startup grants, skill-linked subsidies, youth entrepreneurship registry.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-amber-100 text-[11px] font-mono text-slate-700 space-y-1">
                <div className="text-slate-400 text-[10px]">Idiosyncratic Schema:</div>
                <div>candidate_profile.legal_name</div>
                <div>scheme_eligibility.max_grant_inr</div>
                <div>requires_address_clearance</div>
              </div>
            </div>
          </div>

          {/* The Central Interoperability Bridge (MahaSetu Core) */}
          <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-amber-300" />
                  <h4 className="text-lg font-extrabold text-white tracking-wide">
                    MahaSetu Common Data Model (CDM) Engine
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                  Executes bidirectional translation rules between disparate departmental schemas. Encapsulates 
                  DPDP Act consent tokens, cryptographic audit hashes, and asynchronous event distribution.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded bg-white/10 text-amber-300 border border-white/10">
                  Dynamic JSONPath Mapper
                </span>
                <span className="px-3 py-1 rounded bg-white/10 text-emerald-300 border border-white/10">
                  DPDP Consent Guard
                </span>
                <span className="px-3 py-1 rounded bg-white/10 text-blue-300 border border-white/10">
                  Reactive SSE Event Mesh
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars: What Makes MahaSetu Different */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Engineered Specifically for Interoperability
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Why MahaSetu stands apart from standard CRUD portals in government hackathons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
              <ArrowDownUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Dynamic Data Mapping</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Maps diverse JSON schemas into standard Common Data Model (CDM) without writing repetitive custom code.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">DPDP Consent Manager</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ensures citizens explicitly grant, scope, and revoke data access between departments before interop calls execute.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Reactive Event Bus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kafka-compliant event streaming with instant Server-Sent Events (SSE) synchronization between citizen and officer views.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Tamper-Evident Audit</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              SHA-256 hash-chained activity ledger recording actor, department, purpose, and payload metadata for non-repudiation.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Legacy Silos vs MahaSetu */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
            Comparison: Siloed Portals vs MahaSetu Interoperability
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="py-3 px-4 font-semibold">Capability</th>
                  <th className="py-3 px-4 font-semibold text-rose-700">Conventional Govt Web Portals</th>
                  <th className="py-3 px-4 font-semibold text-emerald-700">MahaSetu Interoperability Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Cross-Dept Verification</td>
                  <td className="py-3 px-4 text-rose-600">Citizen uploads physical PDFs; manual officer verification</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">Direct API-to-API adapter exchange in milliseconds</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Data Formats</td>
                  <td className="py-3 px-4 text-rose-600">Incompatible schemas force redundant re-entry of details</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">Automated Dynamic Normalization into Common Data Model</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Citizen Privacy</td>
                  <td className="py-3 px-4 text-rose-600">Blanket data sharing without granular purpose specification</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">DPDP-compliant purpose-bound, revocable consent token</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Application Tracking</td>
                  <td className="py-3 px-4 text-rose-600">Separate logins on separate departmental portals</td>
                  <td className="py-3 px-4 text-emerald-600 font-medium">Unified Single-Window Tracker with real-time SSE updates</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
