// ============================================================
// CORE CONFIG TYPES
// ============================================================

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'url'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'relation'
  | 'file'
  | 'image'
  | 'color'
  | 'json'
  | 'unknown'; // graceful fallback

export interface FieldConfig {
  name: string;
  type: FieldType;
  label?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string }[]; // for select/multiselect
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  placeholder?: string;
  description?: string;
  relatedModel?: string; // for relation fields
  hidden?: boolean;
  readOnly?: boolean;
  // Unknown/extra fields are tolerated
  [key: string]: unknown;
}

export type ComponentType =
  | 'table'
  | 'form'
  | 'dashboard'
  | 'kanban'
  | 'calendar'
  | 'chart'
  | 'detail'
  | 'list'
  | 'card-grid'
  | 'unknown'; // graceful fallback

export interface ComponentConfig {
  type: ComponentType;
  title?: string;
  model?: string;
  fields?: FieldConfig[];
  actions?: ActionConfig[];
  filters?: FilterConfig[];
  layout?: LayoutConfig;
  // Chart-specific
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  xField?: string;
  yField?: string;
  // Dashboard widgets
  widgets?: WidgetConfig[];
  // Unknown props tolerated
  [key: string]: unknown;
}

export interface ActionConfig {
  name: string;
  label?: string;
  type: 'create' | 'edit' | 'delete' | 'custom' | 'navigate' | 'export';
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  navigateTo?: string;
  confirmMessage?: string;
  [key: string]: unknown;
}

export interface FilterConfig {
  field: string;
  type: 'text' | 'select' | 'date-range' | 'boolean';
  label?: string;
  options?: { label: string; value: string }[];
}

export interface LayoutConfig {
  columns?: number;
  gap?: number;
  padding?: string;
  [key: string]: unknown;
}

export interface WidgetConfig {
  type: 'stat' | 'chart' | 'list' | 'activity' | 'unknown';
  title?: string;
  model?: string;
  field?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'max' | 'min';
  icon?: string;
  color?: string;
  [key: string]: unknown;
}

export interface ModelConfig {
  name: string;
  label?: string;
  labelPlural?: string;
  fields: FieldConfig[];
  timestamps?: boolean;
  softDelete?: boolean;
  [key: string]: unknown;
}

export interface PageConfig {
  name: string;
  path?: string;
  title?: string;
  icon?: string;
  components: ComponentConfig[];
  [key: string]: unknown;
}

export interface NavigationConfig {
  items: NavItem[];
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
  children?: NavItem[];
}

export interface ThemeConfig {
  primaryColor?: string;
  mode?: 'light' | 'dark' | 'system';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily?: string;
}

// Main App Config
export interface AppConfig {
  name: string;
  description?: string;
  version?: string;
  theme?: ThemeConfig;
  models: ModelConfig[];
  pages: PageConfig[];
  navigation?: NavigationConfig;
  features?: {
    auth?: boolean;
    csvImport?: boolean;
    githubExport?: boolean;
    notifications?: boolean;
    multiLanguage?: boolean;
  };
  // Unknown top-level keys tolerated
  [key: string]: unknown;
}

// ============================================================
// VALIDATION RESULT
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedConfig: AppConfig;
}

// ============================================================
// RUNTIME TYPES
// ============================================================

export interface AppRecord {
  id: string;
  appId: string;
  modelName: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
