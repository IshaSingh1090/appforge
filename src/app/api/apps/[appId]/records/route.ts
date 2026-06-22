import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppConfig, ModelConfig, FieldConfig } from '@/types/config';

type Params = { params: Promise<{ appId: string }> };

async function getApp(appId: string, userId: string) {
  return prisma.app.findFirst({ where: { id: appId, userId } });
}

// Validate record data against model config
function validateRecordData(
  data: Record<string, unknown>,
  model: ModelConfig
): { valid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};

  model.fields.forEach((field: FieldConfig) => {
    const value = data[field.name];

    // Required check
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label || field.name} is required`);
      return;
    }

    // Skip undefined optional fields
    if (value === undefined || value === null || value === '') {
      sanitized[field.name] = field.defaultValue ?? null;
      return;
    }

    // Type coercion/validation
    switch (field.type) {
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field.label || field.name} must be a number`);
        } else {
          if (field.validation?.min !== undefined && num < field.validation.min) {
            errors.push(`${field.label || field.name} must be at least ${field.validation.min}`);
          }
          if (field.validation?.max !== undefined && num > field.validation.max) {
            errors.push(`${field.label || field.name} must be at most ${field.validation.max}`);
          }
          sanitized[field.name] = num;
        }
        break;

      case 'email':
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field.label || field.name} must be a valid email`);
        } else {
          sanitized[field.name] = value;
        }
        break;

      case 'boolean':
        sanitized[field.name] = Boolean(value);
        break;

      case 'date':
      case 'datetime':
        const date = new Date(value as string);
        if (isNaN(date.getTime())) {
          errors.push(`${field.label || field.name} must be a valid date`);
        } else {
          sanitized[field.name] = date.toISOString();
        }
        break;

      case 'multiselect':
        sanitized[field.name] = Array.isArray(value) ? value : [value];
        break;

      case 'json':
        try {
          sanitized[field.name] = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          sanitized[field.name] = value;
        }
        break;

      case 'unknown':
      default:
        // Accept any value for unknown types
        sanitized[field.name] = value;
        break;
    }

    // String types
    if (['text', 'textarea', 'email', 'url', 'select', 'image', 'color'].includes(field.type)) {
      sanitized[field.name] = String(value);
    }
  });

  // Pass through any extra fields not in schema (with a warning in headers)
  Object.keys(data).forEach((key) => {
    if (!model.fields.find((f) => f.name === key) && !(key in sanitized)) {
      sanitized[key] = data[key]; // Be lenient with extra fields
    }
  });

  return { valid: errors.length === 0, errors, sanitized };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await params;
    const app = await getApp(appId, session.user.id);
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const modelName = searchParams.get('model');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10')));
    const search = searchParams.get('search') ?? '';

    if (!modelName) {
      return NextResponse.json({ success: false, error: 'model parameter is required' }, { status: 400 });
    }

    const where = {
      appId,
      modelName,
      ...(search
        ? {
            data: {
              string_contains: search,
            },
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      prisma.appRecord.findMany({
        where: { appId, modelName },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.appRecord.count({ where: { appId, modelName } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        data: records.map((r) => ({
          id: r.id,
          appId: r.appId,
          modelName: r.modelName,
          data: r.data,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET records error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await params;
    const app = await getApp(appId, session.user.id);
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const body = await req.json();
    const { model: modelName, data } = body;

    if (!modelName || typeof modelName !== 'string') {
      return NextResponse.json({ success: false, error: 'model is required' }, { status: 400 });
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'data must be an object' }, { status: 400 });
    }

    // Find model config for validation
    const appConfig = app.config as AppConfig;
    const modelConfig = appConfig?.models?.find((m: ModelConfig) => m.name === modelName);

    let finalData = data as Record<string, unknown>;
    const warnings: string[] = [];

    if (modelConfig) {
      const validation = validateRecordData(data as Record<string, unknown>, modelConfig);
      if (!validation.valid) {
        return NextResponse.json({
          success: false,
          error: 'Validation failed',
          details: validation.errors,
        }, { status: 422 });
      }
      finalData = validation.sanitized;
    } else {
      warnings.push(`Model "${modelName}" not found in config — saving data as-is`);
    }

    const record = await prisma.appRecord.create({
      data: {
        appId,
        modelName,
        data: finalData,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        appId: record.appId,
        modelName: record.modelName,
        data: record.data,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('POST records error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
