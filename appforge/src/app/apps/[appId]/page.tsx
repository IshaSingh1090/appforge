'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AppConfig } from '@/types/config';

interface AppData {
  id: string;
  name: string;
  description?: string;
  status: string;
  config: AppConfig;
  createdAt: string;
  updatedAt: string;
}

export default function AppOverviewPage() {
  const params = useParams();
  const appId = params.appId as string;
  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importModel, setImportModel] = useState('');
  const [csvText, setCsvText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/apps/${appId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setApp(data.data);
      })
      .finally(() => setLoading(false));
  }, [appId]);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch(`/api/apps/${appId}/export`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Download as zip-like content (README + schema)
      const files = data.data.files as Record<string, string>;
      const content = Object.entries(files)
        .map(([name, content]) => `\n\n// ===== ${name} =====\n\n${content}`)
        .join('');

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.data.repoName}-export.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleCsvImport = async () => {
    if (!importModel || !csvText.trim()) return;
    try {
      // Parse CSV
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
      const records = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
        const record: Record<string, string> = {};
        headers.forEach((h, i) => { record[h] = values[i] || ''; });
        return record;
      });

      const res = await fetch(`/api/apps/${appId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: importModel, records }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setImportStatus(`✓ Imported ${data.data.imported} records`);
      setTimeout(() => { setImportOpen(false); setImportStatus(null); setCsvText(''); }, 2000);
    } catch (err) {
      setImportStatus(`✗ ${err instanceof Error ? err.message : 'Import failed'}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">App not found</p>
        <Link href="/dashboard" className="text-indigo-600 text-sm mt-2 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  const config = app.config;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
          {app.description && <p className="text-sm text-gray-500 mt-1">{app.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            {exportLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Models', value: config.models?.length || 0 },
          { label: 'Pages', value: config.pages?.length || 0 },
          { label: 'Status', value: app.status },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pages grid */}
      <h2 className="text-base font-semibold text-gray-900 mb-4">Pages</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {config.pages?.map((page) => (
          <Link
            key={page.name}
            href={`/apps/${appId}/pages/${page.name}`}
            className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">{page.title || page.name}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {page.components?.length || 0} components · {page.path}
            </p>
          </Link>
        ))}
      </div>

      {/* Models */}
      <h2 className="text-base font-semibold text-gray-900 mb-4">Data Models</h2>
      <div className="space-y-3">
        {config.models?.map((model) => (
          <div key={model.name} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{model.label || model.name}</h3>
              <span className="text-xs text-gray-400">{model.fields?.length || 0} fields</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {model.fields?.map((f) => (
                <span key={f.name} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                  <span className="font-medium">{f.label || f.name}</span>
                  <span className="text-gray-400">{f.type}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CSV Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setImportOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Import CSV</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Model</label>
                <select
                  value={importModel}
                  onChange={(e) => setImportModel(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select model...</option>
                  {config.models?.map((m) => (
                    <option key={m.name} value={m.name}>{m.label || m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CSV Data</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="name,email,status&#10;John Doe,john@example.com,active"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none resize-none"
                  rows={6}
                />
              </div>
              {importStatus && (
                <p className={`text-sm font-medium ${importStatus.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {importStatus}
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setImportOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                  Cancel
                </button>
                <button
                  onClick={handleCsvImport}
                  disabled={!importModel || !csvText.trim()}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
