"use client";

import { useState } from "react";
import { getTaskColor } from "@/lib/task-helpers";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: 1 | 2 | 3;
  dueDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  isDaily: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project: string | null;
  isSop: boolean;
  parentTaskId: string | null;
}

const PRIORITY_LABELS: Record<number, { label: string; className: string; style: React.CSSProperties }> = {
  1: { label: "紧急", className: "", style: { backgroundColor: 'var(--accent-muted)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' } },
  2: { label: "高", className: "", style: { backgroundColor: 'var(--accent-muted)', color: 'var(--color-warning)', borderColor: 'var(--color-warning)' } },
  3: { label: "普通", className: "", style: { backgroundColor: 'var(--bg-root)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)' } },
};

const STATUS_LABELS: Record<string, string> = {
  todo: "待开始",
  in_progress: "进行中",
  done: "已完成",
};

interface TaskListViewProps {
  filteredTasks: Task[];
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
}

export default function TaskListView({
  filteredTasks,
  childMap,
  onTaskClick,
}: TaskListViewProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const topLevelTasks = filteredTasks.filter(t => !t.parentTaskId);

  const renderTaskRow = (task: Task, depth: number = 0) => {
    const colors = getTaskColor(task);
    const children = childMap[task.id] || [];
    const isExpanded = expandedTasks.has(task.id);
    const priorityInfo = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS[3];

    return (
      <div key={task.id}>
        <div
          onClick={() => onTaskClick(task)}
          className={`flex items-center gap-3 px-4 py-2 border-b cursor-pointer transition-colors ${task.status === "done" ? "opacity-60" : ""}`}
          style={{ paddingLeft: `${16 + depth * 24}px`, borderColor: 'var(--border-subtle)' }}
        >
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors.bg }}></div>

          <div className="flex-1 min-w-0">
            <div className="text-sm truncate" style={{
              color: task.status === "done" ? 'var(--text-muted)' : 'var(--text-primary)',
              textDecoration: task.status === "done" ? 'line-through' : 'none',
            }}>
              {task.title}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {task.project && (
                <span className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{task.project}</span>
              )}
              {task.dueDate && (
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(task.dueDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded border shrink-0" style={priorityInfo.style}>
            {priorityInfo.label}
          </span>

          <span className="text-[11px] shrink-0 w-14 text-right" style={{ color: 'var(--text-muted)' }}>
            {STATUS_LABELS[task.status] || task.status}
          </span>

          {children.length > 0 && (
            <button onClick={(e) => toggleExpand(task.id, e)} className="p-0.5 rounded transition-colors shrink-0 hover:bg-[var(--bg-muted-hover)]">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        {isExpanded && children.map(child => renderTaskRow(child, depth + 1))}
      </div>
    );
  };

  if (topLevelTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <div className="text-center" style={{ color: 'var(--text-muted)' }}>
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto mb-3" style={{ color: 'var(--border-strong)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">暂无任务</p>
          <p className="text-xs mt-1">点击上方按钮创建新任务</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {topLevelTasks.map(task => renderTaskRow(task, 0))}
    </div>
  );
}
