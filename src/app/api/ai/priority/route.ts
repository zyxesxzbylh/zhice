import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  calculatePriority,
  analyzePriorityWithAI,
  type PriorityGuideContext,
} from "@/lib/ai/priority-guide";

/**
 * POST /api/ai/priority
 * 接收任务信息和四维度答案，返回优先级评估
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { taskTitle, taskDescription, answers, useAI = false } = body;

    if (!taskTitle || !answers || !Array.isArray(answers) || answers.length !== 4) {
      return NextResponse.json(
        { error: "缺少必要参数：taskTitle 和四维度 answers（长度为4的数组）" },
        { status: 400 }
      );
    }

    // 1. 本地计算优先级
    const result = calculatePriority(answers);

    // 2. 可选：AI 深度分析
    let aiAnalysis = null;
    if (useAI) {
      const context: PriorityGuideContext = {
        taskTitle,
        taskDescription,
      };

      try {
        aiAnalysis = await analyzePriorityWithAI(context, answers);
      } catch (aiError) {
        console.error("AI 分析失败:", aiError);
        // AI 失败不影响本地计算结果
      }
    }

    return NextResponse.json({
      ...result,
      aiAnalysis,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("优先级评估失败:", error);
    return NextResponse.json(
      { error: "评估失败，请稍后重试" },
      { status: 500 }
    );
  }
}
