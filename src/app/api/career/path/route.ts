import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { careerProfile } from "@/db/schema/career";

export type CareerPath = "expert" | "management";

interface CareerPathPayload {
  careerPath: CareerPath;
  reviewBaseDate?: string; // 述职基准日期，如 "2026-07-22"
}

/**
 * GET /api/career/path
 * 返回用户的职业路线选择
 */
export async function GET() {
  try {
    const session = await requireAuth();
    const userId = session.userId;

    const rows = await db
      .select({
        careerPath: careerProfile.careerPath,
        reviewBaseDate: careerProfile.reviewBaseDate,
      })
      .from(careerProfile)
      .where(eq(careerProfile.userId, userId))
      .limit(1);

    if (rows.length === 0 || !rows[0].careerPath) {
      return NextResponse.json({
        careerPath: null,
        reviewBaseDate: null,
        message: "尚未选择职业路线",
      });
    }

    return NextResponse.json({
      careerPath: rows[0].careerPath,
      reviewBaseDate: rows[0].reviewBaseDate || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("获取职业路线失败:", error);
    return NextResponse.json({ error: "获取失败，请稍后重试" }, { status: 500 });
  }
}

/**
 * POST /api/career/path
 * 保存用户的职业路线选择
 * Body: { careerPath: "expert" | "management", reviewBaseDate?: string }
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const userId = session.userId;
    const body: CareerPathPayload = await request.json();

    if (!body.careerPath || !["expert", "management"].includes(body.careerPath)) {
      return NextResponse.json(
        { error: "职业路线必须是 'expert' 或 'management'" },
        { status: 400 }
      );
    }

    // 检查 career_profile 中是否已有该用户的记录
    const existing = await db
      .select({ id: careerProfile.id })
      .from(careerProfile)
      .where(eq(careerProfile.userId, userId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(careerProfile).values({
        userId,
        careerPath: body.careerPath,
        reviewBaseDate: body.reviewBaseDate ? new Date(body.reviewBaseDate) : null,
      });
    } else {
      await db
        .update(careerProfile)
        .set({
          careerPath: body.careerPath,
          reviewBaseDate: body.reviewBaseDate ? new Date(body.reviewBaseDate) : null,
          updatedAt: new Date(),
        })
        .where(eq(careerProfile.userId, userId));
    }

    return NextResponse.json({
      success: true,
      careerPath: body.careerPath,
      reviewBaseDate: body.reviewBaseDate || null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("保存职业路线失败:", error);
    return NextResponse.json({ error: "保存失败，请稍后重试" }, { status: 500 });
  }
}
