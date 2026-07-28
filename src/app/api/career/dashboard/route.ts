import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { retrospectives } from "@/db/schema";
import { generateDashboard } from "@/lib/career/dashboard";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "week") as "week" | "month" | "quarter";

    // 计算时间范围
    const now = new Date();
    const startDate = new Date(now);
    if (period === "week") startDate.setDate(now.getDate() - 7);
    else if (period === "month") startDate.setMonth(now.getMonth() - 1);
    else startDate.setMonth(now.getMonth() - 3);

    const startDateStr = startDate.toISOString().split("T")[0];

    // 读取时间范围内的复盘数据
    const rows = await db
      .select()
      .from(retrospectives)
      .where(eq(retrospectives.userId, session.userId))
      .orderBy(retrospectives.date);

    // 归一化数据
    const parsedRows = rows
      .filter((r) => r.date >= startDateStr)
      .map((r) => ({
        ...r,
        skillUsed: r.skillUsed ? JSON.parse(r.skillUsed) : [],
        completedTasks: [],
      }));

    // 生成仪表盘
    const dashboard = generateDashboard(parsedRows as any, [], period);
    return NextResponse.json(dashboard);

  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("获取成长仪表盘失败:", error);
    return NextResponse.json({ error: "获取失败，请稍后重试" }, { status: 500 });
  }
}
