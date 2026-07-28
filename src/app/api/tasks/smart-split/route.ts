import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface SubtaskResult {
  subtasks: { title: string; description: string }[];
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DeepSeek API 密钥未配置" },
        { status: 500 }
      );
    }

    const { title, description } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "任务标题不能为空" },
        { status: 400 }
      );
    }

    const prompt = `请将以下任务拆解为 3-5 个子任务，输出严格的 JSON 格式（不要包含任何其他文字）：
{
  "subtasks": [
    {"title": "子任务标题", "description": "子任务描述"}
  ]
}

任务标题：${title}
${description ? `任务描述：${description}` : ""}`;

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
            content: "你是一个项目任务拆分助手。请将用户的任务拆解为具体的、可执行的子任务列表。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek API 错误:", await response.text());
      return NextResponse.json(
        { error: "AI 拆分服务异常，请稍后重试" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI 返回结果为空，请稍后重试" },
        { status: 502 }
      );
    }

    let parsed: SubtaskResult;
    try {
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON 解析失败，原始内容:", content);
      return NextResponse.json(
        { error: "AI 返回格式错误，请稍后重试或手动添加子任务" },
        { status: 502 }
      );
    }

    if (!parsed.subtasks || !Array.isArray(parsed.subtasks) || parsed.subtasks.length === 0) {
      return NextResponse.json(
        { error: "AI 未返回有效的子任务列表" },
        { status: 502 }
      );
    }

    return NextResponse.json({ subtasks: parsed.subtasks });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("智能拆分失败:", error);
    return NextResponse.json(
      { error: "拆分失败，请稍后重试或手动添加子任务" },
      { status: 500 }
    );
  }
}
