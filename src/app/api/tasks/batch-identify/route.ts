import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface SubtaskItem {
  title: string;
  description: string;
}

interface IdentifiedTask {
  title: string;
  description: string;
  subtasks: SubtaskItem[];
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

    const { text, projectContext } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "内容不能为空" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一个智能任务管理助手，擅长从用户输入的文本中识别和拆分任务。

请分析用户输入的内容，完成以下工作：
1. 从文本中提取出所有独立的任务项（2-8个）
2. 对每个任务判断是否需要进一步拆分为子任务
3. 为每个任务生成标题、描述和子任务列表

要求：
- 任务之间要相互独立，不要重叠
- 每个任务的标题简洁明确
- 子任务是具体的可执行动作
- 如果某个任务足够简单不需要拆分，子任务列表可以为空
- 输出严格的 JSON 格式`;

    const userPrompt = `请分析以下内容，提取并拆分任务：

${text.trim()}

${projectContext ? `项目/阶段上下文：${projectContext}` : ""}

请严格按照以下 JSON 格式输出：
{
  "tasks": [
    {
      "title": "任务标题",
      "description": "任务描述",
      "subtasks": [
        { "title": "子任务标题", "description": "子任务描述" }
      ]
    }
  ]
}`;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
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
        { error: "AI 返回结果为空，请稍后重试" },
        { status: 502 }
      );
    }

    let parsed: { tasks: IdentifiedTask[] };
    try {
      const cleaned = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("JSON 解析失败，原始内容:", content);
      return NextResponse.json(
        { error: "AI 返回格式错误，请稍后重试" },
        { status: 502 }
      );
    }

    if (!parsed.tasks || !Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
      return NextResponse.json(
        { error: "AI 未返回有效的任务列表" },
        { status: 502 }
      );
    }

    const tasks = parsed.tasks.map((t: any) => ({
      title: String(t.title || "").trim(),
      description: String(t.description || "").trim(),
      subtasks: Array.isArray(t.subtasks)
        ? t.subtasks.map((s: any) => ({
            title: String(s.title || "").trim(),
            description: String(s.description || "").trim(),
          })).filter((s: SubtaskItem) => s.title)
        : [],
    })).filter((t: IdentifiedTask) => t.title);

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("批量识别失败:", error);
    return NextResponse.json(
      { error: "识别失败，请稍后重试" },
      { status: 500 }
    );
  }
}
