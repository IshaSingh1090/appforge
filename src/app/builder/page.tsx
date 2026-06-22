'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppConfig } from '@/types/config';

const EXAMPLE_PROMPTS = [
  'A CRM for managing customers, deals, and follow-ups',
  'An inventory management system for a small store',
  'A project management tool with tasks, teams, and deadlines',
  'A job board with companies, listings, and applications',
  'A recipe collection app with ingredients and meal planning',
];

interface GenerationResult {
  config: AppConfig;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  app?: { id: string };
}

export default function BuilderPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndOpen = async () => {
    if (!result?.config || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, saveApp: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      if (data.data.app?.id) {
        router.push(`/apps/${data.data.app.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Build New App</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Describe your app and AI will generate the complete configuration
        </p>
      </div>

      {/* Prompt input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What do you want to build?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your app in plain English. E.g., 'A project management tool where teams can create projects, assign tasks with deadlines, and track progress with a kanban board'"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          rows={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
          }}
        />

        {/* Example prompts */}
        <div className="mt-3">
          <p className="text-xs text-gray-400 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 hover:border-indigo-300 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">
            Press ⌘+Enter to generate
          </p>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate App
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="font-medium text-gray-900">Generating your app...</p>
          <p className="text-sm text-gray-500 mt-1">AI is designing models, pages, and components</p>
        </div>
      )}

      {/* Result preview */}
      {result && !loading && (
        <div className="space-y-4 animate-fade-in">
          {/* Validation warnings */}
          {result.validation.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">Validation Notes:</p>
              <ul className="space-y-1">
                {result.validation.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-700">⚠ {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Config preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">{result.config.name}</h2>
                {result.config.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{result.config.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {result.config.models.length} models · {result.config.pages.length} pages
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-6">
              {/* Models */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Data Models
                </h3>
                <div className="space-y-2">
                  {result.config.models.map((model) => (
                    <div key={model.name} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{model.label || model.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {model.fields.length} fields: {model.fields.slice(0, 3).map((f) => f.label || f.name).join(', ')}
                        {model.fields.length > 3 && '...'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pages */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pages
                </h3>
                <div className="space-y-2">
                  {result.config.pages.map((page) => (
                    <div key={page.name} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-sm font-medium text-gray-800">{page.title || page.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {page.path} · {page.components.length} components
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={handleGenerate}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
              <button
                onClick={handleSaveAndOpen}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    Save & Open App
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
