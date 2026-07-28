import { NextResponse } from "next/server";
import { eq, and, gte, lte, gt } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, projects, retrospectives } from "@/db/schema";

export interface WeeklyReport {
  weekRange: string;
  summary: {
    tasksCompleted: number;
    tasksInProgress: number;
    highValueTasks: number;
    avgEnergy: number | null;
    avgFocus: number | null;
    avgSatisfaction: number | null;
  };
  highlights: string[];
  challenges: string[];
  skillsUsed: string[];
  nextWeekGoals: string[];
  retrospectives: Array<{
    date: string;
    achievement: string;
    challenge: string;
    lesson: string;
  }>;
  highValueTaskList: Array<{
    title: string;
    valueScore: number;
    valueDescription?: string;
  }>;
}

function getWeekRange(weekStartStr: string): { start: Date; end: Date; label: string } {
  const start = new Date(weekStartStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start, end, label: `${fmt(start)} ~ ${fmt(end)}` };
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getLastMonday(d: Date): Date {
  const monday = getMonday(d);
  monday.setDate(monday.getDate() - 7);
  return monday;
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "本周";

    const now = new Date();
    const weekStart = period === "上周" ? getLastMonday(now) : getMonday(now);
    const { start, end, label } = getWeekRange(weekStart.toISOString().split("T")[0]);

    // 1. 查询本周已完成的任务（通过 projects 表关联 userId）
    const completedTasksRows = await db
      .select({
        task: tasks,
        project: projects,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, session.userId),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, start),
          lte(tasks.completedAt, end)
        )
      );

    const completedTasks = completedTasksRows.map((r) => r.task);

    // 2. 查询本周进行中的任务
    const inProgressTasksRows = await db
      .select({
        task: tasks,
        project: projects,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, session.userId),
          eq(tasks.status, "in_progress")
        )
      );

    const inProgressTasks = inProgressTasksRows.map((r) => r.task);

    // 3. 查询高价值任务（valueScore > 0，本周完成的）
    const highValueTasks = completedTasks.filter(
      (t) => t.valueScore && t.valueScore > 0
    );

    const highValueTaskList = highValueTasks
      .sort((a, b) => (b.valueScore || 0) - (a.valueScore || 0))
      .slice(0, 10)
      .map((t) => ({
        title: t.title,
        valueScore: t.valueScore || 0,
        valueDescription: t.valueDescription || undefined,
      }));

    // 4. 查询本周复盘记录
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const retroRows = await db
      .select()
      .from(retrospectives)
      .where(
        and(
          eq(retrospectives.userId, session.userId),
          gte(retrospectives.date, startStr),
          lte(retrospectives.date, endStr)
        )
      )
      .orderBy(retrospectives.date);

    // 5. 统计数据
    const tasksCompleted = completedTasks.length;
    const tasksInProgress = inProgressTasks.length;
    const highValueTaskCount = highValueTasks.length;

    const energyValues = retroRows
      .map((r) => r.energyLevel)
      .filter((v): v is number => typeof v === "number");
    const focusValues = retroRows
      .map((r) => r.focusLevel)
      .filter((v): v is number => typeof v === "number");
    const satisfactionValues = retroRows
      .map((r) => r.satisfaction)
      .filter((v): v is number => typeof v === "number");

    const avgEnergy = energyValues.length
      ? Math.round((energyValues.reduce((a, b) => a + b, 0) / energyValues.length) * 10) / 10
      : null;
    const avgFocus = focusValues.length
      ? Math.round((focusValues.reduce((a, b) => a + b, 0) / focusValues.length) * 10) / 10
      : null;
    const avgSatisfaction = satisfactionValues.length
      ? Math.round((satisfactionValues.reduce((a, b) => a + b, 0) / satisfactionValues.length) * 10) / 10
      : null;

    // 6. 收集技能使用
    const skillSet = new Set<string>();
    for (const r of retroRows) {
      if (r.skillUsed) {
        try {
          const skills = JSON.parse(r.skillUsed);
          if (Array.isArray(skills)) {
            skills.forEach((s) => skillSet.add(String(s)));
          }
        } catch {
          r.skillUsed
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => skillSet.add(s));
        }
      }
    }

    // 7. 提取亮点与挑战
    const highlights: string[] = [];
    const challenges: string[] = [];
    for (const r of retroRows) {
      if (r.biggestWin?.trim()) highlights.push(r.biggestWin.trim());
      if (r.biggestChallenge?.trim()) challenges.push(r.biggestChallenge.trim());
    }

    // 8. 生成下周目标
    const nextWeekGoals = retroRows
      .map((r) => r.tomorrowPriority)
      .filter((g): g is string => !!g && g.trim().length > 0)
      .map((g) => g.trim());

    // 9. 复盘记录摘要
    const retroSummaries = retroRows.map((r) => ({
      date: r.date,
      achievement: r.biggestWin || "",
      challenge: r.biggestChallenge || "",
      lesson: r.lessonLearned || "",
    }));

    const report: WeeklyReport = {
      weekRange: label,
      summary: {
        tasksCompleted,
        tasksInProgress,
        highValueTasks: highValueTaskCount,
        avgEnergy,
        avgFocus,
        avgSatisfaction,
      },
      highlights: [...new Set(highlights)].slice(0, 5),
      challenges: [...new Set(challenges)].slice(0, 5),
      skillsUsed: Array.from(skillSet).slice(0, 10),
      nextWeekGoals: [...new Set(nextWeekGoals)].slice(0, 5),
      retrospectives: retroSummaries,
      highValueTaskList,
    };

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("生成周报失败:", error);
    return NextResponse.json(
      {
        error: "生成周报失败，请稍后重试",
        detail: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
