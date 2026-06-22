import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ appId: string; recordId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, recordId } = await params;

    // Verify app ownership
    const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const record = await prisma.appRecord.findFirst({ where: { id: recordId, appId } });
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

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
    });
  } catch (error) {
    console.error('GET record error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, recordId } = await params;

    // Verify app ownership
    const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const record = await prisma.appRecord.findFirst({ where: { id: recordId, appId } });
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    const body = await req.json();
    const { data } = body;

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: 'data must be an object' }, { status: 400 });
    }

    // Merge with existing data for partial updates
    const existingData = record.data as Record<string, unknown>;
    const mergedData = { ...existingData, ...data };

    const updated = await prisma.appRecord.update({
      where: { id: recordId },
      data: { data: mergedData },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        appId: updated.appId,
        modelName: updated.modelName,
        data: updated.data,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('PUT record error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appId, recordId } = await params;

    // Verify app ownership
    const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const record = await prisma.appRecord.findFirst({ where: { id: recordId, appId } });
    if (!record) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    await prisma.appRecord.delete({ where: { id: recordId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE record error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
