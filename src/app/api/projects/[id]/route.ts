import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks, flowInstances, flowTemplates } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, asc, isNull } from "drizzle-orm";

async function getProjectOrThrow(id: string, userId: string) {
  const project = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
    .limit(1);
  if (project.length === 0) {
    throw new Error("项目不存在");
  }
  return project[0];
}

async function updateTaskAndChildren(taskId: string, date: Date) {
  const dateStr = date.toISOString().split("T")[0];
  await db
    .update(tasks)
    .set({ dueDate: new Date(dateStr) })
    .where(eq(tasks.id, taskId));

  const children = await db
    .select()
    .from(tasks)
    .where(eq(tasks.parentTaskId, taskId));

  for (const child of children) {
    await db
      .update(tasks)
      .set({ dueDate: new Date(dateStr) })
      .where(eq(tasks.id, child.id));
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const project = await getProjectOrThrow(id, session.userId);

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, id))
      .orderBy(asc(tasks.createdAt));

    const flowInstanceResult = await db
      .select()
      .from(flowInstances)
      .where(eq(flowInstances.projectId, id))
      .limit(1);

    const flowInstance = flowInstanceResult.length > 0 ? flowInstanceResult[0] : null;

    return NextResponse.json({
      ...project,
      tasks: projectTasks,
      flowInstance: flowInstance
        ? {
            ...flowInstance,
            stageTimeLimits: flowInstance.stageTimeLimits
              ? JSON.parse(flowInstance.stageTimeLimits)
              : null,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "项目不存在") {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    console.error("获取项目失败:", error);
    return NextResponse.json({ error: "获取项目失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const project = await getProjectOrThrow(id, session.userId);

    const { name, description, currentStage, category, dueDate, stageTimeLimits, color } =
      await request.json();

    const updateData: Partial<typeof projects.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (currentStage !== undefined) updateData.currentStage = currentStage;
    if (category !== undefined) updateData.category = category;
    if (dueDate !== undefined) updateData.dueDate = dueDate === "" ? null : dueDate;
    if (color !== undefined) updateData.color = color || null;

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (stageTimeLimits !== undefined) {
      await db
        .update(flowInstances)
        .set({ stageTimeLimits: JSON.stringify(stageTimeLimits) })
        .where(eq(flowInstances.projectId, id));
    }

    if (dueDate !== undefined) {
      const newDueDate = dueDate === "" ? null : dueDate;
      const finalDueDate = newDueDate !== undefined ? newDueDate : project.dueDate;

      const finalTimeLimits =
        stageTimeLimits !== undefined
          ? stageTimeLimits
          : await (async () => {
              const fi = await db
                .select()
                .from(flowInstances)
                .where(eq(flowInstances.projectId, id))
                .limit(1);
              return fi[0]?.stageTimeLimits ? JSON.parse(fi[0].stageTimeLimits) : {};
            })();

      const templateResult = await db
        .select({ template: flowTemplates })
        .from(projects)
        .leftJoin(flowTemplates, eq(projects.flowTemplateId, flowTemplates.id))
        .where(eq(projects.id, id))
        .limit(1);

      const template = templateResult[0]?.template || null;

      if (finalDueDate) {
        const allTasks = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.projectId, id), isNull(tasks.parentTaskId)))
          .orderBy(asc(tasks.createdAt));

        if (template && allTasks.length > 0) {
          const stages = JSON.parse(template.stages) as { name: string; checklist: string[] }[];
          const endDate = new Date(finalDueDate);

          let runningDays = 0;
          for (let i = stages.length - 1; i >= 0; i--) {
            const stage = stages[i];
            const days = finalTimeLimits?.[stage.name] || 1;
            runningDays += days;
            const taskDueDate = new Date(endDate);
            taskDueDate.setDate(taskDueDate.getDate() - runningDays + days);

            if (i < allTasks.length) {
              await updateTaskAndChildren(allTasks[i].id, taskDueDate);
            }
          }
        } else if (allTasks.length > 0) {
          const totalDays =
            (Object.values(finalTimeLimits) as number[]).reduce((sum, d) => sum + d, 0) ||
            allTasks.length;
          const startDate = new Date(finalDueDate);
          startDate.setDate(startDate.getDate() - totalDays);
          const dayPerTask = totalDays / allTasks.length;

          for (let i = 0; i < allTasks.length; i++) {
            const taskDueDate = new Date(startDate);
            taskDueDate.setDate(taskDueDate.getDate() + Math.round((i + 1) * dayPerTask));
            await updateTaskAndChildren(allTasks[i].id, taskDueDate);
          }
        }
      }
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "项目不存在") {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    console.error("更新项目失败:", error);
    return NextResponse.json({ error: "更新项目失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await getProjectOrThrow(id, session.userId);

    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "项目不存在") {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    console.error("删除项目失败:", error);
    return NextResponse.json({ error: "删除项目失败" }, { status: 500 });
  }
}
