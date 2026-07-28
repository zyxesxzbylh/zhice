import { NextResponse } from "next/server";
import { db } from "@/db";
import { flowTemplates, projects, flowInstances, tasks } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .select()
      .from(flowTemplates)
      .where(eq(flowTemplates.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    const template = result[0];
    return NextResponse.json({
      ...template,
      stages: JSON.parse(template.stages),
    });
  } catch (error) {
    console.error("获取模板失败:", error);
    return NextResponse.json({ error: "获取模板失败" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db
      .select()
      .from(flowTemplates)
      .where(eq(flowTemplates.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    const { name, stages, deadline } = await request.json();

    const data: Partial<typeof flowTemplates.$inferInsert> = {};
    if (name !== undefined) data.name = name;
    if (stages !== undefined) data.stages = JSON.stringify(stages);
    if (deadline !== undefined) data.deadline = deadline;

    const [template] = await db
      .update(flowTemplates)
      .set(data)
      .where(eq(flowTemplates.id, id))
      .returning();

    return NextResponse.json({
      ...template,
      stages: JSON.parse(template.stages),
    });
  } catch (error) {
    console.error("更新模板失败:", error);
    return NextResponse.json({ error: "更新模板失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db
      .select()
      .from(flowTemplates)
      .where(eq(flowTemplates.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    const linkedProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.flowTemplateId, id));

    if (linkedProjects.length > 0) {
      const projectIds = linkedProjects.map((p) => p.id);
      await db.delete(flowInstances).where(inArray(flowInstances.projectId, projectIds));
      await db.delete(tasks).where(inArray(tasks.projectId, projectIds));
      await db.delete(projects).where(inArray(projects.id, projectIds));
    }

    await db.delete(flowTemplates).where(eq(flowTemplates.id, id));

    return NextResponse.json({
      success: true,
      deletedProjects: linkedProjects.length,
    });
  } catch (error) {
    console.error("删除模板失败:", error);
    return NextResponse.json({ error: "删除模板失败" }, { status: 500 });
  }
}
