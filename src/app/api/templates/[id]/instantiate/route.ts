import { NextResponse } from "next/server";
import { db } from "@/db";
import { flowTemplates, projects, tasks, flowInstances } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // 1. 读取模板
    const templateResult = await db
      .select()
      .from(flowTemplates)
      .where(eq(flowTemplates.id, id))
      .limit(1);

    if (templateResult.length === 0) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    const template = templateResult[0];
    const stages = JSON.parse(template.stages) as {
      name: string;
      checklist: string[];
    }[];

    // 2. 创建新项目
    const projectName = `${template.name}实例`;
    const result = await db.transaction(async (tx) => {
      const [project] = await tx
        .insert(projects)
        .values({
          name: projectName,
          description: `由模板「${template.name}」实例化创建`,
          flowTemplateId: template.id,
          userId: session.userId,
        })
        .returning();

      // 3. 创建流程实例
      const stageChecklistStatus: Record<string, boolean[]> = {};
      for (const stage of stages) {
        stageChecklistStatus[stage.name] = stage.checklist.map(() => false);
      }

      await tx.insert(flowInstances).values({
        projectId: project.id,
        templateId: template.id,
        stageChecklistStatus: JSON.stringify(stageChecklistStatus),
      });

      // 4. 为每个 stage 创建任务
      const createdTasks: { id: string; title: string }[] = [];
      const now = new Date();

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + i);

        const [task] = await tx
          .insert(tasks)
          .values({
            projectId: project.id,
            title: stage.name,
            description: `检查项:\n${stage.checklist.map((c) => `- ${c}`).join("\n")}`,
            status: "todo",
            priority: "medium",
            dueDate,
          })
          .returning();

        createdTasks.push({ id: task.id, title: task.title });

        // 5. 为每个 checklist item 创建子任务
        for (let j = 0; j < stage.checklist.length; j++) {
          const item = stage.checklist[j];
          const itemDueDate = new Date(now);
          itemDueDate.setDate(itemDueDate.getDate() + i);

          const [subTask] = await tx
            .insert(tasks)
            .values({
              projectId: project.id,
              parentTaskId: task.id,
              title: item,
              description: `来自「${template.name}」模板「${stage.name}」阶段的检查项`,
              status: "todo",
              priority: "medium",
              dueDate: itemDueDate,
            })
            .returning();

          createdTasks.push({ id: subTask.id, title: subTask.title });
        }
      }

      // 6. 设置项目当前阶段
      if (stages.length > 0) {
        await tx
          .update(projects)
          .set({ currentStage: stages[0].name })
          .where(eq(projects.id, project.id));
      }

      return { project, createdTasks };
    });

    return NextResponse.json({
      projectId: result.project.id,
      createdTasks: result.createdTasks,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("实例化模板失败:", error);
    return NextResponse.json({ error: "实例化模板失败" }, { status: 500 });
  }
}
