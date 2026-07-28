import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, flowInstances } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await getProjectOrThrow(id, session.userId);

    const result = await db
      .select()
      .from(flowInstances)
      .where(eq(flowInstances.projectId, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(null);
    }

    const flowInstance = result[0];
    return NextResponse.json({
      ...flowInstance,
      stageChecklistStatus: JSON.parse(flowInstance.stageChecklistStatus),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "项目不存在") {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    console.error("获取流程实例失败:", error);
    return NextResponse.json({ error: "获取流程实例失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    await getProjectOrThrow(id, session.userId);

    const { stageName, checklistIndex, completed } = await request.json();

    const result = await db
      .select()
      .from(flowInstances)
      .where(eq(flowInstances.projectId, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "流程实例不存在" }, { status: 404 });
    }

    const flowInstance = result[0];
    const status = JSON.parse(flowInstance.stageChecklistStatus) as Record<string, boolean[]>;

    if (!status[stageName]) {
      return NextResponse.json({ error: "阶段不存在" }, { status: 400 });
    }

    if (checklistIndex < 0 || checklistIndex >= status[stageName].length) {
      return NextResponse.json({ error: "检查项索引无效" }, { status: 400 });
    }

    status[stageName][checklistIndex] = completed;

    const [updated] = await db
      .update(flowInstances)
      .set({ stageChecklistStatus: JSON.stringify(status) })
      .where(eq(flowInstances.id, flowInstance.id))
      .returning();

    return NextResponse.json({
      ...updated,
      stageChecklistStatus: JSON.parse(updated.stageChecklistStatus),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "项目不存在") {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }
    console.error("更新流程实例失败:", error);
    return NextResponse.json({ error: "更新流程实例失败" }, { status: 500 });
  }
}
