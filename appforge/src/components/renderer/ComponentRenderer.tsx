'use client';

import React from 'react';
import { ComponentConfig, AppConfig } from '@/types/config';
import { DynamicTable } from './DynamicTable';
import { DynamicForm } from './DynamicForm';
import { DynamicDashboard } from './DynamicDashboard';

interface ComponentRendererProps {
  component: ComponentConfig;
  config: AppConfig;
  appId: string;
}

function UnknownComponent({ component }: { component: ComponentConfig }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-200 bg-amber-50 p-8 text-center">
      <div className="text-2xl mb-2">⚠️</div>
      <h3 className="font-medium text-amber-800">Unknown Component Type</h3>
      <p className="text-sm text-amber-600 mt-1">
        Component type &quot;{String(component.type)}&quot; is not recognized.
      </p>
      {component.title && (
        <p className="text-xs text-amber-500 mt-2">Title: {component.title}</p>
      )}
    </div>
  );
}

function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.message);
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-medium text-red-700">Component failed to render</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
        <button
          onClick={() => setHasError(false)}
          className="mt-3 text-xs text-red-600 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function ComponentRenderer({ component, config, appId }: ComponentRendererProps) {
  // Find the model this component references
  const model = component.model
    ? config.models.find((m) => m.name === component.model)
    : undefined;

  const render = () => {
    try {
      switch (component.type) {
        case 'dashboard':
          return (
            <DynamicDashboard
              component={component}
              models={config.models}
              appId={appId}
            />
          );

        case 'table':
          return (
            <DynamicTable
              component={component}
              model={model}
              appId={appId}
            />
          );

        case 'form':
          return (
            <div className="max-w-2xl">
              <DynamicForm
                component={component}
                model={model}
                onSubmit={async (data) => {
                  const res = await fetch(`/api/apps/${appId}/records`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: component.model, data }),
                  });
                  const result = await res.json();
                  if (!result.success) throw new Error(result.error);
                }}
              />
            </div>
          );

        case 'list':
        case 'card-grid':
          // Render as table for now
          return (
            <DynamicTable
              component={{ ...component, type: 'table' }}
              model={model}
              appId={appId}
            />
          );

        case 'detail':
          return (
            <div className="max-w-2xl">
              <DynamicForm
                component={component}
                model={model}
                onSubmit={async () => {}}
              />
            </div>
          );

        case 'chart':
          return (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {component.title || 'Chart'}
              </h3>
              <div className="h-48 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-400">
                  Chart visualization for {component.model || 'data'}
                </p>
              </div>
            </div>
          );

        case 'kanban':
          return (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                {component.title || 'Kanban Board'}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {['To Do', 'In Progress', 'Done'].map((col) => (
                  <div key={col} className="rounded-lg bg-gray-50 p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">{col}</h4>
                    <div className="text-xs text-gray-400 text-center py-4">No items</div>
                  </div>
                ))}
              </div>
            </div>
          );

        case 'unknown':
        default:
          return <UnknownComponent component={component} />;
      }
    } catch (error) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm font-medium text-red-700">Component failed to render</p>
          <p className="text-xs text-red-500 mt-1">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      );
    }
  };

  return (
    <ErrorBoundaryWrapper>
      {render()}
    </ErrorBoundaryWrapper>
  );
}
