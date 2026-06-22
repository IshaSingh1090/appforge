'use client';

import React, { useState, useEffect } from 'react';
import { ComponentConfig, ModelConfig } from '@/types/config';

interface DynamicDashboardProps {
  component: ComponentConfig;
  models?: ModelConfig[];
  appId: string;
}

interface StatData {
  value: number;
  label: string;
  icon?: string;
  color?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  Package: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  TrendingUp: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Database: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4-8-4s8 1.79 8 4" />
    </svg>
  ),
  Star: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

function StatCard({ stat }: { stat: StatData }) {
  const color = stat.color || '#6366f1';
  const icon = stat.icon && ICONS[stat.icon] ? ICONS[stat.icon] : ICONS.Database;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{stat.label}</p>
          <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
        </div>
        <div
          className="rounded-lg p-2.5"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DynamicDashboard({ component, models, appId }: DynamicDashboardProps) {
  const [stats, setStats] = useState<StatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const widgets = component.widgets ?? [];

      if (widgets.length === 0 && models?.length) {
        // Auto-generate widgets from models
        const autoStats = await Promise.all(
          models.slice(0, 4).map(async (model) => {
            try {
              const res = await fetch(`/api/apps/${appId}/records?model=${model.name}&pageSize=1`);
              const data = await res.json();
              return {
                label: `Total ${model.labelPlural || model.label || model.name}`,
                value: data.data?.total ?? 0,
                icon: 'Database',
                color: '#6366f1',
              };
            } catch {
              return { label: model.label || model.name, value: 0, icon: 'Database', color: '#6366f1' };
            }
          })
        );
        setStats(autoStats);
      } else {
        const statResults = await Promise.all(
          widgets.map(async (widget) => {
            if (widget.type === 'stat' && widget.model) {
              try {
                const res = await fetch(`/api/apps/${appId}/records?model=${widget.model}&pageSize=1`);
                const data = await res.json();
                return {
                  label: widget.title || `Total ${widget.model}`,
                  value: data.data?.total ?? 0,
                  icon: typeof widget.icon === 'string' ? widget.icon : 'Database',
                  color: typeof widget.color === 'string' ? widget.color : '#6366f1',
                };
              } catch {
                return { label: widget.title || widget.model, value: 0, icon: 'Database', color: '#6366f1' };
              }
            }
            return { label: widget.title || 'Stat', value: 0, icon: 'Database', color: '#6366f1' };
          })
        );
        setStats(statResults);
      }
      setLoading(false);
    };

    fetchStats();
  }, [appId, component.widgets, models]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {component.title && (
        <h2 className="text-lg font-semibold text-gray-900">{component.title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>
    </div>
  );
}
