import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// 获取用户通知列表
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    const result = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取通知失败:", error);
    return NextResponse.json({ error: "获取通知失败" }, { status: 500 });
  }
}

// 创建通知（内部使用）
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const { type, title, message, data } = await request.json();

    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      })
      .returning();

    return NextResponse.json(notification);
  } catch (error) {
    console.error("创建通知失败:", error);
    return NextResponse.json({ error: "创建通知失败" }, { status: 500 });
  }
}
