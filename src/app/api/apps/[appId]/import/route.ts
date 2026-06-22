import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ appId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { appId } = await params;

    const app = await prisma.app.findFirst({ where: { id: appId, userId: session.user.id } });
    if (!app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 });
    }

    const body = await req.json();
    const { modelName, records } = body;

    if (!modelName || typeof modelName !== 'string') {
      return NextResponse.json({ success: false, error: 'modelName is required' }, { status: 400 });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ success: false, error: 'records must be a non-empty array' }, { status: 400 });
    }

    if (records.length > 1000) {
      return NextResponse.json({ success: false, error: 'Max 1000 records per import' }, { status: 400 });
    }

    // Bulk insert records
    const created = await prisma.appRecord.createMany({
      data: records.map((record: Record<string, unknown>) => ({
        appId,
        modelName,
       data: record as any,
      })),
    });

    return NextResponse.json({
      success: true,
      data: {
        imported: created.count,
        total: records.length,
      },
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
