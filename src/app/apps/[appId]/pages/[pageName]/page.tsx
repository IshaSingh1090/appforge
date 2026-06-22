'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AppConfig, PageConfig } from '@/types/config';
import { ComponentRenderer } from '@/components/renderer/ComponentRenderer';

export default function DynamicAppPage() {
  const params = useParams();
  const appId = params.appId as string;
  const pageName = params.pageName as string;

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [page, setPage] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/apps/${appId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || 'App not found');
        const appConfig = data.data.config as AppConfig;
        setConfig(appConfig);
        const foundPage = appConfig.pages?.find(
          (p) => p.name === pageName || p.path === `/${pageName}`
        );
        if (!foundPage) throw new Error(`Page "${pageName}" not found in app config`);
        setPage(foundPage);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [appId, pageName]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-64 bg-white rounded-xl border border-gray-200 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">{error}</p>
          <p className="text-xs text-red-500 mt-1">
            The page configuration may be missing or invalid. Check your app config.
          </p>
        </div>
      </div>
    );
  }

  if (!page || !config) return null;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{page.title || page.name}</h1>
      </div>

      {page.components.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No components configured for this page</p>
        </div>
      ) : (
        <div className="space-y-6">
          {page.components.map((component, index) => (
            <div key={index}>
              {component.title && component.type !== 'dashboard' && (
                <h2 className="text-base font-semibold text-gray-800 mb-3">
                  {component.title}
                </h2>
              )}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <ComponentRenderer
                  component={component}
                  config={config}
                  appId={appId}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
