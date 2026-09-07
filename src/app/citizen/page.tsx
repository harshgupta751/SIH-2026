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

function statusTone(status: string) {
  if (status === 'APPROVED') return 'text-success';
  if (status === 'REJECTED') return 'text-danger';
  if (status === 'CONSENT_PENDING') return 'text-warn';
  return 'text-copper';
}

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
    return <div className="ms-page text-sm text-mute">Loading your services…</div>;
  }

  const addr = profile?.address;

  return (
    <div className="ms-page space-y-8">
      {alertMessage && (
        <div className="ms-card px-4 py-3 flex items-start sm:items-center justify-between gap-3 text-sm">
          <span className="text-ink">{alertMessage}</span>
          <button onClick={() => setAlertMessage(null)} className="ms-btn ms-btn-ghost h-8 px-2 text-xs shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <div className="ms-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="ms-label mb-2">Citizen portal</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl text-ink">{profile?.fullName}</h1>
              <span className="ms-chip text-success border-line">
                <ShieldCheck className="w-3 h-3" /> Verified citizen
              </span>
            </div>
            <p className="text-sm text-mute mt-2">
              {profile?.email} · {profile?.mobile}
            </p>
          </div>
          <div className="max-w-sm">
            <span className="ms-label">Registered address</span>
            <p className="mt-1.5 text-sm text-ink leading-relaxed">
              {addr ? `${addr.line1}, ${addr.locality}, ${addr.city}, ${addr.state} - ${addr.postalCode}` : '—'}
            </p>
          </div>
        </div>
      </div>

      {activeConsent && (
        <div className="ms-card p-5 sm:p-6 space-y-4" style={{ borderColor: 'var(--copper)' }}>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-copper" />
            <h3 className="font-medium text-ink">Consent required</h3>
          </div>
          <p className="text-sm text-ink leading-relaxed">{activeConsent.purpose}</p>
          <p className="text-sm text-mute">
            {activeConsent.requestedByDept} is requesting records from {activeConsent.sourceDept}.
          </p>
          <div className="flex flex-wrap gap-2">
            {(activeConsent.dataFields || []).map((f: string) => (
              <span key={f} className="ms-chip font-mono">
                {f}
              </span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={() => handleGrantConsent(activeConsent.id, activeConsent.applicationId)}
              className="ms-btn ms-btn-success"
            >
              <Check className="w-4 h-4" /> Grant consent
            </button>
            <button onClick={() => handleDenyConsent(activeConsent.id)} className="ms-btn ms-btn-secondary">
              <X className="w-4 h-4" /> Deny
            </button>
          </div>
        </div>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-ink">Available services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div key={srv.code} className="ms-card p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="ms-chip">{srv.departmentName}</span>
                  <span className="text-[11px] text-mute font-mono">SLA {srv.slaDays}d</span>
                </div>
                <h3 className="font-medium text-ink leading-snug">{srv.name}</h3>
                <p className="text-sm text-mute leading-relaxed">{srv.description}</p>
                <p className="text-[12px] text-mute border border-line rounded-ms p-2.5 bg-canvas">
                  Required records: {srv.requiredClearance}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
                <span className="text-sm text-ink">{srv.fee === 0 ? 'No fee' : `Fee ₹${srv.fee}`}</span>
                <button
                  onClick={() => {
                    setSelectedService(srv);
                    setFormError(null);
                    setIsApplyModalOpen(true);
                  }}
                  className="ms-btn ms-btn-primary h-9 px-3 text-xs"
                >
                  Apply <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-ink">Your applications</h2>
          <button onClick={loadData} className="ms-btn ms-btn-ghost h-9 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
        {applications.length === 0 ? (
          <div className="border border-dashed border-line rounded-ms p-10 text-center text-sm text-mute">
            No applications yet. Choose a service above to start.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="ms-card p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="font-mono text-sm text-ink">{app.applicationNumber}</span>
                    <span className={`ml-2 text-[11px] font-medium ${statusTone(app.status)}`}>{statusLabel(app.status)}</span>
                    <p className="text-sm text-mute mt-1">
                      {app.serviceName} {app.businessName ? `· ${app.businessName}` : ''}
                    </p>
                  </div>
                  {app.status === 'APPROVED' && (
                    <button onClick={() => setViewCertificateApp(app)} className="ms-btn ms-btn-success h-9 text-xs self-start">
                      <Download className="w-3.5 h-3.5" /> View certificate
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ['Submitted', true],
                    ['Consent', app.status !== 'CONSENT_PENDING'],
                    ['Department records', Boolean(app.revenueClearanceRef || app.status === 'PENDING_OFFICER_REVIEW' || app.status === 'APPROVED')],
                    ['Decision', app.status === 'APPROVED' || app.status === 'REJECTED'],
                  ].map(([label, done]) => (
                    <div key={String(label)} className="p-3 rounded-ms border border-line bg-canvas">
                      {done ? <CheckCircle2 className="w-4 h-4 text-success mb-2" /> : <Clock className="w-4 h-4 text-mute mb-2" />}
                      <p className="text-xs font-medium text-ink">{label as string}</p>
                    </div>
                  ))}
                </div>
                <div className="text-sm space-y-2 border border-line rounded-ms p-3 bg-canvas">
                  {(app.timeline || []).map((t, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:gap-2">
                      <span className="text-ink">{t.details}</span>
                      <span className="text-mute font-mono text-[11px] sm:ml-auto shrink-0">— {t.actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {isApplyModalOpen && (
        <div className="ms-overlay no-print">
          <div className="ms-modal">
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-display text-xl text-ink">Apply for {selectedService?.name}</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-mute hover:text-ink" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleApply} className="space-y-4">
              {selectedService?.code === 'BUSINESS_LICENSE' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Business / establishment name</label>
                    <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="ms-input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Trade category</label>
                    <select value={tradeCategory} onChange={(e) => setTradeCategory(e.target.value)} className="ms-input">
                      <option value="COMMERCIAL_RETAIL">Commercial retail</option>
                      <option value="IT_AND_COMMUNICATIONS">IT / communications</option>
                      <option value="FOOD_AND_BEVERAGE">Food & hospitality</option>
                      <option value="MANUFACTURING_SMALL">Small manufacturing</option>
                    </select>
                  </div>
                </>
              )}
              <p className="text-sm text-mute border border-line rounded-ms p-3 bg-canvas">
                You will be asked to grant consent before any other department can read your records.
              </p>
              {formError && <p className="text-sm text-danger">{formError}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsApplyModalOpen(false)} className="ms-btn ms-btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="ms-btn ms-btn-primary">
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewCertificateApp && (
        <div className="ms-overlay no-print">
          <div className="ms-modal sm:max-w-xl text-left relative">
            <button className="absolute top-5 right-5 text-mute hover:text-ink no-print" onClick={() => setViewCertificateApp(null)} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            <p className="ms-label">Issued certificate</p>
            <h2 className="font-display text-2xl text-ink mt-2">{viewCertificateApp.serviceName || 'Certificate'}</h2>
            <p className="font-mono text-sm text-copper mt-2">{viewCertificateApp.municipalPermitRef || viewCertificateApp.revenueClearanceRef}</p>
            <div className="text-sm space-y-2.5 border border-line rounded-ms p-4 bg-canvas mt-4">
              <div className="flex justify-between gap-4"><span className="text-mute">Holder</span><span className="font-medium text-right">{profile?.fullName}</span></div>
              <div className="flex justify-between gap-4"><span className="text-mute">Reference</span><span className="font-mono text-right">{viewCertificateApp.applicationNumber}</span></div>
              {viewCertificateApp.businessName && (
                <div className="flex justify-between gap-4"><span className="text-mute">Establishment</span><span className="font-medium text-right">{viewCertificateApp.businessName}</span></div>
              )}
              {viewCertificateApp.revenueClearanceRef && (
                <div className="flex justify-between gap-4"><span className="text-mute">Revenue clearance</span><span className="font-mono text-right">{viewCertificateApp.revenueClearanceRef}</span></div>
              )}
            </div>
            <button onClick={() => window.print()} className="ms-btn ms-btn-primary w-full no-print mt-2">
              Print / save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
