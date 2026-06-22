'use client';

import React from 'react';
import { FieldConfig } from '@/types/config';
import { cn } from '@/lib/utils';

interface FieldRendererProps {
  field: FieldConfig;
  value?: unknown;
  onChange?: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
}

export function FieldRenderer({ field, value, onChange, error, disabled }: FieldRendererProps) {
  const baseInputClass = cn(
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900',
    'placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
  );

  const label = field.label || field.name;

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'color':
        return (
          <input
            type={field.type}
            value={String(value ?? '')}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={field.placeholder || `Enter ${label.toLowerCase()}...`}
            disabled={disabled || field.readOnly}
            className={baseInputClass}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => onChange?.(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={field.placeholder || `Enter ${label.toLowerCase()}...`}
            disabled={disabled || field.readOnly}
            className={baseInputClass}
            min={field.validation?.min}
            max={field.validation?.max}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={String(value ?? '')}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={field.placeholder || `Enter ${label.toLowerCase()}...`}
            disabled={disabled || field.readOnly}
            className={cn(baseInputClass, 'min-h-[100px] resize-y')}
            rows={4}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={String(value ?? '')}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled || field.readOnly}
            className={baseInputClass}
            required={field.required}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={String(value ?? '')}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled || field.readOnly}
            className={baseInputClass}
            required={field.required}
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange?.(e.target.checked)}
                disabled={disabled || field.readOnly}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-11 h-6 rounded-full transition-colors',
                  Boolean(value) ? 'bg-indigo-600' : 'bg-gray-200'
                )}
              />
              <div
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  Boolean(value) ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </div>
            <span className="text-sm text-gray-700">{Boolean(value) ? 'Yes' : 'No'}</span>
          </label>
        );

      case 'select':
        return (
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled || field.readOnly}
            className={baseInputClass}
            required={field.required}
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect': {
        const selectedValues = Array.isArray(value) ? value as string[] : [];
        return (
          <div className="space-y-1">
            {(field.options ?? []).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedValues, opt.value]
                      : selectedValues.filter((v) => v !== opt.value);
                    onChange?.(next);
                  }}
                  disabled={disabled || field.readOnly}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'image':
        return (
          <div className="space-y-2">
         {typeof value === 'string' ? (
  <img
    src={value}
    alt="Preview"
    className="w-24 h-24 rounded-lg object-cover border border-gray-200"
  />
) : null}
            <input
              type="url"
              value={String(value ?? '')}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="Enter image URL..."
              disabled={disabled || field.readOnly}
              className={baseInputClass}
            />
          </div>
        );

      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              try {
                onChange?.(JSON.parse(e.target.value));
              } catch {
                onChange?.(e.target.value);
              }
            }}
            disabled={disabled || field.readOnly}
            className={cn(baseInputClass, 'font-mono text-xs min-h-[120px] resize-y')}
            placeholder="{}"
          />
        );

      case 'unknown':
      default:
        return (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <span className="text-xs text-amber-600">
              ⚠ Unknown field type for &quot;{field.name}&quot; — displaying as text
            </span>
            <input
              type="text"
              value={String(value ?? '')}
              onChange={(e) => onChange?.(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          </div>
        );
    }
  };

  if (field.hidden) return null;

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
        {label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      {renderInput()}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
