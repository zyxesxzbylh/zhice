// AI 优先级引导系统
// 四维度提问 + 渐进式引导

import { callDeepSeek } from "@/lib/ai/deepseek";

export interface PriorityGuideContext {
  taskTitle: string;
  taskDescription?: string;
  userRole?: string;
  careerGoal?: string;
}

export interface PriorityDimension {
  name: string;
  question: string;
  options: string[];
}

export const PRIORITY_DIMENSIONS: PriorityDimension[] = [
  {
    name: "紧急程度",
    question: "这个任务是否有明确的截止日期或时间压力？",
    options: [
      "非常紧急 - 今天必须完成",
      "比较紧急 - 本周内需要完成",
      "一般 - 两周内完成即可",
      "不紧急 - 可以长期规划",
    ],
  },
  {
    name: "重要程度",
    question: "这个任务对你的核心目标或职业发展有多大影响？",
    options: [
      "极其重要 - 直接影响核心KPI或晋升",
      "很重要 - 对团队或项目有显著贡献",
      "一般重要 - 常规工作内容",
      "不太重要 - 可做可不做",
    ],
  },
  {
    name: "精力匹配",
    question: "完成这个任务需要多少精力？你当前状态如何？",
    options: [
      "高精力 - 需要深度专注，但我状态很好",
      "中等精力 - 需要一定专注，可以胜任",
      "低精力 - 简单重复性工作，适合疲惫时",
      "不确定 - 需要进一步拆解",
    ],
  },
  {
    name: "价值杠杆",
    question: "这个任务完成后，能产生多大的长期价值或复利效应？",
    options: [
      "高杠杆 - 一次投入，长期受益（如建立SOP、学习核心技能）",
      "中杠杆 - 对当前项目有明显推动",
      "低杠杆 - 单次收益，做完即止",
      "负杠杆 - 可能产生技术债或后续维护成本",
    ],
  },
];

export interface PriorityResult {
  score: number; // 0-100
  priority: "urgent" | "high" | "medium" | "low";
  reasoning: string;
  suggestedOrder: number;
  timeEstimate?: string;
  tips: string[];
}

/**
 * 根据用户四维度回答计算优先级
 */
export function calculatePriority(answers: number[]): PriorityResult {
  // 权重：紧急 30%，重要 35%，精力 15%，杠杆 20%
  const weights = [0.3, 0.35, 0.15, 0.2];

  // 答案映射到分数（0-3 → 100-0）
  const scores = answers.map((a) => Math.max(0, Math.min(3, a)));
  const weightedScore = scores.reduce((sum, s, i) => sum + s * weights[i] * 33.33, 0);

  const finalScore = Math.min(100, Math.round(weightedScore));

  let priority: PriorityResult["priority"];
  if (finalScore >= 75) priority = "urgent";
  else if (finalScore >= 50) priority = "high";
  else if (finalScore >= 25) priority = "medium";
  else priority = "low";

  const reasoning = generateReasoning(scores, answers);
  const tips = generateTips(scores, answers);

  return {
    score: finalScore,
    priority,
    reasoning,
    suggestedOrder: 0, // 由调用方根据多个任务排序填充
    timeEstimate: estimateTime(scores),
    tips,
  };
}

function generateReasoning(scores: number[], answers: number[]): string {
  const parts: string[] = [];

  if (scores[0] >= 2) parts.push("紧急程度高，需要尽快处理");
  if (scores[1] >= 2) parts.push("对核心目标影响大，属于高价值工作");
  if (scores[2] <= 1) parts.push("需要较高精力投入，建议安排在状态好的时段");
  if (scores[3] >= 2) parts.push("具有长期复利价值，值得优先投入");

  if (parts.length === 0) parts.push("常规任务，按正常节奏推进即可");

  return parts.join("；") + "。";
}

function generateTips(scores: number[], answers: number[]): string[] {
  const tips: string[] = [];

  if (scores[0] >= 2 && scores[1] <= 1) {
    tips.push("⚠️ 这个任务虽然紧急但重要性不高，考虑是否可以委派或简化处理");
  }

  if (scores[1] >= 2 && scores[0] <= 1) {
    tips.push("💡 重要但不紧急的任务最容易被拖延，建议主动安排固定时间块来处理");
  }

  if (scores[3] >= 2) {
    tips.push("🚀 高杠杆任务值得投入更多精力打磨，完成后记得沉淀为可复用的方法论");
  }

  if (scores[2] >= 2) {
    tips.push("😊 低精力任务适合放在状态一般的时间（如下午疲倦时）处理");
  }

  if (tips.length === 0) {
    tips.push("按常规流程推进，注意记录进度");
  }

  return tips;
}

function estimateTime(scores: number[]): string {
  if (scores[2] <= 1) return "建议安排 2-4 小时专注时间块";
  if (scores[2] === 2) return "预计 1-2 小时可完成";
  return "碎片时间即可处理，每次 15-30 分钟";
}

/**
 * AI 深度分析：基于四维度回答生成个性化建议
 */
export async function analyzePriorityWithAI(
  context: PriorityGuideContext,
  answers: number[]
): Promise<{
  analysis: string;
  actionPlan: string[];
  similarCases?: string;
}> {
  const dimensions = PRIORITY_DIMENSIONS.map((d, i) => ({
    dimension: d.name,
    question: d.question,
    answer: d.options[answers[i]] || "未选择",
  }));

  const prompt = `你是一位资深的职场效能顾问。请根据以下任务信息和用户的四维度评估，提供深度分析和行动建议。

任务信息：
- 标题：${context.taskTitle}
- 描述：${context.taskDescription || "无"}
- 用户角色：${context.userRole || "未指定"}
- 职业目标：${context.careerGoal || "未指定"}

四维度评估：
${dimensions.map((d) => `- ${d.dimension}：${d.answer}`).join("\n")}

请用中文回复，格式如下：
1. 深度分析（2-3句话，指出这个任务的真实优先级和潜在风险）
2. 行动建议（3-5条具体可执行的建议）
3. 类似案例（1个简短的职场场景类比，帮助用户理解）

注意：
- 语气要专业但亲切，像一位经验丰富的导师
- 结合用户的职业目标给出针对性建议
- 如果用户没有明确职业目标，给出通用的职场发展建议`;

  const response = await callDeepSeek(prompt, {
    temperature: 0.7,
    maxTokens: 800,
  });

  // 解析 AI 回复
  const lines = response.split("\n").filter((l) => l.trim());

  const analysis =
    lines.find((l) => l.includes("分析") || l.includes("优先级")) ||
    "基于你的评估，这个任务需要认真对待。";

  const actionPlan = lines
    .filter((l) => /^\d+\./.test(l) && !l.includes("分析") && !l.includes("案例"))
    .map((l) => l.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  const similarCases =
    lines.find((l) => l.includes("案例") || l.includes("类比")) || undefined;

  return {
    analysis: analysis.replace(/^\d+\.\s*/, "").trim(),
    actionPlan: actionPlan.length > 0 ? actionPlan : ["按优先级推进任务", "定期回顾进度"],
    similarCases,
  };
}
