import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { precipitateFromTaskCompletion } from "@/lib/knowledge/precipitation";

async function getTaskOrThrow(id: string, userId: string) {
  const result = await db
    .select({
      task: tasks,
      project: projects,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.id, id))
    .limit(1);

  if (result.length === 0) {
    throw new Error("任务不存在");
  }

  const { task, project } = result[0];
  if (project && project.userId !== userId) {
    throw new Error("任务不存在");
  }
  return task;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await getTaskOrThrow(id, session.userId);

    const { title, description, status, priority, dueDate, startTime, endTime, completedAt, valueDescription, expectedOutcome } =
      await request.json();

    const data: Partial<typeof tasks.$inferInsert> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) {
      data.status = status;
      if (status === "done") {
        data.completedAt = new Date();
      } else {
        data.completedAt = null;
      }
    }
    if (priority !== undefined) data.priority = priority;
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (startTime !== undefined) data.startTime = startTime || null;
    if (endTime !== undefined) data.endTime = endTime || null;
    if (completedAt !== undefined) {
      data.completedAt = completedAt ? new Date(completedAt) : null;
    }
    if (valueDescription !== undefined) data.valueDescription = valueDescription || null;
    if (expectedOutcome !== undefined) data.expectedOutcome = expectedOutcome || null;

    const [task] = await db
      .update(tasks)
      .set(data)
      .where(eq(tasks.id, id))
      .returning();

    // 任务完成 → 自动沉淀知识
    if (status === "done") {
      const originalTask = await getTaskOrThrow(id, session.userId);
      precipitateFromTaskCompletion({
        userId: session.userId,
        taskId: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
      }).catch((e) => console.error("知识沉淀失败:", e));
    }

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "任务不存在") {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    console.error("更新任务失败:", error);
    return NextResponse.json({ error: "更新任务失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await getTaskOrThrow(id, session.userId);

    await db.delete(tasks).where(eq(tasks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "任务不存在") {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }
    console.error("删除任务失败:", error);
    return NextResponse.json({ error: "删除任务失败" }, { status: 500 });
  }
}
