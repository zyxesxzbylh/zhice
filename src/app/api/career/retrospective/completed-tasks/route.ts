import { NextResponse } from "next/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, projects } from "@/db/schema";

const VALID_TYPES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;

function getPeriodRange(type: string, date: string) {
  const d = new Date(date);
  switch (type) {
    case "daily":
      return { startDate: date, endDate: date };
    case "weekly": {
      const dayOfWeek = d.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(d);
      monday.setDate(d.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = (dt: Date) => dt.toISOString().split("T")[0];
      return { startDate: fmt(monday), endDate: fmt(sunday) };
    }
    case "monthly": {
      const y = d.getFullYear();
      const m = d.getMonth();
      const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { startDate: start, endDate: end };
    }
    case "quarterly": {
      const y = d.getFullYear();
      const q = Math.floor(d.getMonth() / 3);
      const startMonth = q * 3;
      const start = `${y}-${String(startMonth + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(y, startMonth + 3, 0).getDate();
      const end = `${y}-${String(startMonth + 3).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { startDate: start, endDate: end };
    }
    case "yearly": {
      const y = d.getFullYear();
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
    }
    default:
      return { startDate: date, endDate: date };
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const type = body.type || "daily";
    const date = body.date || new Date().toISOString().split("T")[0];

    const { startDate, endDate } = getPeriodRange(type, date);

    const rows = await db
      .select({ task: tasks, projectName: projects.name })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(projects.userId, session.userId),
          eq(tasks.status, "done"),
          gte(tasks.completedAt, new Date(startDate)),
          lte(tasks.completedAt, new Date(endDate + "T23:59:59Z"))
        )
      )
      .orderBy(tasks.completedAt);

    return NextResponse.json({
      tasks: rows.map((r) => ({
        id: r.task.id,
        title: r.task.title,
        projectName: r.projectName,
        completedAt: r.task.completedAt?.toISOString() || null,
        estimatedMinutes: r.task.estimatedMinutes,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
