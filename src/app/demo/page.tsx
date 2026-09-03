'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Code2,
  Database,
  Radio,
  Building,
  User,
  Sparkles,
  Layers,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

const STEPS = [
  {
    num: 1,
    title: 'Citizen Login',
    actor: 'Rahul Sharma (Citizen)',
    desc: 'Rahul logs into MahaSetu. His session is verified with DigiLocker and citizen profile CIT-3210 is loaded.',
  },
  {
    num: 2,
    title: 'Apply for Business License',
    actor: 'Citizen Portal',
    desc: 'Rahul submits an application for "Rahul Enterprises" (Retail Commercial). Application MH-MUNI-2026-10231 is generated.',
  },
  {
    num: 3,
    title: 'Dependency Discovery & DPDP Consent',
    actor: 'MahaSetu Gateway',
    desc: 'MahaSetu analyzes service requirements: Trade License requires verified address and property-tax status from the Revenue Department. DPDP Consent prompt is rendered.',
  },
  {
    num: 4,
    title: 'Citizen Grants Data Consent',
    actor: 'Rahul Sharma',
    desc: 'Rahul reviews requested fields and clicks [Grant Consent]. A cryptographically signed consent token is stored in the database and audit trail.',
  },
  {
    num: 5,
    title: 'RevNet API Query via Adapter',
    actor: 'RevenueAdapter',
    desc: 'MahaSetu queries Revenue Department (RevNet) API for Rahul Sharma (9876543210). RevNet returns its legacy idiosyncratic JSON payload.',
  },
  {
    num: 6,
    title: 'Dynamic Data Mapping to CDM',
    actor: 'Data Mapping Engine',
    desc: 'MahaSetu maps disparate field names (citizen.fullName → name, address_record.city_name → address.city) into the standard Common Data Model (CDM).',
  },
  {
    num: 7,
    title: 'MuniSys Dispatch via MunicipalAdapter',
    actor: 'MunicipalAdapter',
    desc: 'MahaSetu translates the normalized CDM record into Municipal Corporation schema and registers the application into MuniSys with clearance reference.',
  },
  {
    num: 8,
    title: 'Officer Cross-Department Inspection',
    actor: 'Municipal Officer (M. Kulkarni)',
    desc: 'Officer opens MuniSys queue. Rather than demanding physical documents, the officer sees Revenue verification pre-cleared via MahaSetu interop.',
  },
  {
    num: 9,
    title: 'Officer Sanctions License & Emits Event',
    actor: 'MuniSys + Event Bus',
    desc: 'Officer clicks [Approve]. MuniSys sanctions permit MH-PUNE-MUNI-LIC-4412 and MahaSetu publishes APPLICATION_APPROVED to the Reactive Event Bus.',
  },
  {
    num: 10,
    title: 'Real-Time SSE Citizen Sync',
    actor: 'Server-Sent Events (SSE)',
    desc: 'Citizen dashboard immediately receives the event push over SSE and flips to APPROVED ✅ without refreshing. Statutory license certificate is ready.',
  },
];

export default function KillerDemoPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [demoAppId, setDemoAppId] = useState('MH-MUNI-2026-10231');

  // Payload Inspection State
  const [payloads, setPayloads] = useState<{
    revNetRaw: any;
    cdmModel: any;
    muniSysDispatched: any;
  }>({
    revNetRaw: {
      citizen: {
        fullName: 'Rahul Sharma',
        mobile: '9876543210',
        aadhaarHash: 'sha256_mock_e3b0c44298fc1c149afbf4c8996fb924',
      },
      address_record: {
        house_no: 'Flat 402, Shanti Niwas',
        locality: 'Kothrud',
        city_name: 'Pune',
        pin: '411038',
        district_name: 'Pune',
        state_code: 'MH',
        land_holding_sqft: 1200,
        property_tax_cleared: true,
      },
      verification_status: 'VERIFIED_ACTIVE',
    },
    cdmModel: {
      citizenId: 'CIT-3210',
      name: 'Rahul Sharma',
      mobile: '9876543210',
      address: {
        line1: 'Flat 402, Shanti Niwas',
        locality: 'Kothrud',
        city: 'Pune',
        district: 'Pune',
        postalCode: '411038',
        fullFormattedAddress: 'Flat 402, Shanti Niwas, Kothrud, Pune, Pune - 411038, MH',
      },
      clearances: {
        revenueVerified: true,
        revenueReferenceId: 'REV-CLR-990142',
        propertyTaxCleared: true,
        landHoldingSqft: 1200,
      },
    },
    muniSysDispatched: {
      applicant_name: 'Rahul Sharma',
      phone_number: '9876543210',
      business_title: 'Rahul Enterprises',
      premises_address: 'Flat 402, Shanti Niwas, Kothrud, Pune, Pune - 411038, MH',
      ward_no: 'WARD-14',
      trade_category: 'COMMERCIAL_RETAIL',
      revenue_clearance_ref: 'REV-CLR-990142',
      property_tax_cleared_flag: true,
      approval_state: 'PENDING_MUNICIPAL_VERIFICATION',
    },
  });

  // Auto-play timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && currentStep < 10) {
      timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 3200);
    } else if (currentStep >= 10) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const handleNextStep = () => {
    if (currentStep < 10) setCurrentStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Smart India Hackathon • SIH26129 Showcase
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              The Killer Demo: End-to-End Interoperability Pipeline
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Demonstrating heterogeneous departmental communication, dynamic data normalization, and reactive event-driven synchronization.
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse' : ''}`} />
              {isPlaying ? 'Pause Auto-Play' : 'Auto-Play Simulation'}
            </button>

            <button
              onClick={handleNextStep}
              disabled={currentStep >= 10 || isPlaying}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs disabled:opacity-50"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-1 p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs"
              title="Reset Demo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 10-Step Progress Stepper */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-1.5">
            {STEPS.map((step) => {
              const isPast = step.num < currentStep;
              const isCurrent = step.num === currentStep;

              return (
                <button
                  key={step.num}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(step.num);
                  }}
                  className={`p-2 rounded-lg text-left transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-md scale-105'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                      : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span>STEP {step.num}</span>
                    {isPast && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] truncate leading-tight">{step.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Step Highlight Box */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
              STEP {currentStep} OF 10
            </span>
            <span className="text-xs text-indigo-300 font-mono">Actor: {STEPS[currentStep - 1].actor}</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-white/10 text-emerald-300">
            {currentStep === 10 ? '🎉 WORKFLOW COMPLETE' : 'IN PROGRESS'}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          {STEPS[currentStep - 1].title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
          {STEPS[currentStep - 1].desc}
        </p>
      </div>

      {/* THE CORE SIH DIFFERENTIATOR: Dynamic 3-Way Payload Transformation Inspector */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              Live Interoperability Schema Transformation Inspector
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Disparate Department JSON → Common Data Model (CDM) → Target Municipal JSON
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Runtime Bi-Directional Mapping
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono">
          {/* Column 1: RevNet Raw */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentStep >= 5 ? 'bg-slate-950 text-indigo-300 border-indigo-500/50 shadow-md' : 'bg-slate-900/50 text-slate-500 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
              <span className="font-bold text-indigo-400">1. RevNet Raw JSON (System A)</span>
              <span className="text-[10px] text-slate-400">Idiosyncratic</span>
            </div>
            <pre className="h-64 overflow-auto text-[11px] leading-relaxed">
              {JSON.stringify(payloads.revNetRaw, null, 2)}
            </pre>
            <div className="mt-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              Key fields: <code className="text-amber-300">citizen.fullName</code>, <code className="text-amber-300">address_record.city_name</code>
            </div>
          </div>

          {/* Column 2: MahaSetu CDM */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentStep >= 6 ? 'bg-slate-950 text-emerald-300 border-emerald-500/50 shadow-md ring-2 ring-emerald-500/20' : 'bg-slate-900/50 text-slate-500 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
              <span className="font-bold text-emerald-400">2. MahaSetu Common Data Model</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                CDM Standard
              </span>
            </div>
            <pre className="h-64 overflow-auto text-[11px] leading-relaxed">
              {JSON.stringify(payloads.cdmModel, null, 2)}
            </pre>
            <div className="mt-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              Normalized: <code className="text-emerald-300">name</code>, <code className="text-emerald-300">address.city</code>, <code className="text-emerald-300">clearances</code>
            </div>
          </div>

          {/* Column 3: MuniSys Dispatched */}
          <div className={`p-4 rounded-xl border transition-all ${
            currentStep >= 7 ? 'bg-slate-950 text-amber-300 border-amber-500/50 shadow-md' : 'bg-slate-900/50 text-slate-500 border-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
              <span className="font-bold text-amber-400">3. MuniSys Dispatched JSON (System B)</span>
              <span className="text-[10px] text-slate-400">Target Schema</span>
            </div>
            <pre className="h-64 overflow-auto text-[11px] leading-relaxed">
              {JSON.stringify(payloads.muniSysDispatched, null, 2)}
            </pre>
            <div className="mt-2 text-[10px] text-slate-400 pt-2 border-t border-slate-800">
              Delivered: <code className="text-amber-300">applicant_name</code>, <code className="text-amber-300">revenue_clearance_ref</code>
            </div>
          </div>
        </div>
      </div>

      {/* Dual Screen Simulation Preview: Citizen View vs Officer View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Citizen Dashboard Preview */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Citizen View (Rahul Sharma)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              PORTAL: /citizen
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Business License Application</span>
              <span
                className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase ${
                  currentStep === 10
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : currentStep >= 7
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : currentStep >= 3
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {currentStep === 10
                  ? 'Approved ✅'
                  : currentStep >= 7
                  ? 'Municipal Officer Review 🟡'
                  : currentStep >= 3
                  ? 'Awaiting Consent ⏳'
                  : 'Draft'}
              </span>
            </div>

            <p className="text-slate-600">
              Establishment: <strong className="text-slate-900">Rahul Enterprises</strong> (Pune Ward 14)
            </p>

            <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Revenue Dept Clearance:</span>
                <span className="font-bold text-emerald-600">
                  {currentStep >= 5 ? 'Verified (REV-CLR-990142) ✅' : 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">MuniSys Trade Permit:</span>
                <span className="font-bold text-blue-900">
                  {currentStep === 10 ? 'MH-PUNE-MUNI-LIC-4412 ✅' : 'Under Officer Review'}
                </span>
              </div>
            </div>

            {currentStep === 10 && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium text-xs flex items-center gap-2 animate-bounce-once">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>🎉 License Approved & Sanctioned via Interop! Certificate ready.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Municipal Officer Preview */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-700" />
              <h3 className="font-bold text-slate-900 text-sm">Department Officer Console (MuniSys)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
              PORTAL: /department
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Officer Manoj Kulkarni</span>
              <span className="text-[10px] font-mono text-slate-500">Ward 14 Licensing</span>
            </div>

            <div className="p-2.5 rounded-lg bg-indigo-950 text-white space-y-1 text-[11px]">
              <span className="text-indigo-300 font-bold block text-[10px] uppercase">
                MahaSetu Pre-Verified Data:
              </span>
              <div>• Applicant: Rahul Sharma</div>
              <div>• Address: Flat 402, Shanti Niwas, Kothrud, Pune (Cadastral 1,200 sqft)</div>
              <div>• Property Tax: <span className="text-emerald-400 font-bold">CLEARED (No Arrears)</span></div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <span className="text-[11px] text-slate-500">
                {currentStep >= 9 ? 'Decision: Sanctioned by Officer' : 'Awaiting Officer Sign-off'}
              </span>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white ${
                currentStep >= 9 ? 'bg-emerald-600' : 'bg-slate-300'
              }`}>
                {currentStep >= 9 ? 'License Approved ✓' : 'Approve Application'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
