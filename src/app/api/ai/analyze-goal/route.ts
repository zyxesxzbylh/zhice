import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";

export async function POST(request: Request) {
  try {
    const { goal } = await request.json();

    if (!goal || typeof goal !== "string" || !goal.trim()) {
      return NextResponse.json({ error: "目标不能为空" }, { status: 400 });
    }

    const prompt = `用户设定了一个下阶段目标："${goal.trim()}"

请作为职场成长教练，用一句话（不超过30字）分析这个目标的价值或给出执行建议。直接返回纯文本，不要引号、不要前缀。`;

    let reason = "";
    try {
      const response = await callDeepSeek(prompt, {
        temperature: 0.5,
        maxTokens: 80,
        systemPrompt: "你是职场成长教练，给目标提供简洁的一句话说分析和建议。只返回纯文本。",
      });
      reason = response.trim().replace(/^["']|["']$/g, "");
    } catch {
      reason = "用户自定义目标";
    }

    return NextResponse.json({ reason });
  } catch (error) {
    console.error("AI 目标分析失败:", error);
    return NextResponse.json({ error: "分析失败" }, { status: 500 });
  }
}
