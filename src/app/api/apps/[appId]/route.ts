import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateAndSanitizeConfig } from '@/lib/config-validator';

type Params = { params: Promise<{ appId: string }> };

async function getAppOrFail(appId: string, userId: string) {
  const app = await prisma.app.findFirst({
    where: { id: appId, userId },
  });
  return app;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { appId } = await params;
    const app = await getAppOrFail(appId, session.user.id);
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: app });
  } catch (error) {
    console.error('GET /api/apps/[appId] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { appId } = await params;
    const app = await getAppOrFail(appId, session.user.id);
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, config, status } = body;

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (config) {
      const validation = validateAndSanitizeConfig(config);
      updateData.config = validation.sanitizedConfig;
    }

    const updated = await prisma.app.update({
      where: { id: appId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT /api/apps/[appId] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { appId } = await params;
    const app = await getAppOrFail(appId, session.user.id);
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    await prisma.app.delete({ where: { id: appId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/apps/[appId] error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
