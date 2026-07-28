import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { tags } from "@/db/schema";

// 获取用户标签列表
export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    const userTags = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, session.userId))
      .orderBy(tags.name);

    return NextResponse.json(userTags);
  } catch (error) {
    console.error("获取标签失败:", error);
    return NextResponse.json({ error: "获取标签失败" }, { status: 500 });
  }
}

// 创建标签
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { name, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "标签名称不能为空" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // 检查是否已存在
    const existing = await db
      .select()
      .from(tags)
      .where(and(eq(tags.name, trimmedName), eq(tags.userId, session.userId)))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "标签已存在" }, { status: 409 });
    }

    const [tag] = await db
      .insert(tags)
      .values({
        name: trimmedName,
        color: color || "#6b7280",
        userId: session.userId,
      })
      .returning();

    return NextResponse.json(tag);
  } catch (error) {
    console.error("创建标签失败:", error);
    return NextResponse.json({ error: "创建标签失败" }, { status: 500 });
  }
}
