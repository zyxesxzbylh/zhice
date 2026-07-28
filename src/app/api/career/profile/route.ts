import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { careerProfile } from '@/db/schema/career';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const session = await requireAuth();

  const profile = await db.query.careerProfile.findFirst({
    where: eq(careerProfile.userId, session.userId),
  });

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const session = await requireAuth();
  const body = await req.json();

  const existing = await db.query.careerProfile.findFirst({
    where: eq(careerProfile.userId, session.userId),
  });

  if (existing) {
    const [updated] = await db.update(careerProfile)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(careerProfile.userId, session.userId))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db.insert(careerProfile)
    .values({ userId: session.userId, ...body })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
