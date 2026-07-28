import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feishuConfig } from '@/db/schema/feishu';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const session = await requireAuth();

  const config = await db.query.feishuConfig.findFirst({
    where: eq(feishuConfig.userId, session.userId),
    columns: {
      id: true, userId: true, appId: true,
      spreadsheetToken: true, syncEnabled: true,
      createdAt: true, updatedAt: true,
    },
  });

  return NextResponse.json(config || null);
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  const body = await req.json();

  const existing = await db.query.feishuConfig.findFirst({
    where: eq(feishuConfig.userId, session.userId),
  });

  if (existing) {
    const [updated] = await db.update(feishuConfig)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(feishuConfig.userId, session.userId))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db.insert(feishuConfig)
    .values({ userId: session.userId, ...body })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
