import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generateAppConfig } from '@/lib/ai-generator';
import { validateAndSanitizeConfig } from '@/lib/config-validator';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { prompt, saveApp } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be at least 5 characters' },
        { status: 400 }
      );
    }

    // Generate config with AI
    const { config, rawJson, error } = await generateAppConfig(prompt.trim());

    if (error || !config) {
      return NextResponse.json(
        { success: false, error: error || 'Failed to generate config' },
        { status: 500 }
      );
    }

    // Validate and sanitize
    const validation = validateAndSanitizeConfig(config);

    let savedApp = null;
    if (saveApp) {
      savedApp = await prisma.app.create({
        data: {
          name: validation.sanitizedConfig.name,
          description: validation.sanitizedConfig.description || null,
          config: validation.sanitizedConfig as object,
          userId: session.user.id,
          status: 'ACTIVE',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        config: validation.sanitizedConfig,
        rawJson,
        validation: {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
        },
        app: savedApp,
      },
    });
  } catch (error) {
    console.error('POST /api/generate error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
