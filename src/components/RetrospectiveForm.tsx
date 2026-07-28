"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ── 类型定义 ── */

export type RetroType = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

interface CompletedTask {
  id: string;
  title: string;
  projectName: string | null;
  completedAt: string | null;
  estimatedMinutes: number | null;
}

interface Props {
  type: RetroType;
  date: string;
  onSubmit?: (data: RetrospectiveData) => void;
}

export interface RetrospectiveData {
  type: RetroType;
  date: string;
  completedTasks: { taskId: string; title: string }[];
  energyLevel: number;
  focusLevel: number;
  satisfaction: number;
  tomorrowPriority: string;
  biggestWin: string;
  biggestChallenge: string;
  lessonLearned: string;
  skillUsed: string[];
  newInsight: string;
}

/* ── 周期配置 ── */

const PERIOD_CONFIG: Record<RetroType, { label: string; prompts: { win: string; challenge: string; lesson: string; priority: string } }> = {
  daily: {
    label: "今日",
    prompts: {
      win: "今天做的最棒的一件事是什么？",
      challenge: "今天遇到的最大困难是什么？",
      lesson: "今天学到了什么？有什么可以复用的？",
      priority: "明天最重要的一件事",
    },
  },
  weekly: {
    label: "本周",
    prompts: {
      win: "本周最大的成就是什么？",
      challenge: "本周遇到的最大挑战是什么？",
      lesson: "本周学到的最重要的经验是什么？",
      priority: "下周最优先事项",
    },
  },
  monthly: {
    label: "本月",
    prompts: {
      win: "本月最大的成就是什么？",
      challenge: "本月最大的挑战是什么？",
      lesson: "本月学到的最重要的经验是什么？",
      priority: "下月最优先事项",
    },
  },
  quarterly: {
    label: "本季度",
    prompts: {
      win: "本季度最大的成就是什么？",
      challenge: "本季度最大的挑战是什么？",
      lesson: "本季度学到的最重要的经验是什么？",
      priority: "下季度最优先事项",
    },
  },
  yearly: {
    label: "本年",
    prompts: {
      win: "今年最大的成就是什么？",
      challenge: "今年最大的挑战是什么？",
      lesson: "今年学到的最重要的经验是什么？",
      priority: "明年最优先事项",
    },
  },
};

const COMMON_SKILLS = ["编程", "沟通", "写作", "设计", "分析", "管理", "学习", "策划"];

/* ── RetrospectiveForm 组件 ── */

export function RetrospectiveForm({ type, date, onSubmit }: Props) {
  const config = PERIOD_CONFIG[type];

  const [energy, setEnergy] = useState(5);
  const [focus, setFocus] = useState(5);
  const [satisfaction, setSatisfaction] = useState(5);
  const [tomorrowPriority, setTomorrowPriority] = useState("");
  const [biggestWin, setBiggestWin] = useState("");
  const [biggestChallenge, setBiggestChallenge] = useState("");
  const [lessonLearned, setLessonLearned] = useState("");
  const [skillUsed, setSkillUsed] = useState<string[]>([]);
  const [newInsight, setNewInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    suggestions: string[];
    trend: string;
  } | null>(null);

  // 自动归档的任务列表
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // 加载周期内已完成任务
  useEffect(() => {
    async function loadCompletedTasks() {
      setTasksLoading(true);
      try {
        const res = await fetch("/api/career/retrospective/completed-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, date }),
        });
        if (res.ok) {
          const data = await res.json();
          setCompletedTasks(data.tasks || []);
        }
      } catch {
        // 静默失败
      } finally {
        setTasksLoading(false);
      }
    }
    loadCompletedTasks();
  }, [type, date]);

  function toggleSkill(skill: string) {
    setSkillUsed((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/career/retrospective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date,
          energyLevel: energy,
          focusLevel: focus,
          satisfaction,
          tomorrowPriority,
          biggestWin,
          biggestChallenge,
          lessonLearned,
          skillUsed,
          newInsight,
        }),
      });

      if (!res.ok) throw new Error("提交失败");

      const data = await res.json();
      setInsights(data.insights);
      onSubmit?.({
        type,
        date,
        completedTasks: data.completedTasks || [],
        energyLevel: energy,
        focusLevel: focus,
        satisfaction,
        tomorrowPriority,
        biggestWin,
        biggestChallenge,
        lessonLearned,
        skillUsed,
        newInsight,
      });
    } catch (e) {
      console.error("复盘提交失败:", e);
    } finally {
      setLoading(false);
    }
  }

  /* ── 提交成功页 ── */
  if (insights) {
    return (
      <div className="space-y-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}>
            ✓
          </div>
          <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{config.label}复盘已提交</p>
        </div>

        {completedTasks.length > 0 && (
          <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-root)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              已归档 {completedTasks.length} 个已完成任务
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {completedTasks.map((t) => (
                <div key={t.id} className="text-xs flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--text-muted)' }} />
                  <span className="truncate">{t.title}</span>
                  {t.projectName && (
                    <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>· {t.projectName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-root)' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>AI 洞察</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{insights.summary}</p>
        </div>

        {insights.suggestions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>改进建议</p>
            <div className="space-y-1.5">
              {insights.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{insights.trend}</p>
      </div>
    );
  }

  /* ── 表单 ── */
  return (
    <div className="space-y-6">
      {/* 自动归档的任务列表 */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          {config.label}已完成任务
          {tasksLoading ? "（加载中...）" : `（${completedTasks.length} 个）`}
        </p>
        {completedTasks.length === 0 && !tasksLoading ? (
          <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>暂无已完成任务</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg p-2" style={{ border: '1px solid var(--border-subtle)' }}>
            {completedTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[var(--bg-root)]">
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--color-success)] shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{t.title}</span>
                {t.projectName && (
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{t.projectName}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 状态评分 */}
      <div>
        <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>{config.label}状态（1-10）</p>
        <div className="space-y-4">
          <SliderRow label="精力水平" value={energy} onChange={setEnergy} />
          <SliderRow label="专注度" value={focus} onChange={setFocus} />
          <SliderRow label="满意度" value={satisfaction} onChange={setSatisfaction} />
        </div>
      </div>

      {/* 深度反思 */}
      <div className="space-y-3">
        <TextField label={`${config.label}最大成就`} placeholder={config.prompts.win}
          value={biggestWin} onChange={setBiggestWin} />
        <TextField label={`${config.label}最大挑战`} placeholder={config.prompts.challenge}
          value={biggestChallenge} onChange={setBiggestChallenge} />
        <TextField label="学到的经验" placeholder={config.prompts.lesson}
          value={lessonLearned} onChange={setLessonLearned} />
      </div>

      {/* 技能标签 */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{config.label}使用了哪些技能</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_SKILLS.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                backgroundColor: skillUsed.includes(skill) ? 'var(--accent)' : 'var(--bg-muted)',
                color: skillUsed.includes(skill) ? 'var(--text-inverse)' : 'var(--text-muted)',
              }}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      {/* 下周期优先 + 新知 */}
      <div className="space-y-3">
        <TextField label={config.prompts.priority} placeholder={config.prompts.priority}
          value={tomorrowPriority} onChange={setTomorrowPriority} />
        <TextField label="新的洞察" placeholder="任何想记录的新想法或感悟"
          value={newInsight} onChange={setNewInsight} />
      </div>

      {/* 提交 */}
      <Button onClick={handleSubmit} loading={loading} className="w-full">
        提交{config.label}复盘
      </Button>
    </div>
  );
}

/* ── 子组件 ── */

function SliderRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-14 sm:w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1.5 rounded-full appearance-none"
        style={{ backgroundColor: 'var(--bg-muted-hover)', accentColor: 'var(--accent)' }}
      />
      <span className="text-sm font-medium w-6 text-right" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
        style={{
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}
