'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Building,
  Store,
  ArrowRight,
  ExternalLink,
  Lock,
  Download,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Bell,
} from 'lucide-react';

export default function CitizenPortalPage() {
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeConsent, setActiveConsent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [businessName, setBusinessName] = useState('Rahul Enterprises');
  const [tradeCategory, setTradeCategory] = useState('COMMERCIAL_RETAIL');
  const [submitting, setSubmitting] = useState(false);

  // Certificate Modal state
  const [viewCertificateApp, setViewCertificateApp] = useState<any>(null);

  // Success alert ticker
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [profRes, srvRes, appRes] = await Promise.all([
        fetch('/api/citizens/me').then((r) => r.json()),
        fetch('/api/services').then((r) => r.json()),
        fetch('/api/applications?citizenId=CIT-3210').then((r) => r.json()),
      ]);

      if (profRes.success) setProfile(profRes.profile);
      if (srvRes.success) setServices(srvRes.services);
      if (appRes.success) {
        setApplications(appRes.applications);
        // Check for any pending consent requests
        const pendingApp = appRes.applications.find((a: any) => a.status === 'CONSENT_PENDING');
        if (pendingApp) {
          fetch(`/api/applications/${pendingApp.id}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.consent && d.consent.status === 'PENDING') {
                setActiveConsent(d.consent);
              }
            });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to real-time events via SSE
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');
      eventSource.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt.eventType === 'APPLICATION_APPROVED') {
            setAlertMessage(`🎉 Congratulations! Application ${evt.applicationId} has been APPROVED by the Municipal Officer!`);
            loadData();
          } else if (evt.eventType === 'REVENUE_FETCHED' || evt.eventType === 'MUNICIPAL_DISPATCHED') {
            loadData();
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Handle Apply Submission
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService?.code || 'BUSINESS_LICENSE',
          departmentId: 'MUNICIPAL',
          citizenId: 'CIT-3210',
          businessName,
          tradeCategory,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsApplyModalOpen(false);
        if (data.consentRequired && data.consentRequest) {
          setActiveConsent(data.consentRequest);
        }
        loadData();
      }
    } catch (err) {
      alert('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Citizen Granting DPDP Consent
  const handleGrantConsent = async (consentId: string, applicationId: string) => {
    try {
      // 1. Approve consent
      await fetch(`/api/consents/${consentId}/approve`, { method: 'POST' });

      // 2. Trigger Interoperability pipeline (RevenueAdapter -> CDM -> MunicipalAdapter)
      const verifyRes = await fetch(`/api/applications/${applicationId}/verify`, { method: 'POST' });
      const verifyData = await verifyRes.json();

      setActiveConsent(null);
      if (verifyData.success) {
        setAlertMessage(`✅ Consent granted! MahaSetu successfully verified address with Revenue Dept (Ref: ${verifyData.pipelineTelemetry?.step2_cdm?.commonModelJson?.clearances?.revenueReferenceId}) and delivered application to MuniSys!`);
      }
      loadData();
    } catch (err) {
      alert('Error processing consent');
    }
  };

  // Handle Denying Consent
  const handleDenyConsent = async (consentId: string) => {
    try {
      await fetch(`/api/consents/${consentId}/revoke`, { method: 'POST' });
      setActiveConsent(null);
      loadData();
    } catch (err) {
      alert('Error revoking consent');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Real-time celebration banner */}
      {alertMessage && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
            <span className="text-sm font-semibold">{alertMessage}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-xs px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Citizen Profile Header */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white text-xl font-bold shadow-md">
              RS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {profile?.fullName || 'Rahul Sharma'}
                </h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Citizen
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Citizen ID: <span className="font-mono font-medium text-slate-700">CIT-3210</span> • Mobile: +91 9876543210 • DigiLocker Linked
              </p>
            </div>
          </div>

          {/* Domicile & Address Badge */}
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs max-w-sm">
            <span className="text-slate-400 font-medium block text-[10px] uppercase tracking-wide">
              Official Registered Address (Revenue Records)
            </span>
            <span className="font-medium text-slate-800">
              Flat 402, Shanti Niwas, Kothrud, Pune, Maharashtra - 411038
            </span>
          </div>
        </div>
      </div>

      {/* Consent Action Required Banner (DPDP Act) */}
      {activeConsent && (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-2 border-amber-400/80 shadow-md animate-pulse-once">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500 text-white">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Consent Authorization Required (DPDP Act 2023)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
                The <span className="font-bold text-blue-900">{activeConsent.requestedByDept} Department</span> requires 
                your verified address and property tax clearance from the <span className="font-bold text-indigo-900">{activeConsent.sourceDept} Department</span> to 
                process Trade License Application <span className="font-mono font-semibold">{activeConsent.applicationId}</span>.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500">Requested fields:</span>
                {activeConsent.dataFields.map((f: string) => (
                  <span key={f} className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 font-mono text-[11px]">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handleGrantConsent(activeConsent.id, activeConsent.applicationId)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                Grant DPDP Consent
              </button>
              <button
                onClick={() => handleDenyConsent(activeConsent.id)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs sm:text-sm transition-all"
              >
                <X className="w-4 h-4" />
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Government Services Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Government Services Available via MahaSetu
            </h2>
            <p className="text-xs text-slate-500">
              Single-window application without visiting multiple departmental websites
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.code}
              className="glass-panel p-5 rounded-2xl border border-slate-200 hover:border-blue-400/60 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {srv.departmentName}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    SLA: {srv.slaDays} Days
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{srv.name}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {srv.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800 block text-[10px] uppercase">Interoperability Requirement:</span>
                  {srv.requiredClearance}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {srv.fee === 0 ? 'Fee: Free' : `Fee: ₹${srv.fee}`}
                </span>
                <button
                  onClick={() => {
                    setSelectedService(srv);
                    setIsApplyModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Apply Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Applications & Live Workflow Tracking */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Your Application Tracking & Interop Timeline
            </h2>
            <p className="text-xs text-slate-500">
              Live status synchronized directly from Departmental Core APIs
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {applications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-xs">
            No active applications found. Click &quot;Apply Now&quot; on any service above to launch an interoperable workflow!
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div
                key={app.id}
                className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-900">
                        {app.applicationNumber}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : app.status === 'PENDING_OFFICER_REVIEW'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : app.status === 'CONSENT_PENDING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.status === 'APPROVED'
                          ? 'Approved ✅'
                          : app.status === 'PENDING_OFFICER_REVIEW'
                          ? 'Municipal Officer Review 🟡'
                          : app.status === 'CONSENT_PENDING'
                          ? 'Awaiting Consent ⏳'
                          : app.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Business Establishment: <span className="font-semibold text-slate-900">{app.businessName}</span> ({app.tradeCategory})
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {app.status === 'APPROVED' && (
                      <button
                        onClick={() => setViewCertificateApp(app)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        View Trade License
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 5-Step Visual Interoperability Stepper */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                    Cross-Department Verification Pipeline
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {/* Step 1: Created */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">STEP 1</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Application</p>
                      <p className="text-[11px] text-slate-500">Details registered</p>
                    </div>

                    {/* Step 2: Consent */}
                    <div className={`p-3 rounded-xl border ${
                      app.status !== 'CONSENT_PENDING'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-amber-50 border-amber-300 glow-active'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">STEP 2</span>
                        {app.status !== 'CONSENT_PENDING' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800">Citizen Consent</p>
                      <p className="text-[11px] text-slate-500">
                        {app.status !== 'CONSENT_PENDING' ? 'Authorized' : 'Awaiting action'}
                      </p>
                    </div>

                    {/* Step 3: Revenue Verification */}
                    <div className={`p-3 rounded-xl border ${
                      app.revenueClearanceRef
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/50 border-slate-200 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">STEP 3</span>
                        {app.revenueClearanceRef ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800">RevNet Check</p>
                      <p className="text-[11px] text-slate-500">
                        {app.revenueClearanceRef ? 'Tax & Land Clear' : 'Pending interop'}
                      </p>
                    </div>

                    {/* Step 4: Municipal Verification */}
                    <div className={`p-3 rounded-xl border ${
                      app.status === 'PENDING_OFFICER_REVIEW'
                        ? 'bg-blue-50 border-blue-300'
                        : app.status === 'APPROVED'
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/50 border-slate-200 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">STEP 4</span>
                        {app.status === 'APPROVED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : app.status === 'PENDING_OFFICER_REVIEW' ? (
                          <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800">MuniSys Review</p>
                      <p className="text-[11px] text-slate-500">Ward Licensing Officer</p>
                    </div>

                    {/* Step 5: Sanction */}
                    <div className={`p-3 rounded-xl border ${
                      app.status === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-slate-50/50 border-slate-200 opacity-60'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-400">STEP 5</span>
                        {app.status === 'APPROVED' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800">Trade License</p>
                      <p className="text-[11px] text-slate-500">
                        {app.status === 'APPROVED' ? 'Issued' : 'Pending sanction'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit & Timeline Entries */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Live Event Log (SSE & Database Chained)
                  </span>
                  {app.timeline && app.timeline.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <div>
                        <span className="font-semibold text-slate-900">{t.details}</span>
                        <span className="text-[10px] text-slate-400 ml-2">by {t.actor}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Apply Service Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Apply for {selectedService?.name}
              </h3>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Business / Establishment Name
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Trade Category
                </label>
                <select
                  value={tradeCategory}
                  onChange={(e) => setTradeCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="COMMERCIAL_RETAIL">Commercial Retail & Services</option>
                  <option value="IT_AND_COMMUNICATIONS">IT / Software / Electronics</option>
                  <option value="FOOD_AND_BEVERAGE">Food & Hospitality Services</option>
                  <option value="MANUFACTURING_SMALL">Small-Scale Light Manufacturing</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                <span className="font-bold text-blue-900 block">
                  Notice on Automated Interoperability:
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Upon submission, MahaSetu will automatically discover that this Municipal License requires verified residential address and property-tax clearance from the 
                  <strong> Revenue Department (RevNet)</strong>. You will be prompted to grant DPDP consent.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  {submitting ? 'Initiating Workflow...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trade License Certificate Modal */}
      {viewCertificateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl border-4 border-double border-amber-600/60 space-y-6 text-center relative">
            <button
              onClick={() => setViewCertificateApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Emblem and Official Header */}
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-full bg-amber-600/10 text-amber-800 mx-auto flex items-center justify-center font-serif font-black text-xl border border-amber-500/40">
                MH
              </div>
              <h3 className="font-serif text-lg font-bold text-slate-900 tracking-wide uppercase">
                Municipal Corporation of Pune
              </h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Department of Municipal Trade Licensing
              </p>
              <div className="h-0.5 w-32 bg-amber-600 mx-auto mt-2" />
            </div>

            <div>
              <span className="text-xs uppercase text-slate-400 tracking-wider">Statutory Certificate</span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Municipal Trade & Business License
              </h2>
              <p className="text-xs font-mono font-bold text-blue-900 mt-1">
                Certificate No: {viewCertificateApp.municipalPermitRef}
              </p>
            </div>

            {/* Certificate Details Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2 font-medium">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Licensee Name:</span>
                <span className="text-slate-900 font-bold">Rahul Sharma</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Establishment Title:</span>
                <span className="text-slate-900 font-bold">{viewCertificateApp.businessName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Premises Address:</span>
                <span className="text-slate-900">Flat 402, Shanti Niwas, Kothrud, Pune - 411038</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Revenue Dept Clearance:</span>
                <span className="text-emerald-700 font-bold">
                  VERIFIED ({viewCertificateApp.revenueClearanceRef})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Issuing Authority:</span>
                <span className="text-slate-900 font-semibold">
                  Officer M. Kulkarni (Municipal Licensing Division)
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Digitally verified and generated through MahaSetu Interoperability Platform (SIH26129). 
              Tamper-evident cryptographically signed record.
            </p>

            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md"
            >
              Print / Save Certificate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
