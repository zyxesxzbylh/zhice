import { NextResponse } from "next/server";
import { db } from "@/db";
import { flowTemplates } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const templates = await db
      .select()
      .from(flowTemplates)
      .orderBy(desc(flowTemplates.createdAt));

    const parsed = templates.map((t) => ({
      ...t,
      stages: JSON.parse(t.stages),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("获取模板列表失败:", error);
    return NextResponse.json({ error: "获取模板列表失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, stages, deadline } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "模板名称不能为空" }, { status: 400 });
    }

    if (!stages || !Array.isArray(stages) || stages.length === 0) {
      return NextResponse.json({ error: "至少需要一个流程阶段" }, { status: 400 });
    }

    const [template] = await db
      .insert(flowTemplates)
      .values({
        name: name.trim(),
        stages: JSON.stringify(stages),
        deadline: deadline ?? null,
      })
      .returning();

    return NextResponse.json(
      {
        ...template,
        stages: JSON.parse(template.stages),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("创建模板失败:", error);
    return NextResponse.json({ error: "创建模板失败" }, { status: 500 });
  }
}
