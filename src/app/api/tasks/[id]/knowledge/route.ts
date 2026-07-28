import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { taskKnowledge } from '@/db/schema/relations';
import { knowledgeEntries } from '@/db/schema/knowledge';
import { and, eq, inArray } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;

  const associations = await db.query.taskKnowledge.findMany({
    where: eq(taskKnowledge.taskId, id),
  });

  const knowledgeIds = associations.map(a => a.knowledgeId);
  const linkedKnowledge = knowledgeIds.length > 0
    ? await db.query.knowledgeEntries.findMany({
        where: (fields, ops) => ops.inArray(fields.id, knowledgeIds),
        columns: { id: true, title: true, category: true, sourceType: true, createdAt: true },
      })
    : [];

  return NextResponse.json({
    taskId: id,
    knowledge: linkedKnowledge,
    relations: associations,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const body = await req.json();
  const { knowledgeId, relationType = 'reference' } = body;

  if (!knowledgeId) {
    return NextResponse.json({ error: 'knowledgeId is required' }, { status: 400 });
  }

  const [entry] = await db.insert(taskKnowledge).values({
    taskId: id,
    knowledgeId,
    relationType,
  }).returning();

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const { knowledgeId } = await req.json();

  await db.delete(taskKnowledge)
    .where(and(eq(taskKnowledge.taskId, id), eq(taskKnowledge.knowledgeId, knowledgeId)));

  return NextResponse.json({ success: true });
}
