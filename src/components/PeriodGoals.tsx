"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface PushedGoal {
  id: string;
  goal: string;
  reason?: string;
  source: "ai" | "custom";
  period: "tomorrow" | "week" | "month" | "year";
  pushedAt: number;
}

const PERIODS = [
  { key: "all", label: "全部" },
  { key: "tomorrow", label: "明日" },
  { key: "week", label: "本周" },
  { key: "month", label: "本月" },
  { key: "year", label: "本年" },
] as const;

type PeriodFilter = (typeof PERIODS)[number]["key"];

const PERIOD_LABELS: Record<string, string> = {
  tomorrow: "明日",
  week: "本周",
  month: "本月",
  year: "本年",
};

export function PeriodGoals() {
  const [goals, setGoals] = useState<PushedGoal[]>([]);
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>("all");
  const [loading, setLoading] = useState(true);
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalPeriod, setNewGoalPeriod] = useState<string>("week");
  const [analyzing, setAnalyzing] = useState(false);

  const loadGoals = useCallback(() => {
    try {
      const raw = localStorage.getItem("flowsync_pushed_goals");
      if (raw) {
        setGoals(JSON.parse(raw));
      } else {
        setGoals([]);
      }
    } catch {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
    window.addEventListener("pushed-goals-updated", loadGoals);
    return () => window.removeEventListener("pushed-goals-updated", loadGoals);
  }, [loadGoals]);

  const filteredGoals = activePeriod === "all"
    ? goals
    : goals.filter((g) => g.period === activePeriod);

  // 按时段分组（全部模式下）
  const groupedByPeriod = activePeriod === "all"
    ? (() => {
        const map: Record<string, PushedGoal[]> = {};
        for (const g of goals) {
          const key = g.period || "week";
          if (!map[key]) map[key] = [];
          map[key].push(g);
        }
        return map;
      })()
    : null;

  const periodOrder = ["tomorrow", "week", "month", "year"];

  function removeGoal(id: string) {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem("flowsync_pushed_goals", JSON.stringify(updated));
    window.dispatchEvent(new Event("pushed-goals-updated"));
  }

  async function addGoal() {
    const trimmed = newGoalText.trim();
    if (!trimmed || analyzing) return;
    setAnalyzing(true);
    let reason = "";
    try {
      const res = await fetch("/api/ai/analyze-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        reason = data.reason || "";
      }
    } catch {
      // AI 分析失败，静默继续
    }
    const newGoal: PushedGoal = {
      id: `manual-${Date.now()}`,
      goal: trimmed,
      reason,
      source: "custom",
      period: newGoalPeriod as PushedGoal["period"],
      pushedAt: Date.now(),
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem("flowsync_pushed_goals", JSON.stringify(updated));
    setNewGoalText("");
    setAnalyzing(false);
    window.dispatchEvent(new Event("pushed-goals-updated"));
  }

  const periodCounts: Record<string, number> = {};
  for (const g of goals) {
    periodCounts[g.period] = (periodCounts[g.period] || 0) + 1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-5 w-5 border-2 rounded-full"
          style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* 时段筛选标签 */}
      <div className="flex gap-1 rounded-xl p-1 overflow-x-auto" style={{ backgroundColor: 'var(--bg-muted)' }}>
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePeriod(p.key)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap px-2",
              activePeriod === p.key
                ? "shadow-sm"
                : "hover:bg-[var(--bg-muted-hover)]"
            )}
            style={{
              backgroundColor: activePeriod === p.key ? 'var(--bg-surface)' : undefined,
              color: activePeriod === p.key ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {p.label}
            {p.key !== "all" && periodCounts[p.key] ? (
              <span className="ml-1 text-[10px] opacity-50">{periodCounts[p.key]}</span>
            ) : p.key === "all" ? (
              <span className="ml-1 text-[10px] opacity-50">{goals.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* 添加目标 */}
      <div className="flex gap-2">
        <select
          value={newGoalPeriod}
          onChange={(e) => setNewGoalPeriod(e.target.value)}
          className="flex-shrink-0 text-sm rounded-lg px-3 py-2 cursor-pointer focus:outline-none appearance-none"
          style={{
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
          }}
        >
          <option value="tomorrow">明日</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="year">本年</option>
        </select>
        <input
          type="text"
          value={newGoalText}
          onChange={(e) => setNewGoalText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }}
          placeholder="输入下阶段目标..."
          className="flex-1 px-3 py-2 rounded-lg text-sm transition-colors focus:outline-none"
          style={{
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        />
        <button
          onClick={addGoal}
          disabled={!newGoalText.trim() || analyzing}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-inverse)',
          }}
        >
          {analyzing ? "分析中..." : "添加"}
        </button>
      </div>

      {/* 目标列表 */}
      {goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--text-muted)]">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>暂无下阶段目标</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>从成长仪表盘推送目标，或直接在此添加</p>
        </div>
      ) : activePeriod === "all" ? (
        /* 全部模式：按时段分组展示 */
        <div className="space-y-6">
          {periodOrder.map((period) => {
            const items = groupedByPeriod?.[period];
            if (!items || items.length === 0) return null;
            return (
              <div key={period}>
                <h3 className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  {PERIOD_LABELS[period]}
                  <span className="w-px h-3" style={{ backgroundColor: 'var(--bg-muted-hover)' }} />
                  <span className="font-normal">{items.length} 个目标</span>
                </h3>
                <div className="space-y-2">
                  {items.map((g, i) => (
                    <GoalItem key={g.id} goal={g} index={i + 1} onRemove={removeGoal} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 单时段筛选模式 */
        <div className="space-y-2">
          {filteredGoals.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              暂无{PERIOD_LABELS[activePeriod]}的目标，在上方添加或从成长仪表盘推送
            </p>
          ) : (
            filteredGoals.map((g, i) => (
              <GoalItem key={g.id} goal={g} index={i + 1} onRemove={removeGoal} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function GoalItem({
  goal,
  index,
  onRemove,
}: {
  goal: PushedGoal;
  index: number;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg transition-colors group"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <span className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center mt-0.5"
        style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}>
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{goal.goal}</p>
        {goal.reason && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{goal.reason}</p>
        )}
      </div>
      <span className={cn(
        "flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded",
        goal.source === "ai" ? "text-[var(--color-info)]" : ""
      )}
      style={goal.source !== "ai" ? { backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' } : undefined}>
        {goal.source === "ai" ? "AI推荐" : "自定义"}
      </span>
      <button
        onClick={() => onRemove(goal.id)}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-colors"
        style={{ color: 'var(--text-muted)' }}
        title="删除"
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
