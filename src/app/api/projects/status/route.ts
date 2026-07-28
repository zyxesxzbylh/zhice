import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";

// 更新项目进度状态
export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const { projectId, progressStatus } = await request.json();

    const validStatuses = ["in_progress", "pending", "completed"];
    if (!projectId || !validStatuses.includes(progressStatus)) {
      return NextResponse.json(
        { error: "无效的参数" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(projects)
      .set({ progressStatus })
      .where(eq(projects.id, projectId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    return NextResponse.json({ ...updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("更新项目状态失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
