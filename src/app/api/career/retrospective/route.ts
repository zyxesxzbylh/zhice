import { NextResponse } from "next/server";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { retrospectives, tasks, projects } from "@/db/schema";
import { generateRetrospectiveInsights } from "@/lib/career/retrospective";
import { precipitateFromRetrospective } from "@/lib/knowledge/precipitation";

const VALID_TYPES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;
type RetroType = (typeof VALID_TYPES)[number];

/** 根据复盘类型和日期，计算周期的起止日期 */
function getPeriodRange(type: RetroType, date: string): { startDate: string; endDate: string; label: string } {
  const d = new Date(date);
  switch (type) {
    case "daily":
      return { startDate: date, endDate: date, label: date };
    case "weekly": {
      // 周一为起始
      const dayOfWeek = d.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (dt: Date) => dt.toISOString().split("T")[0];
      return { startDate: fmt(monday), endDate: fmt(sunday), label: `${fmt(monday)} ~ ${fmt(sunday)}` };
    }
    case "monthly": {
      const y = d.getFullYear();
      const m = d.getMonth();
      const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { startDate: start, endDate: end, label: `${y}年${m + 1}月` };
    }
    case "quarterly": {
      const y = d.getFullYear();
      const q = Math.floor(d.getMonth() / 3);
      const startMonth = q * 3;
      const start = `${y}-${String(startMonth + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, startMonth + 3, 0).getDate();
      const end = `${y}-${String(startMonth + 3).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { startDate: start, endDate: end, label: `${y}年Q${q + 1}` };
    }
    case "yearly": {
      const y = d.getFullYear();
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31`, label: `${y}年` };
    }
  }
}

/** 查询指定用户在日期范围内的已完成任务 */
async function getCompletedTasks(userId: string, startDate: string, endDate: string) {
  const rows = await db
    .select({ task: tasks, projectName: projects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.userId, userId),
        eq(tasks.status, "done"),
        gte(tasks.completedAt, new Date(startDate)),
        lte(tasks.completedAt, new Date(endDate + "T23:59:59Z"))
      )
    )
    .orderBy(tasks.completedAt);

  return rows.map((r) => ({
    taskId: r.task.id,
    title: r.task.title,
    valueType: "task",
    completedAt: r.task.completedAt || new Date(),
  }));
}

/* ── POST ── */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const retroType: RetroType = VALID_TYPES.includes(body.type) ? body.type : "daily";
    const date = body.date || new Date().toISOString().split("T")[0];

    const { startDate, endDate, label: periodLabel } = getPeriodRange(retroType, date);

    const {
      energyLevel,
      focusLevel,
      satisfaction,
      tomorrowPriority,
      biggestWin,
      biggestChallenge,
      lessonLearned,
      skillUsed,
      newInsight,
    } = body;

    if (energyLevel === undefined || focusLevel === undefined || satisfaction === undefined) {
      return NextResponse.json(
        { error: "缺少必要参数：energyLevel, focusLevel, satisfaction" },
        { status: 400 }
      );
    }

    // ── 自动归档已完成任务 ──
    const completedTasks = await getCompletedTasks(session.userId, startDate, endDate);

    // ── 检查是否已存在同类型同周期的复盘 ──
    const existing = await db
      .select()
      .from(retrospectives)
      .where(
        and(
          eq(retrospectives.userId, session.userId),
          eq(retrospectives.type, retroType),
          eq(retrospectives.date, date)
        )
      )
      .limit(1);

    // ── 读取历史用于 AI 趋势分析 ──
    const history = await db
      .select()
      .from(retrospectives)
      .where(eq(retrospectives.userId, session.userId))
      .orderBy(desc(retrospectives.date))
      .limit(30);

    // ── AI 洞察 ──
    const retrospectiveData: any = {
      date: periodLabel,
      type: retroType,
      completedTasks: completedTasks.map((t) => ({ taskId: t.taskId!, title: t.title })),
      energyLevel,
      focusLevel,
      satisfaction,
      tomorrowPriority,
      biggestWin,
      biggestChallenge,
      lessonLearned,
      skillUsed: skillUsed || [],
      newInsight,
    };

    const insights = await generateRetrospectiveInsights(retrospectiveData, history as any);

    // ── 保存 ──
    const dbData = {
      userId: session.userId,
      type: retroType,
      date,
      taskIds: completedTasks.map((t) => t.taskId),
      energyLevel,
      focusLevel,
      satisfaction,
      tomorrowPriority: tomorrowPriority || null,
      biggestWin: biggestWin || null,
      biggestChallenge: biggestChallenge || null,
      lessonLearned: lessonLearned || null,
      skillUsed: skillUsed ? JSON.stringify(skillUsed) : null,
      newInsight: newInsight || null,
      aiSummary: insights.summary,
      aiSuggestions: insights.suggestions ? JSON.stringify(insights.suggestions) : null,
      trendAnalysis: insights.trend,
    };

    let savedId: string;
    if (existing.length > 0) {
      savedId = existing[0].id;
      await db
        .update(retrospectives)
        .set({ ...dbData, updatedAt: new Date() })
        .where(eq(retrospectives.id, savedId));
    } else {
      const [inserted] = await db.insert(retrospectives).values(dbData).returning();
      savedId = inserted.id;
    }

    // 复盘提交 → 自动沉淀知识
    precipitateFromRetrospective({
      userId: session.userId,
      retrospectiveId: savedId,
      date: periodLabel,
      lessonLearned,
      biggestWin,
      newInsight,
      skillUsed,
    }).catch((e) => console.error("复盘知识沉淀失败:", e));

    return NextResponse.json({
      saved: true,
      insights,
      periodLabel,
      completedTasks,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("提交复盘失败:", error);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
}

/* ── GET ── */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const type = searchParams.get("type") as RetroType | null;
    const limit = parseInt(searchParams.get("limit") || "30");

    const conditions = [eq(retrospectives.userId, session.userId)];

    if (date) conditions.push(eq(retrospectives.date, date));
    if (type && VALID_TYPES.includes(type)) conditions.push(eq(retrospectives.type, type));

    const result = await db
      .select()
      .from(retrospectives)
      .where(and(...conditions))
      .orderBy(desc(retrospectives.date))
      .limit(Math.min(limit, 100));

    const parsed = result.map((r) => ({
      ...r,
      skillUsed: r.skillUsed ? JSON.parse(r.skillUsed) : [],
      aiSuggestions: r.aiSuggestions ? JSON.parse(r.aiSuggestions) : [],
      taskIds: r.taskIds || [],
    }));

    return NextResponse.json(date ? (parsed[0] || null) : parsed);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("获取复盘失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
