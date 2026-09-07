'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  Download,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

type Service = {
  code: string;
  name: string;
  departmentName: string;
  description: string;
  requiredClearance: string;
  slaDays: number;
  fee: number;
};

type Application = {
  id: string;
  applicationNumber: string;
  status: string;
  businessName: string;
  tradeCategory: string;
  revenueClearanceRef?: string | null;
  municipalPermitRef?: string | null;
  serviceName?: string;
  departmentId: string;
  createdAt: string;
  timeline?: Array<{ details: string; actor: string }>;
  consent?: {
    id: string;
    status: string;
    requestedByDept: string;
    sourceDept: string;
    purpose: string;
    dataFields: string[];
    applicationId: string;
  } | null;
};

export default function CitizenPortalPage() {
  const [profile, setProfile] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeConsent, setActiveConsent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [tradeCategory, setTradeCategory] = useState('COMMERCIAL_RETAIL');
  const [submitting, setSubmitting] = useState(false);
  const [viewCertificateApp, setViewCertificateApp] = useState<Application | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [profRes, srvRes, appRes] = await Promise.all([
        fetch('/api/citizens/me').then((r) => r.json()),
        fetch('/api/services').then((r) => r.json()),
        fetch('/api/applications').then((r) => r.json()),
      ]);
      if (profRes.success) setProfile(profRes.profile);
      if (srvRes.success) setServices(srvRes.services);
      if (appRes.success) {
        setApplications(appRes.applications);
        const pending = appRes.applications.find((a: Application) => a.status === 'CONSENT_PENDING' && a.consent?.status === 'PENDING');
        setActiveConsent(pending?.consent || null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events/stream');
      eventSource.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (['APPLICATION_APPROVED', 'APPLICATION_REJECTED', 'REVENUE_FETCHED', 'MUNICIPAL_DISPATCHED'].includes(evt.eventType)) {
            if (evt.eventType === 'APPLICATION_APPROVED') {
              setAlertMessage(`Application ${evt.applicationId} has been approved.`);
            }
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

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService?.code,
          businessName: selectedService?.code === 'BUSINESS_LICENSE' ? businessName : profile?.fullName || selectedService?.name,
          tradeCategory: selectedService?.code === 'BUSINESS_LICENSE' ? tradeCategory : '',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setFormError(data.error || 'Could not submit application');
        return;
      }
      setIsApplyModalOpen(false);
      if (data.consentRequest) setActiveConsent(data.consentRequest);
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleGrantConsent = async (consentId: string, applicationId: string) => {
    const approve = await fetch(`/api/consents/${consentId}/approve`, { method: 'POST' });
    const approveData = await approve.json();
    if (!approveData.success) {
      setAlertMessage(approveData.error || 'Could not grant consent');
      return;
    }
    const verifyRes = await fetch(`/api/applications/${applicationId}/verify`, { method: 'POST' });
    const verifyData = await verifyRes.json();
    setActiveConsent(null);
    if (verifyData.success) {
      const ref = verifyData.pipelineTelemetry?.step2_cdm?.commonModelJson?.clearances?.revenueReferenceId;
      setAlertMessage(ref ? `Consent granted. Records exchanged (ref ${ref}).` : 'Consent granted. Application forwarded for officer review.');
    } else {
      setAlertMessage(verifyData.error || 'Interop pipeline failed');
    }
    loadData();
  };

  const handleDenyConsent = async (consentId: string) => {
    await fetch(`/api/consents/${consentId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deny: true }),
    });
    setActiveConsent(null);
    loadData();
  };

  const statusLabel = (status: string) => {
    if (status === 'APPROVED') return 'Approved';
    if (status === 'PENDING_OFFICER_REVIEW') return 'Officer review';
    if (status === 'CONSENT_PENDING') return 'Awaiting consent';
    if (status === 'REJECTED') return 'Rejected';
    return status;
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-16 text-sm text-slate-500">Loading your services…</div>;
  }

  const addr = profile?.address;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {alertMessage && (
        <div className="p-4 rounded-xl bg-emerald-700 text-white text-sm flex items-center justify-between">
          <span>{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="text-xs px-2 py-1 rounded bg-white/20">
            Dismiss
          </button>
        </div>
      )}

      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{profile?.fullName}</h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified citizen
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {profile?.email} · {profile?.mobile}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs max-w-sm">
            <span className="text-slate-400 font-medium block text-[10px] uppercase">Registered address</span>
            <span className="font-medium text-slate-800">
              {addr ? `${addr.line1}, ${addr.locality}, ${addr.city}, ${addr.state} - ${addr.postalCode}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {activeConsent && (
        <div className="p-6 rounded-2xl border-2 border-amber-400 bg-amber-50 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-slate-900">Consent required</h3>
          </div>
          <p className="text-sm text-slate-700">{activeConsent.purpose}</p>
          <p className="text-xs text-slate-600">
            {activeConsent.requestedByDept} is requesting records from {activeConsent.sourceDept}.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {(activeConsent.dataFields || []).map((f: string) => (
              <span key={f} className="px-2 py-0.5 rounded bg-white border font-mono">
                {f}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleGrantConsent(activeConsent.id, activeConsent.applicationId)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold"
            >
              <Check className="w-4 h-4" /> Grant consent
            </button>
            <button
              onClick={() => handleDenyConsent(activeConsent.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-sm"
            >
              <X className="w-4 h-4" /> Deny
            </button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Available services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div key={srv.code} className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">{srv.departmentName}</span>
                  <span className="text-[11px] text-slate-500">SLA {srv.slaDays} days</span>
                </div>
                <h3 className="font-bold text-slate-900">{srv.name}</h3>
                <p className="text-xs text-slate-600">{srv.description}</p>
                <p className="text-[11px] text-slate-600 bg-slate-50 border rounded-lg p-2">
                  Required records: {srv.requiredClearance}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t flex items-center justify-between">
                <span className="text-xs font-bold">{srv.fee === 0 ? 'No fee' : `Fee ₹${srv.fee}`}</span>
                <button
                  onClick={() => {
                    setSelectedService(srv);
                    setFormError(null);
                    setIsApplyModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Apply <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Your applications</h2>
          <button onClick={loadData} className="flex items-center gap-1.5 text-xs text-slate-600">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        {applications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed text-slate-500 text-xs">
            No applications yet. Choose a service above to start.
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div key={app.id} className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="font-mono text-sm font-bold text-blue-900">{app.applicationNumber}</span>
                    <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100">{statusLabel(app.status)}</span>
                    <p className="text-xs text-slate-600 mt-1">
                      {app.serviceName} {app.businessName ? `· ${app.businessName}` : ''}
                    </p>
                  </div>
                  {app.status === 'APPROVED' && (
                    <button
                      onClick={() => setViewCertificateApp(app)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> View certificate
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    ['Submitted', true],
                    ['Consent', app.status !== 'CONSENT_PENDING'],
                    ['Department records', Boolean(app.revenueClearanceRef || app.status === 'PENDING_OFFICER_REVIEW' || app.status === 'APPROVED')],
                    ['Decision', app.status === 'APPROVED' || app.status === 'REJECTED'],
                  ].map(([label, done]) => (
                    <div key={String(label)} className="p-3 rounded-xl bg-slate-50 border">
                      <div className="flex justify-between mb-1">
                        {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Clock className="w-4 h-4 text-slate-400" />}
                      </div>
                      <p className="font-bold text-slate-800">{label as string}</p>
                    </div>
                  ))}
                </div>
                <div className="text-xs space-y-1 bg-slate-50 rounded-xl p-3 border">
                  {(app.timeline || []).map((t, idx) => (
                    <div key={idx}>
                      <span className="font-medium text-slate-900">{t.details}</span>
                      <span className="text-slate-400 ml-2">— {t.actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-bold">Apply for {selectedService?.name}</h3>
              <button onClick={() => setIsApplyModalOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApply} className="space-y-4 text-sm">
              {selectedService?.code === 'BUSINESS_LICENSE' && (
                <>
                  <div>
                    <label className="block font-medium mb-1">Business / establishment name</label>
                    <input
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border"
                    />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Trade category</label>
                    <select value={tradeCategory} onChange={(e) => setTradeCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white">
                      <option value="COMMERCIAL_RETAIL">Commercial retail</option>
                      <option value="IT_AND_COMMUNICATIONS">IT / communications</option>
                      <option value="FOOD_AND_BEVERAGE">Food & hospitality</option>
                      <option value="MANUFACTURING_SMALL">Small manufacturing</option>
                    </select>
                  </div>
                </>
              )}
              <p className="text-xs text-slate-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
                You will be asked to grant consent before any other department can read your records.
              </p>
              {formError && <p className="text-sm text-rose-600">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsApplyModalOpen(false)} className="px-4 py-2 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 rounded-lg bg-blue-600 text-white font-bold">
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewCertificateApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 space-y-4 text-center relative">
            <button className="absolute top-4 right-4" onClick={() => setViewCertificateApp(null)}>
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold">{viewCertificateApp.serviceName || 'Certificate'}</h2>
            <p className="font-mono text-sm text-blue-900">{viewCertificateApp.municipalPermitRef || viewCertificateApp.revenueClearanceRef}</p>
            <div className="text-left text-xs space-y-2 bg-slate-50 p-4 rounded-xl border">
              <div className="flex justify-between"><span>Holder</span><span className="font-bold">{profile?.fullName}</span></div>
              <div className="flex justify-between"><span>Reference</span><span className="font-mono">{viewCertificateApp.applicationNumber}</span></div>
              {viewCertificateApp.businessName && (
                <div className="flex justify-between"><span>Establishment</span><span className="font-bold">{viewCertificateApp.businessName}</span></div>
              )}
              {viewCertificateApp.revenueClearanceRef && (
                <div className="flex justify-between"><span>Revenue clearance</span><span>{viewCertificateApp.revenueClearanceRef}</span></div>
              )}
            </div>
            <button onClick={() => window.print()} className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold">
              Print / save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
