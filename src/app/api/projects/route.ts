import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { projects, tasks, flowTemplates, flowInstances } from "@/db/schema";

// 获取项目列表
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status"); // in_progress | pending | completed

    const where = and(
      eq(projects.userId, session.userId),
      ...(statusFilter ? [eq(projects.progressStatus, statusFilter)] : []),
    );

    const rows = await db
      .select({
        project: projects,
        task: tasks,
      })
      .from(projects)
      .leftJoin(tasks, eq(projects.id, tasks.projectId))
      .where(where)
      .orderBy(desc(projects.updatedAt));

    // 按项目聚合任务统计
    const projectMap = new Map<string, any>();
    for (const row of rows) {
      const projectId = row.project.id;
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          ...row.project,
          taskCount: 0,
          completedCount: 0,
        });
      }
      if (row.task) {
        const p = projectMap.get(projectId);
        p.taskCount += 1;
        if (row.task.status === "done") {
          p.completedCount += 1;
        }
      }
    }

    return NextResponse.json(Array.from(projectMap.values()));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("获取项目列表失败:", error);
    return NextResponse.json({ error: "获取项目列表失败" }, { status: 500 });
  }
}

// 创建项目
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { name, description, flowTemplateId, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "项目名称不能为空" },
        { status: 400 }
      );
    }

    const result = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          name: name.trim(),
          description,
          flowTemplateId: flowTemplateId || null,
          color: color || null,
          userId: session.userId,
        })
        .returning();

      if (flowTemplateId) {
        const [template] = await tx
          .select()
          .from(flowTemplates)
          .where(eq(flowTemplates.id, flowTemplateId))
          .limit(1);

        if (template) {
          const stages = JSON.parse(template.stages) as {
            name: string;
            checklist: string[];
          }[];
          const stageChecklistStatus: Record<string, boolean[]> = {};
          for (const stage of stages) {
            stageChecklistStatus[stage.name] = stage.checklist.map(() => false);
          }

          await tx.insert(flowInstances).values({
            projectId: project.id,
            templateId: flowTemplateId,
            stageChecklistStatus: JSON.stringify(stageChecklistStatus),
          });

          if (stages.length > 0) {
            await tx
              .update(projects)
              .set({ currentStage: stages[0].name })
              .where(eq(projects.id, project.id));
            project.currentStage = stages[0].name;
          }
        }
      }

      return project;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("创建项目失败:", error);
    return NextResponse.json({ error: "创建项目失败" }, { status: 500 });
  }
}
