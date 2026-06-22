'use client';

import React, { useState } from 'react';
import { ComponentConfig, FieldConfig, ModelConfig } from '@/types/config';
import { FieldRenderer } from './FieldRenderer';
import { cn } from '@/lib/utils';

interface DynamicFormProps {
  component: ComponentConfig;
  model?: ModelConfig;
  initialData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

function validateField(field: FieldConfig, value: unknown): string | null {
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label || field.name} is required`;
  }
  if (field.type === 'email' && value && typeof value === 'string') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
  }
  if (field.type === 'url' && value && typeof value === 'string') {
    try {
      new URL(value);
    } catch {
      return 'Please enter a valid URL';
    }
  }
  if (field.validation) {
    const v = field.validation;
    if (field.type === 'number' && typeof value === 'number') {
      if (v.min !== undefined && value < v.min) return `Minimum value is ${v.min}`;
      if (v.max !== undefined && value > v.max) return `Maximum value is ${v.max}`;
    }
    if (typeof value === 'string') {
      if (v.minLength !== undefined && value.length < v.minLength) {
        return `Minimum length is ${v.minLength} characters`;
      }
      if (v.maxLength !== undefined && value.length > v.maxLength) {
        return `Maximum length is ${v.maxLength} characters`;
      }
      if (v.pattern && !new RegExp(v.pattern).test(value)) {
        return `Invalid format`;
      }
    }
  }
  return null;
}

export function DynamicForm({
  component,
  model,
  initialData = {},
  onSubmit,
  onCancel,
  loading = false,
}: DynamicFormProps) {
  // Use component fields or model fields
  const fields: FieldConfig[] = component.fields?.length
    ? component.fields
    : model?.fields ?? [];

  // Build initial state from defaults + existing data
  const buildInitialValues = (): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    fields.forEach((f) => {
      values[f.name] = initialData[f.name] ?? f.defaultValue ?? '';
    });
    return values;
  };

  const [values, setValues] = useState<Record<string, unknown>>(buildInitialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (fieldName: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error on change
    if (errors[fieldName]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.hidden || field.readOnly) return;
      const err = validateField(field, values[field.name]);
      if (err) newErrors[field.name] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit?.(values);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleFields = fields.filter((f) => !f.hidden);

  if (visibleFields.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-sm text-amber-700">No fields configured for this form</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {component.title && (
        <h3 className="text-base font-semibold text-gray-900">{component.title}</h3>
      )}

      <div
        className={cn(
          'grid gap-4',
          component.layout?.columns === 2 ? 'grid-cols-2' : 'grid-cols-1'
        )}
      >
        {visibleFields.map((field) => (
          <div
            key={field.name}
            className={cn(
              field.type === 'textarea' || field.type === 'json' ? 'col-span-full' : ''
            )}
          >
            <FieldRenderer
              field={field}
              value={values[field.name]}
              onChange={(v) => handleChange(field.name, v)}
              error={errors[field.name]}
              disabled={submitting || loading}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </form>
  );
}
