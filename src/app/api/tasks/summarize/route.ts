import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface TaskInfo {
  id: string;
  title: string;
  description?: string;
  status: string;
  projectName?: string;
  dueDate?: string;
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

    const { completedTasks, incompleteTasks } = await request.json();

    if ((!completedTasks || completedTasks.length === 0) && (!incompleteTasks || incompleteTasks.length === 0)) {
      return NextResponse.json({
        achievement: "今日暂无任务记录。",
        tomorrowTodos: "明天可以开始规划新的工作内容，加油！",
        completedCount: 0,
        incompleteCount: 0,
      });
    }

    const systemPrompt = `你是一个智能工作总结助手。根据用户今日的任务完成情况，生成两段文字：

1. **成果总结**：基于已完成的任务，生成一段积极、具体的工作成果描述
2. **明日待办**：基于未完成的任务，生成一段条理清晰的明日工作计划

要求：
- 成果总结要突出工作价值和产出，用第一人称，语气积极向上
- 明日待办要按优先级排列，简洁明了
- 每段控制在 100-300 字之间
- 语言自然流畅，像真实的工作日报风格
- 输出严格的 JSON 格式`;

    const completedList = (completedTasks || []).map((t: TaskInfo) =>
      `- [${t.projectName || "未分类"}] ${t.title}${t.description ? "（" + t.description + "）" : ""}`
    ).join("\n");

    const incompleteList = (incompleteTasks || []).map((t: TaskInfo) =>
      `- [${t.projectName || "未分类"}] ${t.title}${t.description ? "（" + t.description + "）" : ""}`
    ).join("\n");

    const userPrompt = `请根据以下今日任务情况，生成成果总结和明日待办：

=== 今日已完成的任务 (${completedTasks?.length || 0} 个) ===
${completedList || "无"}

=== 今日未完成的任务 (${incompleteTasks?.length || 0} 个) ===
${incompleteList || "无"}

请严格按照以下 JSON 格式输出：
{
  "achievement": "成果总结内容",
  "tomorrowTodos": "明日待办内容"
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
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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

    let parsed: { achievement: string; tomorrowTodos: string };
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

    if (!parsed.achievement || !parsed.tomorrowTodos) {
      return NextResponse.json(
        { error: "AI 未返回有效的总结内容" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      achievement: parsed.achievement,
      tomorrowTodos: parsed.tomorrowTodos,
      completedCount: completedTasks?.length || 0,
      incompleteCount: incompleteTasks?.length || 0,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("工作总结失败:", error);
    return NextResponse.json(
      { error: "总结失败，请稍后重试" },
      { status: 500 }
    );
  }
}
