"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { CareerRadar } from "@/components/CareerRadar";
import { cn } from "@/lib/utils";

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  metrics: {
    totalTasksCompleted: number;
    averageEnergy: number;
    averageFocus: number;
    averageSatisfaction: number;
    highValueTaskRatio: number;
    compoundTaskCount: number;
    streakDays: number;
  };
  valueDistribution: { type: string; count: number; percentage: number }[];
  skillGrowth: { skill: string; usageCount: number; trend: string; lastUsed: string }[];
  trends: { date: string; energy: number; focus: number; satisfaction: number; tasksCompleted: number }[];
  aiInsights: string[];
}

interface CareerPathData {
  careerPath: "expert" | "management" | null;
  reviewBaseDate: string | null;
}

interface AbilityScores {
  selfScores: number[];
  systemScores: number[];
}

const PERIODS = [
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "quarter", label: "本季度" },
] as const;

// 生成模拟的六维能力评分 (基于复盘数据和职业路线)
function deriveAbilityScores(
  data: DashboardData,
  careerPath: string | null
): AbilityScores | null {
  // 需要有一定数据量才有意义
  if (data.trends.length < 2 && data.metrics.totalTasksCompleted < 3) return null;

  const isExpert = careerPath === "expert";

  // 系统评估：基于实际数据计算
  const systemScores = [
    // 专业深度 - 基于技能使用频率和高价值任务
    Math.min(10, Math.round((data.skillGrowth.length * 1.5 + data.metrics.highValueTaskRatio / 10))),
    // 沟通表达 - 基于价值分布中的 relationship/visibility
    Math.min(10, Math.round(
      (data.valueDistribution
        .filter((v) => v.type === "relationship" || v.type === "visibility")
        .reduce((s, v) => s + v.percentage, 0) / 10) + 3
    )),
    // 执行力 - 基于完成任务数和趋势
    Math.min(10, Math.round(data.metrics.totalTasksCompleted * 0.7 + 3)),
    // 学习成长 - 基于技能成长趋势
    Math.min(10, Math.round(
      data.skillGrowth.filter((s) => s.trend === "up").length * 2 + 3
    )),
    // 创新思维 - 基于 valueDistribution 中的 innovation
    Math.min(10, Math.round(
      (data.valueDistribution.find((v) => v.type === "innovation")?.percentage || 0) / 10 + 3
    )),
    // 领导力潜质 - 管理路线加权，专家路线降低
    isExpert
      ? Math.min(10, Math.round(data.metrics.compoundTaskCount * 1.5 + 2))
      : Math.min(10, Math.round(
          data.metrics.totalTasksCompleted * 0.5 +
          data.valueDistribution.filter((v) => v.type === "strategic").reduce((s, v) => s + v.percentage, 0) / 10 + 3
        )),
  ];

  // 自评：在系统评估基础上略微浮动 (模拟用户自评)
  const selfScores = systemScores.map((s) => {
    const offset = Math.round((Math.random() - 0.3) * 3); // -1 ~ +2 的浮动
    return Math.max(1, Math.min(10, s + offset));
  });

  return { selfScores, systemScores };
}

// 生成每周成长摘要
function deriveWeeklySummary(data: DashboardData): string[] {
  const summaries: string[] = [];

  if (data.metrics.totalTasksCompleted > 0) {
    summaries.push(`本周完成了 ${data.metrics.totalTasksCompleted} 个任务`);
  }

  if (data.metrics.highValueTaskRatio > 0) {
    summaries.push(`高价值任务占比 ${data.metrics.highValueTaskRatio}%，${
      data.metrics.highValueTaskRatio >= 60 ? "表现优秀" :
      data.metrics.highValueTaskRatio >= 30 ? "保持良好" : "有待提升"
    }`);
  }

  if (data.metrics.compoundTaskCount > 0) {
    summaries.push(`完成了 ${data.metrics.compoundTaskCount} 个复利任务，持续积累长期价值`);
  }

  const upSkills = data.skillGrowth.filter((s) => s.trend === "up");
  if (upSkills.length > 0) {
    const names = upSkills.map((s) => s.skill).join("、");
    summaries.push(`技能「${names}」使用频率提升`);
  }

  if (data.metrics.streakDays >= 3) {
    summaries.push(`已连续复盘 ${data.metrics.streakDays} 天，复盘已成为习惯`);
  }

  if (data.metrics.averageSatisfaction >= 7) {
    summaries.push(`本周满意度 ${data.metrics.averageSatisfaction.toFixed(1)}，工作状态良好`);
  } else if (data.metrics.averageSatisfaction > 0 && data.metrics.averageSatisfaction < 5) {
    summaries.push(`本周满意度偏低，建议调整工作节奏`);
  }

  return summaries;
}

// 计算述职剩余天数
function calculateReviewDaysLeft(reviewBaseDate: string | null): number | null {
  if (!reviewBaseDate) return null;
  const target = new Date(reviewBaseDate);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// 计算进度百分比 (30天周期)
function calculateReviewProgress(daysLeft: number): number {
  return Math.min(100, Math.max(0, Math.round(((30 - daysLeft) / 30) * 100)));
}

export function GrowthDashboard() {
  const [period, setPeriod] = useState<string>("week");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [careerPathData, setCareerPathData] = useState<CareerPathData | null>(null);
  const [abilityScores, setAbilityScores] = useState<AbilityScores | null>(null);

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/career/dashboard?period=${p}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("获取仪表盘数据失败:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCareerPath = useCallback(async () => {
    try {
      const res = await fetch("/api/career/path");
      if (res.ok) {
        const json = await res.json();
        setCareerPathData(json);
      }
    } catch (e) {
      // 未选择路线或无网络，静默处理
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  useEffect(() => {
    fetchCareerPath();
  }, []);

  // 当数据加载完成后计算能力评分
  useEffect(() => {
    if (data) {
      const scores = deriveAbilityScores(data, careerPathData?.careerPath || null);
      setAbilityScores(scores);
    }
  }, [data, careerPathData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon="inbox"
        title="暂无成长数据"
        description="完成每日复盘后，这里将展示你的精力趋势、技能成长和价值分布。"
        action={
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            切换到「每日复盘」标签开始记录
          </span>
        }
      />
    );
  }

  const weeklySummary = deriveWeeklySummary(data);
  const daysLeft = calculateReviewDaysLeft(careerPathData?.reviewBaseDate || null);
  const reviewProgress = daysLeft != null ? calculateReviewProgress(daysLeft) : null;
  const isExpert = careerPathData?.careerPath === "expert";

  return (
    <div className="space-y-6">
      {/* 时间选择器 */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
              period === p.key
                ? "text-[var(--text-inverse)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-muted-hover)]"
            )}
            style={{
              backgroundColor: period === p.key ? 'var(--accent)' : 'var(--bg-muted)',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="完成任务"
          value={String(data.metrics.totalTasksCompleted)}
          subtitle="总任务数"
        />
        <MetricCard
          label="精力水平"
          value={data.metrics.averageEnergy.toFixed(1)}
          subtitle="/ 10"
        />
        <MetricCard
          label="专注度"
          value={data.metrics.averageFocus.toFixed(1)}
          subtitle="/ 10"
        />
        <MetricCard
          label="满意度"
          value={data.metrics.averageSatisfaction.toFixed(1)}
          subtitle="/ 10"
        />
      </div>

      {/* 第二行指标 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard
          label="高价值任务"
          value={`${data.metrics.highValueTaskRatio}%`}
          subtitle="占比"
        />
        <MetricCard
          label="复利任务"
          value={String(data.metrics.compoundTaskCount)}
          subtitle="已完成"
        />
        <MetricCard
          label="连续复盘"
          value={`${data.metrics.streakDays}天`}
          subtitle="连胜"
        />
      </div>

      {/* ---- 新增：述职进度条 ---- */}
      {careerPathData?.careerPath && daysLeft != null && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--color-expert-bg)] to-[var(--color-management-bg)] border border-[var(--color-expert-border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              距离30天述职还有 {daysLeft} 天
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isExpert ? "专家路线" : "管理路线"}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted-hover)' }}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                daysLeft > 20 ? "bg-[var(--color-success)]" : daysLeft > 10 ? "bg-[var(--color-warning)]" : "bg-[var(--color-danger)]"
              )}
              style={{ width: `${reviewProgress}%` }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {daysLeft > 0
              ? `已完成 ${reviewProgress}%，建议提前整理复盘数据和关键成果`
              : "述职日期已到，请及时完成述职报告"}
          </p>
        </div>
      )}

      {/* ---- 新增：本周成长摘要 ---- */}
      {weeklySummary.length > 0 && (
        <Card>
          <Card.Body>
            <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>本周成长摘要</h3>
            <div className="space-y-2">
              {weeklySummary.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* ---- 新增：能力雷达图 ---- */}
      {abilityScores && (
        <Card>
          <Card.Body>
            <CareerRadar
              expertMode={isExpert}
              selfScores={abilityScores.selfScores}
              systemScores={abilityScores.systemScores}
            />
          </Card.Body>
        </Card>
      )}

      {/* 趋势图 */}
      {data.trends.length > 0 && (
        <Card>
          <Card.Body>
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>趋势变化</h3>
            <TrendChart trends={data.trends} />
          </Card.Body>
        </Card>
      )}

      {/* 价值分布 */}
      {data.valueDistribution.length > 0 && (
        <Card>
          <Card.Body>
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>价值分布</h3>
            <div className="space-y-2">
              {data.valueDistribution.map((v) => (
                <div key={v.type} className="flex items-center gap-3">
                  <span className="text-xs w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{v.type}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${v.percentage}%`, backgroundColor: 'var(--accent)' }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right" style={{ color: 'var(--text-muted)' }}>{v.percentage}%</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* 技能成长 */}
      {data.skillGrowth.length > 0 && (
        <Card>
          <Card.Body>
            <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>技能使用</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.skillGrowth.map((s) => (
                <div key={s.skill} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-root)' }}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        s.trend === "up"
                          ? "bg-[var(--color-success)]"
                          : s.trend === "down"
                          ? "bg-[var(--color-danger)]"
                          : "bg-[var(--text-muted)]"
                      )}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.skill}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.usageCount}次</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* AI 洞察 */}
      {data.aiInsights.length > 0 && (
        <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'var(--color-info-bg)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--color-info-text)' }}>成长洞察</p>
          {data.aiInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-info-text)' }}>
              <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-info)' }} />
              {insight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
    </div>
  );
}

function TrendChart({
  trends,
}: {
  trends: { date: string; energy: number; focus: number; satisfaction: number; tasksCompleted: number }[];
}) {
  const maxVal = 10;

  return (
    <div className="flex items-end gap-1 h-24">
      {trends.map((t) => {
        const energyH = (t.energy / maxVal) * 100;
        const focusH = (t.focus / maxVal) * 100;
        const satH = (t.satisfaction / maxVal) * 100;
        return (
          <div key={t.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            <div className="flex items-end gap-0.5 h-16 w-full justify-center">
              <div
                className="w-1.5 rounded-t opacity-80"
                style={{ height: `${energyH}%`, backgroundColor: 'var(--accent)' }}
                title={`精力: ${t.energy}`}
              />
              <div
                className="w-1.5 rounded-t opacity-70"
                style={{ height: `${focusH}%`, backgroundColor: 'var(--text-muted)' }}
                title={`专注: ${t.focus}`}
              />
              <div
                className="w-1.5 rounded-t"
                style={{ height: `${satH}%`, backgroundColor: 'var(--border-subtle)' }}
                title={`满意度: ${t.satisfaction}`}
              />
            </div>
            <span className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {t.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
