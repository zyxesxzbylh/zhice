import { NextResponse } from "next/server";
import { eq, desc, or, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, knowledgeEntries, projects } from "@/db/schema";
import { callDeepSeek } from "@/lib/ai/deepseek";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { customGoals, period } = await request.json();

    // 1. 获取已完成任务 (最近 14 天)
    const allTasks = await db
      .select({
        task: tasks,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, session.userId))
      .orderBy(desc(tasks.createdAt))
      .limit(100);

    const doneTasks = allTasks.filter((r) => r.task.status === "done");
    const undoneTasks = allTasks.filter((r) => r.task.status !== "done" && r.task.status !== "archived");

    // 2. 获取知识库条目
    const knowledge = await db
      .select({
        id: knowledgeEntries.id,
        title: knowledgeEntries.title,
        summary: knowledgeEntries.summary,
        category: knowledgeEntries.category,
      })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.userId, session.userId))
      .orderBy(desc(knowledgeEntries.createdAt))
      .limit(20);

    // 3. 构建 AI 上下文
    const context = {
      completedTasks: doneTasks.slice(0, 10).map((r) => ({
        title: r.task.title,
        priority: r.task.priority,
        project: r.projectName,
        valueType: r.task.valueType,
      })),
      incompleteTasks: undoneTasks.slice(0, 10).map((r) => ({
        title: r.task.title,
        priority: r.task.priority,
        project: r.projectName,
        status: r.task.status,
      })),
      knowledgeTopics: knowledge.map((k) => ({
        title: k.title,
        summary: k.summary?.slice(0, 100),
        category: k.category,
      })),
      customGoals: customGoals || [],
    };

    // 统计摘要
    const doneCount = context.completedTasks.length;
    const undoneCount = context.incompleteTasks.length;
    const highPUndone = context.incompleteTasks.filter((t) => t.priority === "high").length;
    const knowledgeCount = context.knowledgeTopics.length;

    // 4. 调用 AI 生成目标推荐
    const prompt = `你是一位专业的职场成长教练。请根据以下用户数据，生成 3-4 条下阶段发展目标建议。

## 用户完成的任务（${doneCount} 个）
${context.completedTasks.map((t, i) => `${i + 1}. [${t.priority}] ${t.title} (${t.project || "无项目"}, 价值类型: ${t.valueType || "未标注"})`).join("\n")}

## 用户未完成的任务（${undoneCount} 个，其中高优先级 ${highPUndone} 个）
${context.incompleteTasks.map((t, i) => `${i + 1}. [${t.priority}/${t.status}] ${t.title}`).join("\n")}

## 用户知识库主题（${knowledgeCount} 条）
${context.knowledgeTopics.map((k, i) => `${i + 1}. [${k.category}] ${k.title}${k.summary ? ": " + k.summary : ""}`).join("\n")}

${context.customGoals.length > 0 ? `## 用户自定义目标\n${context.customGoals.map((g: string, i: number) => `${i + 1}. ${g}`).join("\n")}\n` : ""}

请直接返回 JSON 数组格式，不要包含任何其他内容：
[
  {"goal": "具体可执行的目标描述", "reason": "基于什么数据给出的这个建议", "category": "task|skill|knowledge|habit"},
  ...
]

要求：
- 目标要具体、可执行、有时间维度
- 综合考虑已完成任务的成果、未完成任务的压力、知识库的学习方向
- 如果用户有自定义目标，应基于这些目标给出执行路径建议
- category: task=任务相关, skill=技能提升, knowledge=知识学习, habit=习惯养成`;

    let aiGoals: { goal: string; reason: string; category: string }[] = [];

    try {
      const aiResponse = await callDeepSeek(prompt, {
        temperature: 0.7,
        maxTokens: 800,
        systemPrompt: "你是一位专业的职场成长教练，擅长基于数据给出个性化的成长建议。只返回有效的 JSON 数组。",
      });

      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiGoals = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("AI 成长目标生成失败，使用默认推荐:", e);
    }

    // 如果 AI 失败，生成基础目标
    if (aiGoals.length === 0) {
      aiGoals = generateFallbackGoals(context);
    }

    // 5. 结构化成前端可用格式
    return NextResponse.json({
      aiGoals: aiGoals.map((g, i) => ({
        id: `ai-${i}`,
        goal: g.goal,
        reason: g.reason,
        category: g.category || "task",
        source: "ai",
      })),
      customGoals: context.customGoals.map((g: string, i: number) => ({
        id: `custom-${i}`,
        goal: g,
        reason: "用户自定义",
        category: "custom",
        source: "custom",
      })),
      stats: {
        completedTasks: doneCount,
        incompleteTasks: undoneCount,
        knowledgeEntries: knowledgeCount,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("AI 成长目标生成失败:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}

function generateFallbackGoals(context: any) {
  const goals: { goal: string; reason: string; category: string }[] = [];

  if (context.incompleteTasks?.length > 0) {
    const highP = context.incompleteTasks.filter((t: any) => t.priority === "high");
    if (highP.length > 0) {
      goals.push({
        goal: `优先完成 ${highP.length} 个高优先级遗留任务`,
        reason: `当前有 ${highP.length} 个高优先级任务未完成`,
        category: "task",
      });
    }
  }

  if (context.completedTasks?.length > 5) {
    goals.push({
      goal: "整理本周完成的关键任务经验，沉淀到知识库",
      reason: `本周完成了 ${context.completedTasks.length} 个任务，值得复盘总结`,
      category: "knowledge",
    });
  }

  if (context.knowledgeTopics?.length > 0) {
    const latest = context.knowledgeTopics[0];
    goals.push({
      goal: `深入学习「${latest.title}」相关领域知识`,
      reason: `知识库最新条目为「${latest.title}」，可继续拓展`,
      category: "knowledge",
    });
  }

  goals.push({
    goal: "尝试每天安排 30 分钟深度工作时间",
    reason: "深度工作时间是提升产出的关键习惯",
    category: "habit",
  });

  return goals;
}
