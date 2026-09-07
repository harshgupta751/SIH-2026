'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Play, Plus, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testingDept, setTestingDept] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MAPPINGS' | 'SANDBOX' | 'INTEGRATIONS' | 'AUDIT'>('MAPPINGS');
  const [newRule, setNewRule] = useState({
    sourceSystem: 'RevNet',
    sourceField: '',
    targetSystem: 'MahaSetu_CDM',
    targetField: '',
    transformation: 'DIRECT',
    departmentCode: 'REVENUE',
  });
  const [sampleInput, setSampleInput] = useState(
    JSON.stringify(
      {
        citizen: { fullName: '', mobile: '' },
        address_record: { city_name: '', pin: '', property_tax_cleared: true },
      },
      null,
      2
    )
  );
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);

  const loadData = async () => {
    const [intRes, mapRes, audRes] = await Promise.all([
      fetch('/api/integrations').then((r) => r.json()),
      fetch('/api/integrations/mappings').then((r) => r.json()),
      fetch('/api/audit-logs').then((r) => r.json()),
    ]);
    if (intRes.success) setIntegrations(intRes.integrations);
    if (mapRes.success) setMappings(mapRes.mappings);
    if (audRes.success) setAuditLogs(audRes.logs);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestPing = async (deptCode: string) => {
    setTestingDept(deptCode);
    await fetch('/api/integrations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentCode: deptCode }),
    });
    await loadData();
    setTestingDept(null);
  };

  const handleRunSandbox = async () => {
    const parsed = JSON.parse(sampleInput);
    const res = await fetch('/api/integrations/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceData: parsed }),
    });
    const data = await res.json();
    if (data.success) setSandboxOutput(data.transformedData);
    else alert(data.error);
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.sourceField || !newRule.targetField) return;
    const res = await fetch('/api/integrations/mappings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRule),
    });
    const data = await res.json();
    if (data.success) {
      setNewRule({ ...newRule, sourceField: '', targetField: '' });
      loadData();
    } else alert(data.error);
  };

  const tabs = [
    ['MAPPINGS', 'Field mappings'],
    ['SANDBOX', 'Schema sandbox'],
    ['INTEGRATIONS', 'Connectors'],
    ['AUDIT', 'Audit trail'],
  ] as const;

  return (
    <div className="ms-page space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="ms-label mb-2">Administration</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink">Gateway</h1>
          <p className="text-sm text-mute mt-1">Field mappings, connector health, and audit trail</p>
        </div>
        <button onClick={loadData} className="ms-btn ms-btn-secondary h-9 text-xs self-start">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-line pb-px">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
              activeTab === id ? 'border-accent text-ink' : 'border-transparent text-mute hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'MAPPINGS' && (
        <div className="ms-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-line text-left text-mute">
                  <th className="py-3 px-4 font-medium">Source</th>
                  <th className="py-3 px-4 font-medium">Path</th>
                  <th className="py-3 px-4 font-medium">Target</th>
                  <th className="py-3 px-4 font-medium">Field</th>
                  <th className="py-3 px-4 font-medium">Transform</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="py-3 px-4">{m.sourceSystem}</td>
                    <td className="py-3 px-4 font-mono text-xs text-mute">{m.sourceField}</td>
                    <td className="py-3 px-4">{m.targetSystem}</td>
                    <td className="py-3 px-4 font-mono text-xs">{m.targetField}</td>
                    <td className="py-3 px-4 text-mute">{m.transformation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 p-4 border-t border-line bg-canvas">
            <select
              value={newRule.sourceSystem}
              onChange={(e) => setNewRule({ ...newRule, sourceSystem: e.target.value })}
              className="ms-input"
            >
              <option>RevNet</option>
              <option>MahaSetu_CDM</option>
              <option>KaushalPortal</option>
            </select>
            <input
              placeholder="source path"
              value={newRule.sourceField}
              onChange={(e) => setNewRule({ ...newRule, sourceField: e.target.value })}
              className="ms-input font-mono"
            />
            <select
              value={newRule.targetSystem}
              onChange={(e) => setNewRule({ ...newRule, targetSystem: e.target.value })}
              className="ms-input"
            >
              <option>MahaSetu_CDM</option>
              <option>MuniSys</option>
            </select>
            <input
              placeholder="target path"
              value={newRule.targetField}
              onChange={(e) => setNewRule({ ...newRule, targetField: e.target.value })}
              className="ms-input font-mono"
            />
            <button className="ms-btn ms-btn-primary">
              <Plus className="w-3.5 h-3.5" /> Add rule
            </button>
          </form>
        </div>
      )}

      {activeTab === 'SANDBOX' && (
        <div className="ms-card p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Source JSON</span>
              <button onClick={handleRunSandbox} className="ms-btn ms-btn-primary h-8 text-xs">
                <Play className="w-3 h-3" /> Transform
              </button>
            </div>
            <textarea rows={14} value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} className="ms-input font-mono text-xs min-h-[275px]" />
          </div>
          <div>
            <span className="text-sm font-medium">Normalized output</span>
            <pre className="mt-2 h-[275px] overflow-auto p-3 font-mono text-xs bg-ink text-copper rounded-ms">
              {sandboxOutput ? JSON.stringify(sandboxOutput, null, 2) : 'Run a transformation to preview the common model.'}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'INTEGRATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {integrations.map((item) => (
            <div key={item.departmentCode} className="ms-card p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="ms-chip">{item.departmentCode}</span>
                <span className="text-xs text-success flex items-center gap-1 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.latencyMs}ms
                </span>
              </div>
              <h3 className="font-medium text-ink">{item.systemName}</h3>
              <p className="text-xs font-mono text-mute break-all">{item.endpointUrl}</p>
              <p className="text-sm text-mute">Status: {item.status}</p>
              <button onClick={() => handleTestPing(item.departmentCode)} className="ms-btn ms-btn-secondary w-full">
                {testingDept === item.departmentCode ? 'Pinging…' : 'Ping connector'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="ms-card p-4 text-sm space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="font-mono text-xs text-ink">{log.action}</span>
                <span className="text-mute text-xs">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-mute">
                {log.purpose} · {log.actorRole}
              </p>
              <p className="font-mono text-[10px] truncate text-mute">hash {log.hash}</p>
              <p className="font-mono text-[10px] truncate text-mute">prev {log.prevHash}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
