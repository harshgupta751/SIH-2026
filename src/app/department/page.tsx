'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Search } from 'lucide-react';

export default function DepartmentPortalPage() {
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [officerNotes, setOfficerNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchMobile, setSearchMobile] = useState('');
  const [revenueRecord, setRevenueRecord] = useState<any>(null);

  const loadApplications = async () => {
    const res = await fetch('/api/applications');
    const data = await res.json();
    if (data.success) {
      setApplications(data.applications);
      setSelectedApp((prev: any) => {
        if (prev) return data.applications.find((a: any) => a.id === prev.id) || data.applications[0] || null;
        return data.applications[0] || null;
      });
    }
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.user);
      });
    loadApplications();
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events/stream');
      es.onmessage = () => loadApplications();
    } catch {
      // ignore
    }
    return () => {
      if (es) es.close();
    };
  }, []);

  const handleApprove = async (appId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/applications/${appId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: officerNotes || 'Statutory checks completed. Sanctioned.' }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Approved. Reference ${data.licenseNumber}`);
        loadApplications();
      } else setStatusMessage(data.error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (appId: string) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/applications/${appId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: officerNotes || 'Does not meet statutory requirements.' }),
      });
      const data = await res.json();
      setStatusMessage(data.success ? 'Application rejected.' : data.error);
      loadApplications();
    } finally {
      setProcessing(false);
    }
  };

  const handleRevenueSearch = async () => {
    const res = await fetch(`/api/mock/revenue/citizens/${searchMobile}`);
    if (res.ok) setRevenueRecord(await res.json());
    else setRevenueRecord({ error: 'No record found' });
  };

  const deptLabel =
    user?.role === 'OFFICER_REVENUE'
      ? 'Revenue department'
      : user?.role === 'OFFICER_EMPLOYMENT'
      ? 'Employment department'
      : 'Municipal department';

  const showRevenueLookup = user?.role === 'OFFICER_REVENUE' || user?.role === 'ADMIN';

  return (
    <div className="ms-page space-y-6">
      <div>
        <p className="ms-label mb-2">Officer console</p>
        <h1 className="font-display text-2xl sm:text-3xl text-ink">{deptLabel}</h1>
        <p className="text-sm text-mute mt-1">{user?.name}</p>
      </div>

      {statusMessage && (
        <div className="ms-card px-4 py-3 flex items-start sm:items-center justify-between gap-3 text-sm">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="ms-btn ms-btn-ghost h-8 px-2 text-xs shrink-0">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="ms-label">Queue ({applications.length})</h2>
            <button onClick={loadApplications} className="text-mute hover:text-ink" aria-label="Refresh queue">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`w-full text-left p-4 rounded-ms border transition ${
                selectedApp?.id === app.id ? 'border-accent bg-accent-muted' : 'border-line bg-surface hover:bg-elevated'
              }`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-mono text-[11px] text-mute">{app.applicationNumber}</span>
                <span className="text-[10px] uppercase tracking-wide text-mute">{String(app.status || '').replace(/_/g, ' ')}</span>
              </div>
              <h3 className="font-medium text-sm mt-1.5 text-ink">{app.businessName || app.serviceName}</h3>
              <p className="text-xs text-mute mt-0.5">{app.citizenName}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-8 space-y-6">
          {selectedApp ? (
            <div className="ms-card p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="font-display text-2xl text-ink">{selectedApp.businessName || selectedApp.serviceName}</h2>
                <p className="text-xs font-mono text-mute mt-1">{selectedApp.applicationNumber}</p>
                <p className="text-sm mt-2 text-mute">
                  Applicant: {selectedApp.citizenName} · {selectedApp.citizenMobile}
                </p>
              </div>
              <div className="p-4 rounded-ms bg-ink text-canvas text-sm space-y-2">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-60">Cross-department verification</h3>
                <p>Revenue clearance: {selectedApp.revenueClearanceRef || 'Not yet linked'}</p>
                <p>Municipal / permit reference: {selectedApp.municipalPermitRef || 'Not yet issued'}</p>
                <p>Status: {String(selectedApp.status || '').replace(/_/g, ' ')}</p>
              </div>
              <textarea
                rows={3}
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="Officer remarks"
                className="ms-input"
              />
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={processing || selectedApp.status === 'APPROVED' || selectedApp.status === 'REJECTED'}
                  className="ms-btn ms-btn-danger"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={processing || selectedApp.status !== 'PENDING_OFFICER_REVIEW'}
                  className="ms-btn ms-btn-success"
                >
                  <CheckCircle2 className="w-4 h-4" /> Sanction
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-line rounded-ms p-12 text-center text-sm text-mute">
              No applications in your department queue.
            </div>
          )}

          {showRevenueLookup && (
            <div className="ms-card p-5 sm:p-6 space-y-4">
              <h2 className="font-medium text-ink">Revenue record lookup</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  placeholder="Citizen mobile"
                  className="ms-input flex-1"
                />
                <button onClick={handleRevenueSearch} className="ms-btn ms-btn-primary">
                  <Search className="w-3.5 h-3.5" /> Query
                </button>
              </div>
              {revenueRecord && (
                <pre className="text-[11px] bg-ink text-copper p-3 rounded-ms overflow-auto font-mono max-h-80">
                  {JSON.stringify(revenueRecord, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
