import type {
  AppConfig,
  ModelConfig,
  FieldConfig,
  PageConfig,
  ComponentConfig,
  FieldType,
  ComponentType,
  ValidationResult,
} from '@/types/config';

// ============================================================
// FIELD TYPE NORMALIZER
// ============================================================

const VALID_FIELD_TYPES: FieldType[] = [
  'text', 'textarea', 'number', 'email', 'url', 'date',
  'datetime', 'boolean', 'select', 'multiselect', 'relation',
  'file', 'image', 'color', 'json',
];

const VALID_COMPONENT_TYPES: ComponentType[] = [
  'table', 'form', 'dashboard', 'kanban', 'calendar',
  'chart', 'detail', 'list', 'card-grid',
];

function normalizeFieldType(type: unknown): FieldType {
  if (typeof type === 'string' && VALID_FIELD_TYPES.includes(type as FieldType)) {
    return type as FieldType;
  }
  // Try to infer from common aliases
  const aliases: Record<string, FieldType> = {
    string: 'text',
    integer: 'number',
    float: 'number',
    decimal: 'number',
    bool: 'boolean',
    checkbox: 'boolean',
    dropdown: 'select',
    multiDropdown: 'multiselect',
    timestamp: 'datetime',
    upload: 'file',
    photo: 'image',
    longtext: 'textarea',
    link: 'url',
  };
  if (typeof type === 'string' && aliases[type]) {
    return aliases[type];
  }
  return 'unknown';
}

function normalizeComponentType(type: unknown): ComponentType {
  if (typeof type === 'string' && VALID_COMPONENT_TYPES.includes(type as ComponentType)) {
    return type as ComponentType;
  }
  const aliases: Record<string, ComponentType> = {
    grid: 'table',
    list: 'list',
    cards: 'card-grid',
    create: 'form',
    edit: 'form',
    view: 'detail',
    stats: 'dashboard',
  };
  if (typeof type === 'string' && aliases[type]) {
    return aliases[type];
  }
  return 'unknown';
}

// ============================================================
// FIELD SANITIZER
// ============================================================

function sanitizeField(field: unknown, index: number): FieldConfig {
  if (!field || typeof field !== 'object') {
    return {
      name: `field_${index}`,
      type: 'unknown',
      label: `Unknown Field ${index}`,
    };
  }
  const f = field as Record<string, unknown>;
  return {
    name: typeof f.name === 'string' && f.name.trim() ? f.name.trim() : `field_${index}`,
    type: normalizeFieldType(f.type),
    label: typeof f.label === 'string' ? f.label : undefined,
    required: typeof f.required === 'boolean' ? f.required : false,
    defaultValue: f.defaultValue,
    placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
    description: typeof f.description === 'string' ? f.description : undefined,
    hidden: typeof f.hidden === 'boolean' ? f.hidden : false,
    readOnly: typeof f.readOnly === 'boolean' ? f.readOnly : false,
    options: Array.isArray(f.options)
      ? f.options.map((o: unknown) => {
          if (typeof o === 'string') return { label: o, value: o };
          if (o && typeof o === 'object') {
            const opt = o as Record<string, unknown>;
            return {
              label: typeof opt.label === 'string' ? opt.label : String(opt.value ?? opt.label ?? o),
              value: typeof opt.value === 'string' ? opt.value : String(opt.value ?? opt.label ?? o),
            };
          }
          return { label: String(o), value: String(o) };
        })
      : undefined,
    relatedModel: typeof f.relatedModel === 'string' ? f.relatedModel : undefined,
    validation: f.validation && typeof f.validation === 'object'
      ? f.validation as FieldConfig['validation']
      : undefined,
  };
}

// ============================================================
// MODEL SANITIZER
// ============================================================

function sanitizeModel(model: unknown, index: number): ModelConfig {
  if (!model || typeof model !== 'object') {
    return {
      name: `model_${index}`,
      label: `Model ${index}`,
      fields: [],
    };
  }
  const m = model as Record<string, unknown>;
  const name = typeof m.name === 'string' && m.name.trim()
    ? m.name.trim()
    : `model_${index}`;

  return {
    name,
    label: typeof m.label === 'string' ? m.label : name,
    labelPlural: typeof m.labelPlural === 'string' ? m.labelPlural : `${typeof m.label === 'string' ? m.label : name}s`,
    fields: Array.isArray(m.fields)
      ? m.fields.map((f, i) => sanitizeField(f, i))
      : [],
    timestamps: typeof m.timestamps === 'boolean' ? m.timestamps : true,
    softDelete: typeof m.softDelete === 'boolean' ? m.softDelete : false,
  };
}

// ============================================================
// COMPONENT SANITIZER
// ============================================================

function sanitizeComponent(component: unknown, index: number): ComponentConfig {
  if (!component || typeof component !== 'object') {
    return {
      type: 'unknown',
      title: `Component ${index}`,
    };
  }
  const c = component as Record<string, unknown>;
  return {
    type: normalizeComponentType(c.type),
    title: typeof c.title === 'string' ? c.title : undefined,
    model: typeof c.model === 'string' ? c.model : undefined,
    fields: Array.isArray(c.fields) ? c.fields.map((f, i) => sanitizeField(f, i)) : undefined,
    actions: Array.isArray(c.actions) ? c.actions.map((a: unknown) => {
      if (!a || typeof a !== 'object') return { name: 'action', type: 'custom' as const };
      const ac = a as Record<string, unknown>;
      return {
        name: typeof ac.name === 'string' ? ac.name : 'action',
        label: typeof ac.label === 'string' ? ac.label : undefined,
        type: (['create', 'edit', 'delete', 'custom', 'navigate', 'export'].includes(ac.type as string)
          ? ac.type : 'custom') as 'create' | 'edit' | 'delete' | 'custom' | 'navigate' | 'export',
        icon: typeof ac.icon === 'string' ? ac.icon : undefined,
        variant: typeof ac.variant === 'string' ? ac.variant as 'primary' : undefined,
      };
    }) : undefined,
    filters: Array.isArray(c.filters) ? c.filters as ComponentConfig['filters'] : undefined,
    widgets: Array.isArray(c.widgets) ? c.widgets as ComponentConfig['widgets'] : undefined,
    chartType: typeof c.chartType === 'string' ? c.chartType as 'bar' : undefined,
    xField: typeof c.xField === 'string' ? c.xField : undefined,
    yField: typeof c.yField === 'string' ? c.yField : undefined,
  };
}

// ============================================================
// PAGE SANITIZER
// ============================================================

function sanitizePage(page: unknown, index: number): PageConfig {
  if (!page || typeof page !== 'object') {
    return {
      name: `page_${index}`,
      title: `Page ${index}`,
      components: [],
    };
  }
  const p = page as Record<string, unknown>;
  const name = typeof p.name === 'string' && p.name.trim()
    ? p.name.trim()
    : `page_${index}`;

  return {
    name,
    path: typeof p.path === 'string' ? p.path : `/${name.toLowerCase().replace(/\s+/g, '-')}`,
    title: typeof p.title === 'string' ? p.title : name,
    icon: typeof p.icon === 'string' ? p.icon : undefined,
    components: Array.isArray(p.components)
      ? p.components.map((c, i) => sanitizeComponent(c, i))
      : [],
  };
}

// ============================================================
// MAIN VALIDATOR
// ============================================================

export function validateAndSanitizeConfig(raw: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Handle non-object input
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    errors.push('Config must be a JSON object');
    return {
      valid: false,
      errors,
      warnings,
      sanitizedConfig: {
        name: 'Untitled App',
        models: [],
        pages: [],
      },
    };
  }

  const config = raw as Record<string, unknown>;

  // App name
  if (!config.name || typeof config.name !== 'string') {
    warnings.push('App name is missing or invalid — defaulting to "Untitled App"');
    config.name = 'Untitled App';
  }

  // Models
  if (!Array.isArray(config.models)) {
    if (config.models !== undefined) {
      errors.push('`models` must be an array');
    } else {
      warnings.push('No models defined — app will have no data');
    }
    config.models = [];
  }

  // Pages
  if (!Array.isArray(config.pages)) {
    if (config.pages !== undefined) {
      errors.push('`pages` must be an array');
    } else {
      warnings.push('No pages defined — generating a blank page');
    }
    config.pages = [];
  }

  // Check for model name uniqueness
  const modelNames = new Set<string>();
  (config.models as unknown[]).forEach((m, i) => {
    const model = m as Record<string, unknown>;
    if (model?.name && typeof model.name === 'string') {
      if (modelNames.has(model.name)) {
        warnings.push(`Duplicate model name "${model.name}" at index ${i} — will be renamed`);
        model.name = `${model.name}_${i}`;
      }
      modelNames.add(model.name);
    }
  });

  // Check for page name uniqueness
  const pageNames = new Set<string>();
  (config.pages as unknown[]).forEach((p, i) => {
    const page = p as Record<string, unknown>;
    if (page?.name && typeof page.name === 'string') {
      if (pageNames.has(page.name)) {
        warnings.push(`Duplicate page name "${page.name}" at index ${i}`);
      }
      pageNames.add(page.name);
    }
  });

  // Cross-reference: components referencing non-existent models
  (config.pages as unknown[]).forEach((p) => {
    const page = p as Record<string, unknown>;
    if (Array.isArray(page?.components)) {
      (page.components as unknown[]).forEach((c) => {
        const comp = c as Record<string, unknown>;
        if (comp?.model && typeof comp.model === 'string' && !modelNames.has(comp.model)) {
          warnings.push(`Component references model "${comp.model}" which doesn't exist`);
        }
      });
    }
  });

  const sanitizedConfig: AppConfig = {
    name: config.name as string,
    description: typeof config.description === 'string' ? config.description : undefined,
    version: typeof config.version === 'string' ? config.version : '1.0.0',
    theme: config.theme as AppConfig['theme'],
    models: (config.models as unknown[]).map((m, i) => sanitizeModel(m, i)),
    pages: (config.pages as unknown[]).map((p, i) => sanitizePage(p, i)),
    navigation: config.navigation as AppConfig['navigation'],
    features: config.features as AppConfig['features'],
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedConfig,
  };
}

// ============================================================
// JSON PARSER (safe)
// ============================================================

export function safeParseJSON(input: string): { data: unknown; error: string | null } {
  try {
    // Strip markdown code fences if present
    const cleaned = input
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return { data: JSON.parse(cleaned), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}
