import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

interface StageData {
  name: string;
  checklist: string[];
}

interface TextToProjectResult {
  projectName: string;
  description: string;
  stages: StageData[];
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

    const { text } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "内容不能为空" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一个智能项目管理助手，擅长从用户输入的文本中提取结构化的项目信息。

请分析用户输入的内容，提取出：
1. 项目名称（简洁明确）
2. 项目描述（一句话概括目标和范围）
3. 工作阶段（2-6个），每个阶段包含名称和3-5个检查项（checklist）

要求：
- 阶段按工作流程的逻辑顺序排列
- 每个阶段的名称要简洁专业
- 检查项是具体的可执行动作或交付物
- 输出严格的 JSON 格式`;

    const userPrompt = `请分析以下内容，生成结构化项目信息：

${text.trim()}

请严格按照以下 JSON 格式输出：
{
  "projectName": "项目名称",
  "description": "项目描述",
  "stages": [
    { "name": "阶段名", "checklist": ["检查项1", "检查项2", "检查项3"] }
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
        max_tokens: 2000,
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

    let parsed: TextToProjectResult;
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

    if (!parsed.projectName || !parsed.stages || !Array.isArray(parsed.stages) || parsed.stages.length === 0) {
      return NextResponse.json(
        { error: "AI 未返回有效的项目信息" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      projectName: String(parsed.projectName).trim(),
      description: (parsed.description || "").trim(),
      stages: parsed.stages.map((s: any) => ({
        name: String(s.name || "未命名阶段").trim(),
        checklist: Array.isArray(s.checklist)
          ? s.checklist.map((item: any) => String(item || "").trim()).filter(Boolean)
          : [],
      })).filter((s: StageData) => s.name && s.checklist.length > 0),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("文字转项目失败:", error);
    return NextResponse.json(
      { error: "识别失败，请稍后重试" },
      { status: 500 }
    );
  }
}
