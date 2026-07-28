import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// 标记所有通知为已读
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("标记全部已读失败:", error);
    return NextResponse.json({ error: "标记失败" }, { status: 500 });
  }
}
