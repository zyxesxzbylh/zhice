import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { knowledgeEntries } from '@/db/schema/knowledge';
import { taskKnowledge } from '@/db/schema/relations';
import { eq, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const knowledge = await db.query.knowledgeEntries.findFirst({
    where: eq(knowledgeEntries.id, id),
  });

  if (!knowledge) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Get linked tasks via task_knowledge
  const associations = await db.query.taskKnowledge.findMany({
    where: eq(taskKnowledge.knowledgeId, id),
    columns: { id: true, taskId: true, knowledgeId: true, relationType: true },
  });

  const taskIds = associations.map(a => a.taskId);
  const linkedTasks = taskIds.length > 0
    ? await db.query.tasks.findMany({
        where: (fields, ops) => ops.inArray(fields.id, taskIds),
        columns: { id: true, title: true, status: true, priority: true },
      })
    : [];

  return NextResponse.json({
    ...knowledge,
    linkedTasks,
    relations: associations,
  });
}
