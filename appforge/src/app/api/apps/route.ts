import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAndSanitizeConfig, safeParseJSON } from '@/lib/config-validator';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const apps = await prisma.app.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { records: true } },
      },
    });

    return NextResponse.json({ success: true, data: apps });
  } catch (error) {
    console.error('GET /api/apps error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, configJson } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'App name is required' }, { status: 400 });
    }

    // Parse and validate config
    let config = {};
    if (configJson) {
      const { data, error } = safeParseJSON(typeof configJson === 'string' ? configJson : JSON.stringify(configJson));
      if (error) {
        return NextResponse.json({ success: false, error: `Invalid JSON: ${error}` }, { status: 400 });
      }
      const validation = validateAndSanitizeConfig(data);
      config = validation.sanitizedConfig;
    }

    const app = await prisma.app.create({
      data: {
        name,
        description: description || null,
        config,
        userId: session.user.id,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch (error) {
    console.error('POST /api/apps error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
