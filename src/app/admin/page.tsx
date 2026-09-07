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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="glass-panel p-6 rounded-2xl">
        <h1 className="text-2xl font-extrabold">Gateway administration</h1>
        <p className="text-xs text-slate-500 mt-1">Field mappings, connector health, and audit trail</p>
        <div className="flex gap-2 mt-6 pt-4 border-t overflow-x-auto">
          {[
            ['MAPPINGS', 'Field mappings'],
            ['SANDBOX', 'Schema sandbox'],
            ['INTEGRATIONS', 'Connectors'],
            ['AUDIT', 'Audit trail'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
          <button onClick={loadData} className="ml-auto flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {activeTab === 'MAPPINGS' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Source</th>
                <th className="py-2">Path</th>
                <th className="py-2">Target</th>
                <th className="py-2">Field</th>
                <th className="py-2">Transform</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="py-2">{m.sourceSystem}</td>
                  <td className="py-2 font-mono">{m.sourceField}</td>
                  <td className="py-2">{m.targetSystem}</td>
                  <td className="py-2 font-mono">{m.targetField}</td>
                  <td className="py-2">{m.transformation}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={handleAddRule} className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            <select
              value={newRule.sourceSystem}
              onChange={(e) => setNewRule({ ...newRule, sourceSystem: e.target.value })}
              className="border rounded-lg px-2 py-1.5"
            >
              <option>RevNet</option>
              <option>MahaSetu_CDM</option>
              <option>KaushalPortal</option>
            </select>
            <input
              placeholder="source path"
              value={newRule.sourceField}
              onChange={(e) => setNewRule({ ...newRule, sourceField: e.target.value })}
              className="border rounded-lg px-2 py-1.5 font-mono"
            />
            <select
              value={newRule.targetSystem}
              onChange={(e) => setNewRule({ ...newRule, targetSystem: e.target.value })}
              className="border rounded-lg px-2 py-1.5"
            >
              <option>MahaSetu_CDM</option>
              <option>MuniSys</option>
            </select>
            <input
              placeholder="target path"
              value={newRule.targetField}
              onChange={(e) => setNewRule({ ...newRule, targetField: e.target.value })}
              className="border rounded-lg px-2 py-1.5 font-mono"
            />
            <button className="flex items-center justify-center gap-1 bg-blue-600 text-white rounded-lg font-bold">
              <Plus className="w-3.5 h-3.5" /> Add rule
            </button>
          </form>
        </div>
      )}

      {activeTab === 'SANDBOX' && (
        <div className="glass-panel p-6 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold">Source JSON</span>
              <button onClick={handleRunSandbox} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-bold">
                <Play className="w-3 h-3" /> Transform
              </button>
            </div>
            <textarea rows={14} value={sampleInput} onChange={(e) => setSampleInput(e.target.value)} className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 rounded-xl" />
          </div>
          <div>
            <span className="text-xs font-bold">Normalized output</span>
            <pre className="mt-2 h-[275px] overflow-auto p-3 font-mono text-xs bg-slate-950 text-amber-300 rounded-xl">
              {sandboxOutput ? JSON.stringify(sandboxOutput, null, 2) : 'Run a transformation to preview the common model.'}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'INTEGRATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrations.map((item) => (
            <div key={item.departmentCode} className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100">{item.departmentCode}</span>
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {item.latencyMs}ms
                </span>
              </div>
              <h3 className="font-bold">{item.systemName}</h3>
              <p className="text-xs font-mono text-slate-500">{item.endpointUrl}</p>
              <p className="text-xs">Status: {item.status}</p>
              <button
                onClick={() => handleTestPing(item.departmentCode)}
                className="w-full py-2 rounded-lg bg-slate-100 text-xs font-bold"
              >
                {testingDept === item.departmentCode ? 'Pinging…' : 'Ping connector'}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-slate-50 border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-mono font-bold">{log.action}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <p>
                {log.purpose} · {log.actorRole}
              </p>
              <p className="font-mono text-[10px] truncate">hash {log.hash}</p>
              <p className="font-mono text-[10px] truncate text-slate-400">prev {log.prevHash}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
