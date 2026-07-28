"use client";

import { useMemo } from "react";

interface TaskChartProps {
  tasks: {
    status: string;
    priority: string;
    dueDate?: Date | null;
    completedAt?: Date | null;
  }[];
  type: "status" | "priority" | "weekly" | "completion";
  className?: string;
}

// 状态分布饼图
function StatusChart({ tasks }: { tasks: TaskChartProps["tasks"] }) {
  const data = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach((t) => {
      if (counts[t.status as keyof typeof counts] !== undefined) {
        counts[t.status as keyof typeof counts]++;
      }
    });
    const total = tasks.length || 1;
    return [
      { label: "待开始", value: counts.todo, color: "var(--text-secondary)", percent: (counts.todo / total) * 100 },
      { label: "进行中", value: counts.in_progress, color: "var(--color-info)", percent: (counts.in_progress / total) * 100 },
      { label: "已完成", value: counts.done, color: "var(--color-success)", percent: (counts.done / total) * 100 },
    ];
  }, [tasks]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        {data.map((item, i) => {
          if (item.value === 0) return null;
          const angle = (item.value / total) * 360;
          const x1 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
          const y1 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
          const x2 = 50 + 40 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
          const y2 = 50 + 40 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
          const largeArc = angle > 180 ? 1 : 0;
          currentAngle += angle;
          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="var(--bg-surface)" />
      </svg>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({item.percent.toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 优先级分布条形图
function PriorityChart({ tasks }: { tasks: TaskChartProps["tasks"] }) {
  const data = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0, urgent: 0 };
    tasks.forEach((t) => {
      if (counts[t.priority as keyof typeof counts] !== undefined) {
        counts[t.priority as keyof typeof counts]++;
      }
    });
    const max = Math.max(...Object.values(counts)) || 1;
    return [
      { label: "低", value: counts.low, color: "var(--color-success)", max },
      { label: "中", value: counts.medium, color: "var(--color-info)", max },
      { label: "高", value: counts.high, color: "var(--color-warning)", max },
      { label: "紧急", value: counts.urgent, color: "var(--color-danger)", max },
    ];
  }, [tasks]);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-10 text-sm text-right" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
          <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(item.value / item.max) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
          <span className="w-8 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// 周完成趋势图
function WeeklyChart({ tasks }: { tasks: TaskChartProps["tasks"] }) {
  const data = useMemo(() => {
    const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    const counts = new Array(7).fill(0);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    tasks.forEach((t) => {
      if (t.completedAt) {
        const completed = new Date(t.completedAt);
        const diffDays = Math.floor((completed.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          counts[diffDays]++;
        }
      }
    });

    const max = Math.max(...counts) || 1;
    return days.map((day, i) => ({ day, value: counts[i], max }));
  }, [tasks]);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full rounded-t-lg overflow-hidden relative" style={{ height: "80px", backgroundColor: 'var(--bg-muted)' }}>
            <div
              className="absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ease-out"
              style={{ height: `${(item.value / item.max) * 80}px`, backgroundColor: 'var(--accent)' }}
            />
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.day}</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// 完成率环形图
function CompletionChart({ tasks }: { tasks: TaskChartProps["tasks"] }) {
  const { completed, total, rate } = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "done").length;
    const total = tasks.length || 1;
    return { completed, total, rate: (completed / total) * 100 };
  }, [tasks]);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-muted)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{rate.toFixed(0)}%</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>完成率</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          已完成: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{completed}</span>
        </div>
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          总任务: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{tasks.length}</span>
        </div>
      </div>
    </div>
  );
}

export default function TaskChart({ tasks, type, className = "" }: TaskChartProps) {
  return (
    <div className={`rounded-xl border p-4 ${className}`}
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
      {type === "status" && <StatusChart tasks={tasks} />}
      {type === "priority" && <PriorityChart tasks={tasks} />}
      {type === "weekly" && <WeeklyChart tasks={tasks} />}
      {type === "completion" && <CompletionChart tasks={tasks} />}
    </div>
  );
}
