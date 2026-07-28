import { NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function POST(request: Request) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API 密钥未配置，请设置 DEEPSEEK_API_KEY 环境变量" },
        { status: 500 }
      );
    }

    const { taskTitle, prompt } = await request.json();

    if (!taskTitle || !taskTitle.trim()) {
      return NextResponse.json(
        { error: "任务标题不能为空" },
        { status: 400 }
      );
    }

    let userPrompt = prompt || "拆分为 3-5 个子任务";

    const systemPrompt = `你是一个项目任务拆分助手。请将用户的任务拆解为具体的、可执行的子任务列表。
根据用户的要求（如拆分为3个、5个、按阶段、按优先级等），生成适当数量的子任务。
只输出子任务标题，每行一个，不要其他解释。`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `任务：${taskTitle}\n要求：${userPrompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek API 错误:", await response.text());
      return NextResponse.json(
        { error: "AI 服务异常，请稍后重试" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI 返回结果为空" },
        { status: 502 }
      );
    }

    const subtasks = content
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && !line.startsWith("```"))
      .map((line: string) => line.replace(/^\d+[.、]\s*/, ""));

    if (subtasks.length === 0) {
      return NextResponse.json(
        { error: "未能解析子任务，请重试" },
        { status: 502 }
      );
    }

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("AI 拆分失败:", error);
    return NextResponse.json(
      { error: "拆分失败，请稍后重试" },
      { status: 500 }
    );
  }
}
