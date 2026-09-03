'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Server,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Hash,
  RefreshCw,
  Plus,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function AdminPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testingDept, setTestingDept] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MAPPINGS' | 'INTEGRATIONS' | 'AUDIT' | 'SANDBOX'>('MAPPINGS');

  // Dynamic Rule Form
  const [newRule, setNewRule] = useState({
    sourceSystem: 'RevNet',
    sourceField: '',
    targetSystem: 'MahaSetu_CDM',
    targetField: '',
    transformation: 'DIRECT',
  });

  // Sandbox state
  const [sampleInput, setSampleInput] = useState(
    JSON.stringify(
      {
        citizen: {
          fullName: 'Ananya Deshpande',
          mobile: '9822114477',
        },
        address_record: {
          house_no: 'Bungalow 7, Model Colony',
          locality: 'Shivajinagar',
          city_name: 'Pune',
          pin: '411016',
          property_tax_cleared: true,
        },
        verification_status: 'VERIFIED_ACTIVE',
      },
      null,
      2
    )
  );
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);

  const loadData = async () => {
    try {
      const [intRes, mapRes, audRes] = await Promise.all([
        fetch('/api/integrations').then((r) => r.json()),
        fetch('/api/integrations/mappings').then((r) => r.json()),
        fetch('/api/audit-logs').then((r) => r.json()),
      ]);

      if (intRes.success) setIntegrations(intRes.integrations);
      if (mapRes.success) setMappings(mapRes.mappings);
      if (audRes.success) setAuditLogs(audRes.logs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Ping Adapter
  const handleTestPing = async (deptCode: string) => {
    setTestingDept(deptCode);
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentCode: deptCode }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      }
    } catch {
      alert('Error testing adapter');
    } finally {
      setTestingDept(null);
    }
  };

  // Run Sandbox Transformation
  const handleRunSandbox = async () => {
    try {
      const parsed = JSON.parse(sampleInput);
      const res = await fetch('/api/integrations/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceData: parsed }),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxOutput(data.transformedData);
      }
    } catch (err: any) {
      alert(`Transformation error: ${err.message}`);
    }
  };

  // Add Dynamic Mapping
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.sourceField || !newRule.targetField) return;

    const newEntry = {
      id: `FMP-0${mappings.length + 1}`,
      ...newRule,
    };
    setMappings([...mappings, newEntry]);
    setNewRule({
      sourceSystem: 'RevNet',
      sourceField: '',
      targetSystem: 'MahaSetu_CDM',
      targetField: '',
      transformation: 'DIRECT',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              MahaSetu Interoperability Administration
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
              Gateway Middleware & Schema Studio
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure dynamic JSONPath field transformations, monitor departmental adapter latency, and inspect audit non-repudiation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          {[
            { id: 'MAPPINGS', label: 'Field Mapping Studio' },
            { id: 'SANDBOX', label: 'Schema Sandbox' },
            { id: 'INTEGRATIONS', label: 'Connected Adapters' },
            { id: 'AUDIT', label: 'Cryptographic Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DYNAMIC FIELD MAPPINGS */}
      {activeTab === 'MAPPINGS' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Active Cross-Department Dynamic Field Transformations
                </h2>
                <p className="text-xs text-slate-500">
                  Rules executed at runtime to translate disparate departmental payloads into the Common Data Model (CDM)
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {mappings.length} Active Rules
              </span>
            </div>

            {/* Rules Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Rule ID</th>
                    <th className="py-2.5 px-3">Source System</th>
                    <th className="py-2.5 px-3 font-mono">Source JSON Path</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Target System</th>
                    <th className="py-2.5 px-3 font-mono">Target Field</th>
                    <th className="py-2.5 px-3">Transform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{m.id}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.sourceSystem}</td>
                      <td className="py-2.5 px-3 font-mono text-indigo-700 bg-indigo-50/40 rounded px-1">{m.sourceField}</td>
                      <td className="py-2.5 px-3 text-slate-400">→</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{m.targetSystem}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700 bg-emerald-50/40 rounded px-1">{m.targetField}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                          {m.transformation || 'DIRECT'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Dynamic Rule Form */}
            <form onSubmit={handleAddRule} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Register New Schema Mapping Rule
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Source System</label>
                  <select
                    value={newRule.sourceSystem}
                    onChange={(e) => setNewRule({ ...newRule, sourceSystem: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="RevNet">RevNet (Revenue)</option>
                    <option value="MahaSetu_CDM">MahaSetu CDM</option>
                    <option value="KaushalPortal">KaushalPortal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Source Field Path</label>
                  <input
                    type="text"
                    placeholder="e.g. land_holding_sqft"
                    value={newRule.sourceField}
                    onChange={(e) => setNewRule({ ...newRule, sourceField: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Target System</label>
                  <select
                    value={newRule.targetSystem}
                    onChange={(e) => setNewRule({ ...newRule, targetSystem: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="MahaSetu_CDM">MahaSetu CDM</option>
                    <option value="MuniSys">MuniSys (Municipal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Target Field Path</label>
                  <input
                    type="text"
                    placeholder="e.g. clearances.landArea"
                    value={newRule.targetField}
                    onChange={(e) => setNewRule({ ...newRule, targetField: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Rule
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEMA SANDBOX */}
      {activeTab === 'SANDBOX' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Interactive Data Mapping Engine Sandbox
            </h2>
            <p className="text-xs text-slate-500">
              Paste arbitrary departmental JSON and execute dynamic normalization into the Common Data Model in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input JSON */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Source Idiosyncratic Payload (RevNet JSON)</span>
                <button
                  onClick={handleRunSandbox}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 text-white text-xs font-bold"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Execute Translation
                </button>
              </div>
              <textarea
                rows={14}
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Output Normalized */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Normalized Output (MahaSetu Common Data Model)
              </span>
              <div className="h-[275px] overflow-auto p-3 font-mono text-xs bg-slate-950 text-amber-300 rounded-xl border border-slate-800">
                {sandboxOutput ? (
                  <pre>{JSON.stringify(sandboxOutput, null, 2)}</pre>
                ) : (
                  <div className="text-slate-500 text-center pt-24 text-xs">
                    Click &quot;Execute Translation&quot; to test normalization rules.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONNECTED ADAPTERS */}
      {activeTab === 'INTEGRATIONS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {integrations.map((item) => (
            <div
              key={item.departmentCode}
              className="glass-panel p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {item.departmentCode}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {item.latencyMs}ms
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{item.systemName}</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">{item.endpointUrl}</p>
                <div className="mt-3 p-2 rounded bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  Status: <span className="font-bold text-emerald-700">HEALTHY & CONNECTED</span>
                </div>
              </div>

              <button
                onClick={() => handleTestPing(item.departmentCode)}
                disabled={testingDept === item.departmentCode}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingDept === item.departmentCode ? 'animate-spin' : ''}`} />
                {testingDept === item.departmentCode ? 'Pinging...' : 'Ping Adapter'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: CRYPTOGRAPHIC AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Non-Repudiation Immutable Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Every sensitive cross-department data share is cryptographically hash-chained (SHA-256) for audit compliance.
              </p>
            </div>
            <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-900">{log.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400">Actor: {log.actorRole} ({log.actorId})</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-slate-700 font-medium">
                  Purpose: <span className="text-slate-900">{log.purpose}</span> • Dept: <span className="font-semibold">{log.department}</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-500">
                  <div className="truncate">
                    Hash: <span className="text-slate-800">{log.hash}</span>
                  </div>
                  <div className="truncate">
                    PrevHash: <span className="text-slate-400">{log.prevHash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
