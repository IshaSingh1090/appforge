'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppConfig } from '@/types/config';

interface AppData {
  id: string;
  name: string;
  description?: string;
  status: string;
  config: AppConfig;
}

export default function AppSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    fetch(`/api/apps/${appId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setApp(data.data);
          setName(data.data.name);
          setDescription(data.data.description || '');
        }
      })
      .finally(() => setLoading(false));
  }, [appId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch {
      setSaveMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/apps/${appId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push('/dashboard');
    } catch {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  if (loading) {
    return <div className="p-8 space-y-4">{[1,2,3].map(i=><div key={i} className="h-16 bg-white rounded-xl border border-gray-200 animate-pulse"/>)}</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-gray-500">App not found</div>;
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* General */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">General</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveMsg && (
              <span className={`text-sm ${saveMsg === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Config viewer */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">App Configuration</h2>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {showConfig ? 'Hide' : 'View'} JSON
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{app.config.models?.length || 0}</p>
            <p className="text-xs text-gray-500">Models</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-xl font-bold text-gray-900">{app.config.pages?.length || 0}</p>
            <p className="text-xs text-gray-500">Pages</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-xl font-bold text-gray-900">
              {app.config.models?.reduce((s, m) => s + (m.fields?.length || 0), 0) || 0}
            </p>
            <p className="text-xs text-gray-500">Total Fields</p>
          </div>
        </div>
        {showConfig && (
          <pre className="bg-gray-950 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-96 font-mono">
            {JSON.stringify(app.config, null, 2)}
          </pre>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <h2 className="text-base font-semibold text-red-700 mb-4">Danger Zone</h2>
        {!deleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Delete this app</p>
              <p className="text-xs text-gray-500 mt-0.5">Permanently delete this app and all its data</p>
            </div>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Delete App
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-700">
              Are you sure? This will permanently delete &quot;{app.name}&quot; and all records.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete App'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
