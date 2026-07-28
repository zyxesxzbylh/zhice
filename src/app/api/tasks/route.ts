import { NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, projects, tags, taskTags } from "@/db/schema";

// 获取任务列表
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const parentTaskId = searchParams.get("parentTaskId");

    const conditions = [eq(projects.userId, session.userId)];

    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    if (parentTaskId !== null) {
      if (parentTaskId === "") {
        conditions.push(isNull(tasks.parentTaskId));
      } else {
        conditions.push(eq(tasks.parentTaskId, parentTaskId));
      }
    }

    const rows = await db
      .select({
        task: tasks,
        project: projects,
        tag: tags,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(taskTags, eq(tasks.id, taskTags.taskId))
      .leftJoin(tags, eq(taskTags.tagId, tags.id))
      .where(and(...conditions))
      .orderBy(tasks.createdAt);

    // 按任务聚合标签
    const taskMap = new Map<string, any>();
    for (const row of rows) {
      const taskId = row.task.id;
      if (!taskMap.has(taskId)) {
        taskMap.set(taskId, {
          ...row.task,
          project: row.project?.name || null,
          isSop: row.project?.description?.startsWith("SOP工作流") || false,
          tags: [],
        });
      }
      if (row.tag) {
        taskMap.get(taskId).tags.push(row.tag);
      }
    }

    return NextResponse.json(Array.from(taskMap.values()));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("获取任务列表失败:", error);
    return NextResponse.json({ error: "获取任务列表失败" }, { status: 500 });
  }
}

// 创建任务
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const {
      projectId,
      parentTaskId,
      title,
      description,
      status,
      priority,
      dueDate,
      startTime,
      endTime,
      estimatedMinutes,
      reminderAt,
      tagIds,
    } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "项目ID不能为空" },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "任务标题不能为空" },
        { status: 400 }
      );
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.userId)))
      .limit(1);

    if (!project) {
      return NextResponse.json(
        { error: "项目不存在" },
        { status: 404 }
      );
    }

    const [task] = await db
      .insert(tasks)
      .values({
        projectId,
        parentTaskId: parentTaskId || null,
        title: title.trim(),
        description,
        status: status || "todo",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        estimatedMinutes: estimatedMinutes || null,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
      })
      .returning();

    // 添加标签关联
    if (tagIds && tagIds.length > 0) {
      await db.insert(taskTags).values(
        tagIds.map((tagId: string) => ({
          taskId: task.id,
          tagId,
        }))
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("创建任务失败:", error);
    return NextResponse.json({ error: "创建任务失败" }, { status: 500 });
  }
}
