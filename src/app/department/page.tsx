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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="glass-panel p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold text-slate-900">Officer console</h1>
        <p className="text-xs text-slate-500 mt-1">
          {user?.name} · {deptLabel}
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-700 text-white text-sm flex justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase">Queue ({applications.length})</h2>
            <button onClick={loadApplications}>
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className={`w-full text-left p-4 rounded-xl border ${
                selectedApp?.id === app.id ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex justify-between">
                <span className="font-mono text-xs font-bold">{app.applicationNumber}</span>
                <span className="text-[9px] font-bold uppercase">{app.status}</span>
              </div>
              <h3 className="font-bold text-sm mt-1">{app.businessName || app.serviceName}</h3>
              <p className="text-xs text-slate-500">{app.citizenName}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedApp ? (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div>
                <h2 className="text-xl font-bold">{selectedApp.businessName || selectedApp.serviceName}</h2>
                <p className="text-xs font-mono text-slate-500">{selectedApp.applicationNumber}</p>
                <p className="text-xs mt-1">
                  Applicant: {selectedApp.citizenName} · {selectedApp.citizenMobile}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-slate-900 text-white text-xs space-y-2">
                <h3 className="font-bold uppercase tracking-wide text-sm">Cross-department verification</h3>
                <p>Revenue clearance: {selectedApp.revenueClearanceRef || 'Not yet linked'}</p>
                <p>Municipal / permit reference: {selectedApp.municipalPermitRef || 'Not yet issued'}</p>
                <p>Status: {selectedApp.status}</p>
              </div>
              <textarea
                rows={3}
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="Officer remarks"
                className="w-full p-3 rounded-xl border text-xs"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={processing || selectedApp.status === 'APPROVED' || selectedApp.status === 'REJECTED'}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-100 text-rose-700 text-xs font-bold disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={processing || selectedApp.status !== 'PENDING_OFFICER_REVIEW'}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" /> Sanction
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed rounded-2xl text-xs text-slate-400">
              No applications in your department queue.
            </div>
          )}

          {showRevenueLookup && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h2 className="font-bold">Revenue record lookup</h2>
              <div className="flex gap-2">
                <input
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value)}
                  placeholder="Citizen mobile"
                  className="flex-1 px-3 py-2 rounded-xl border text-xs"
                />
                <button onClick={handleRevenueSearch} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-indigo-700 text-white text-xs font-bold">
                  <Search className="w-3.5 h-3.5" /> Query
                </button>
              </div>
              {revenueRecord && (
                <pre className="text-[11px] bg-slate-900 text-amber-200 p-3 rounded-xl overflow-auto">
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
