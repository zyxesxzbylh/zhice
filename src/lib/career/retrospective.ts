// 每日复盘系统
// 结构化复盘模板 + AI 洞察生成

import { callDeepSeek } from "@/lib/ai/deepseek";

export interface DailyRetrospective {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD

  // 今日完成
  completedTasks: CompletedTask[];

  // 四维度复盘
  energyLevel: number; // 1-10
  focusLevel: number; // 1-10
  satisfaction: number; // 1-10
  tomorrowPriority: string;

  // 深度反思
  biggestWin: string;
  biggestChallenge: string;
  lessonLearned: string;

  // 成长追踪
  skillUsed: string[];
  newInsight: string;

  // AI 生成
  aiSummary?: string;
  aiSuggestions?: string[];
  trendAnalysis?: string;

  createdAt: Date;
}

export interface CompletedTask {
  taskId: string;
  title: string;
  valueType: string;
  completedAt: Date;
}

export const RETROSPECTIVE_PROMPT = `你是一位职场成长教练。请根据用户的今日复盘数据，生成：

1. 今日总结（1-2句话，肯定成就，指出亮点）
2. 改进建议（2-3条具体可行的建议）
3. 成长趋势（基于历史数据的简短分析）

注意：
- 语气要鼓励但诚实
- 建议要具体，避免空泛
- 关注长期成长，而非仅当日表现`;

/**
 * 生成每日复盘 AI 洞察
 */
export async function generateRetrospectiveInsights(
  retrospective: Partial<DailyRetrospective>,
  history: DailyRetrospective[]
): Promise<{
  summary: string;
  suggestions: string[];
  trend: string;
}> {
  const prompt = `${RETROSPECTIVE_PROMPT}

今日数据：
- 完成任务数：${retrospective.completedTasks?.length || 0}
- 精力水平：${retrospective.energyLevel}/10
- 专注度：${retrospective.focusLevel}/10
- 满意度：${retrospective.satisfaction}/10
- 最大成就：${retrospective.biggestWin || "无"}
- 最大挑战：${retrospective.biggestChallenge || "无"}
- 学到的经验：${retrospective.lessonLearned || "无"}
- 明日优先：${retrospective.tomorrowPriority || "无"}

历史趋势（最近7天）：
- 平均精力：${calculateAverage(history, "energyLevel")}
- 平均专注：${calculateAverage(history, "focusLevel")}
- 平均满意度：${calculateAverage(history, "satisfaction")}

请用中文回复。`;

  const response = await callDeepSeek(prompt, {
    temperature: 0.7,
    maxTokens: 600,
  });

  // 解析 AI 回复
  const lines = response.split("\n").filter((l) => l.trim());

  const summary =
    lines.find((l) => l.includes("总结") || l.includes("成就")) ||
    "今日表现不错，继续保持！";

  const suggestions = lines
    .filter((l) => l.includes("建议") || l.match(/^\d+\./))
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const trend =
    lines.find((l) => l.includes("趋势") || l.includes("分析")) ||
    "整体趋势平稳。";

  return {
    summary: summary.replace(/^\d+\.\s*/, "").trim(),
    suggestions: suggestions.length > 0 ? suggestions : ["保持当前节奏", "关注精力管理"],
    trend: trend.replace(/^\d+\.\s*/, "").trim(),
  };
}

function calculateAverage(history: DailyRetrospective[], field: keyof DailyRetrospective): string {
  if (history.length === 0) return "无数据";

  const values = history
    .map((h) => h[field])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) return "无数据";

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg.toFixed(1);
}

/**
 * 生成周复盘
 */
export async function generateWeeklyRetrospective(
  weekData: DailyRetrospective[]
): Promise<{
  theme: string;
  achievements: string[];
  improvements: string[];
  nextWeekFocus: string;
}> {
  const prompt = `请根据用户一周的复盘数据，生成周复盘报告。

一周数据概览：
- 总完成任务：${weekData.reduce((sum, d) => sum + (d.completedTasks?.length || 0), 0)}
- 平均精力：${calculateAverage(weekData, "energyLevel")}
- 平均专注：${calculateAverage(weekData, "focusLevel")}
- 平均满意度：${calculateAverage(weekData, "satisfaction")}

每日亮点：
${weekData.map((d) => `- ${d.date}: ${d.biggestWin || "无"}`).join("\n")}

请生成：
1. 本周主题（1句话概括本周核心特征）
2. 主要成就（3条）
3. 待改进（2条）
4. 下周重点（1句话）

用中文回复。`;

  const response = await callDeepSeek(prompt, {
    temperature: 0.7,
    maxTokens: 500,
  });

  const lines = response.split("\n").filter((l) => l.trim());

  return {
    theme: lines[0] || "本周平稳推进",
    achievements: lines.filter((l) => l.includes("成就") || l.match(/^\d+\./)).slice(0, 3),
    improvements: lines.filter((l) => l.includes("改进") || l.includes("不足")).slice(0, 2),
    nextWeekFocus: lines.find((l) => l.includes("下周") || l.includes("重点")) || "继续保持",
  };
}
