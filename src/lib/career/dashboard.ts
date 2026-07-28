// 成长仪表盘
// 可视化用户的职场成长轨迹

import { type DailyRetrospective } from "./retrospective";
import { type ValueDrivenTask } from "./value-driven";

export interface GrowthDashboard {
  // 时间范围
  period: "week" | "month" | "quarter";
  startDate: string;
  endDate: string;

  // 核心指标
  metrics: GrowthMetrics;

  // 价值分布
  valueDistribution: ValueDistribution[];

  // 技能成长
  skillGrowth: SkillGrowth[];

  // 趋势数据
  trends: TrendData[];

  // AI 洞察
  aiInsights: string[];
}

export interface GrowthMetrics {
  totalTasksCompleted: number;
  averageEnergy: number;
  averageFocus: number;
  averageSatisfaction: number;
  highValueTaskRatio: number; // 高价值任务占比
  compoundTaskCount: number;
  streakDays: number; // 连续复盘天数
}

export interface ValueDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface SkillGrowth {
  skill: string;
  usageCount: number;
  trend: "up" | "stable" | "down";
  lastUsed: string;
}

export interface TrendData {
  date: string;
  energy: number;
  focus: number;
  satisfaction: number;
  tasksCompleted: number;
}

/**
 * 生成成长仪表盘数据
 */
export function generateDashboard(
  retrospectives: DailyRetrospective[],
  tasks: ValueDrivenTask[],
  period: "week" | "month" | "quarter"
): GrowthDashboard {
  // 按时间筛选
  const now = new Date();
  const startDate = new Date(now);

  if (period === "week") startDate.setDate(now.getDate() - 7);
  else if (period === "month") startDate.setMonth(now.getMonth() - 1);
  else startDate.setMonth(now.getMonth() - 3);

  const periodRetrospectives = retrospectives.filter(
    (r) => new Date(r.date) >= startDate
  );

  const periodTasks = tasks.filter((t) => t.createdAt >= startDate);

  // 计算核心指标
  const metrics: GrowthMetrics = {
    totalTasksCompleted: periodRetrospectives.reduce(
      (sum, r) => sum + (r.completedTasks?.length || 0),
      0
    ),
    averageEnergy: calculateMetricAverage(periodRetrospectives, "energyLevel"),
    averageFocus: calculateMetricAverage(periodRetrospectives, "focusLevel"),
    averageSatisfaction: calculateMetricAverage(periodRetrospectives, "satisfaction"),
    highValueTaskRatio: calculateHighValueRatio(periodTasks),
    compoundTaskCount: periodTasks.filter((t) => t.isCompoundInterest).length,
    streakDays: calculateStreak(retrospectives),
  };

  // 价值分布
  const valueDistribution = calculateValueDistribution(periodTasks);

  // 技能成长
  const skillGrowth = calculateSkillGrowth(periodRetrospectives);

  // 趋势数据
  const trends = periodRetrospectives.map((r) => ({
    date: r.date,
    energy: r.energyLevel,
    focus: r.focusLevel,
    satisfaction: r.satisfaction,
    tasksCompleted: r.completedTasks?.length || 0,
  }));

  // 生成洞察
  const aiInsights = generateInsights(metrics, valueDistribution, skillGrowth);

  return {
    period,
    startDate: startDate.toISOString().split("T")[0],
    endDate: now.toISOString().split("T")[0],
    metrics,
    valueDistribution,
    skillGrowth,
    trends,
    aiInsights,
  };
}

function calculateMetricAverage(
  data: DailyRetrospective[],
  field: keyof DailyRetrospective
): number {
  const values = data
    .map((d) => d[field])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function calculateHighValueRatio(tasks: ValueDrivenTask[]): number {
  if (tasks.length === 0) return 0;
  const highValue = tasks.filter((t) => t.valueScore >= 7);
  return Math.round((highValue.length / tasks.length) * 100);
}

function calculateValueDistribution(tasks: ValueDrivenTask[]): ValueDistribution[] {
  const counts = new Map<string, number>();

  tasks.forEach((t) => {
    counts.set(t.valueType, (counts.get(t.valueType) || 0) + 1);
  });

  const total = tasks.length;

  return Array.from(counts.entries()).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

function calculateSkillGrowth(retrospectives: DailyRetrospective[]): SkillGrowth[] {
  const skillMap = new Map<
    string,
    { count: number; lastUsed: string }
  >();

  retrospectives.forEach((r) => {
    r.skillUsed?.forEach((skill) => {
      const existing = skillMap.get(skill);
      if (existing) {
        existing.count += 1;
        if (r.date > existing.lastUsed) existing.lastUsed = r.date;
      } else {
        skillMap.set(skill, { count: 1, lastUsed: r.date });
      }
    });
  });

  return Array.from(skillMap.entries()).map(([skill, data]) => ({
    skill,
    usageCount: data.count,
    trend: data.count >= 3 ? "up" : data.count >= 1 ? "stable" : "down",
    lastUsed: data.lastUsed,
  }));
}

function calculateStreak(retrospectives: DailyRetrospective[]): number {
  if (retrospectives.length === 0) return 0;

  const dates = retrospectives
    .map((r) => r.date)
    .sort()
    .reverse();

  let streak = 1;
  const today = new Date().toISOString().split("T")[0];

  // 如果今天没有复盘，从昨天开始算
  let currentDate = dates[0] === today ? new Date() : new Date(dates[0]);

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);

    if (dates[i] === prevDate.toISOString().split("T")[0]) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

function generateInsights(
  metrics: GrowthMetrics,
  _valueDistribution: ValueDistribution[],
  skillGrowth: SkillGrowth[]
): string[] {
  const insights: string[] = [];

  // 仅在有真实复盘数据时才生成洞察
  const hasData = metrics.totalTasksCompleted > 0 || metrics.streakDays > 0;

  if (!hasData) return insights;

  // 基于实际数据量的洞察（不预设固定文本）
  if (metrics.totalTasksCompleted > 0) {
    insights.push(`本期共完成 ${metrics.totalTasksCompleted} 个任务`);
  }

  if (metrics.streakDays >= 3) {
    insights.push(`已连续复盘 ${metrics.streakDays} 天`);
  }

  // 技能使用统计
  const usedSkills = skillGrowth.filter((s) => s.usageCount > 0);
  if (usedSkills.length > 0) {
    const topSkills = usedSkills
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 3)
      .map((s) => s.skill)
      .join("、");
    insights.push(`高频技能：${topSkills}`);
  }

  // 价值分配摘要
  if (metrics.highValueTaskRatio > 0) {
    insights.push(`高价值任务占比 ${metrics.highValueTaskRatio}%`);
  }

  return insights;
}
