"use client";

import { useState } from "react";
import { getTaskColor, getDateKey } from "@/lib/task-helpers";

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

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  todo: { bg: "var(--text-muted)", border: "var(--border-default)" },
  in_progress: { bg: "var(--color-info)", border: "var(--color-info-border)" },
  done: { bg: "var(--color-success)", border: "var(--color-success-border)" },
};

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 60; // px per hour

function timeToMinutes(t: string | null): number {
  if (!t) return -1;
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function getStatusStyle(task: Task) {
  const statusColor = STATUS_COLORS[task.status as keyof typeof STATUS_COLORS];
  switch (task.status) {
    case "done":
      return {
        backgroundColor: statusColor.bg,
        borderColor: statusColor.border,
        opacity: 0.75,
      };
    case "in_progress":
      return {
        backgroundColor: statusColor.bg,
        borderColor: statusColor.border,
        boxShadow: `0 0 0 2px ${statusColor.bg}30, 0 1px 3px ${statusColor.bg}20`,
      };
    default:
      return {
        backgroundColor: statusColor.bg,
        borderColor: statusColor.border,
      };
  }
}

interface TaskDayViewProps {
  days: Date[];
  tasksByDate: Record<string, Task[]>;
  filteredTasks: Task[];
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
}

export default function TaskDayView({
  days,
  tasksByDate,
  filteredTasks,
  childMap,
  onTaskClick,
}: TaskDayViewProps) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const day = days[0];
  const dayTasks = tasksByDate[getDateKey(day)] || [];
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const tasksWithDueDate = dayTasks.filter(t => t.dueDate && !t.parentTaskId);
  const tasksWithoutDueDate = filteredTasks.filter(t => !t.dueDate && !t.parentTaskId);

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // 计算每个任务的垂直位置和高度（基于 startTime 到 endTime）
  const computeTaskPosition = (task: Task) => {
    const startMin = timeToMinutes(task.startTime);
    const endMin = timeToMinutes(task.endTime);

    if (startMin >= 0 && endMin > startMin) {
      const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
      const height = ((endMin - startMin) / 60) * HOUR_HEIGHT;
      return { top, height, spanHours: Math.ceil((endMin - startMin) / 60) };
    }

    // Fallback: use dueDate hour, 1 hour span
    if (task.dueDate) {
      const h = new Date(task.dueDate).getHours();
      if (h >= START_HOUR && h < END_HOUR) {
        const top = ((h - START_HOUR * 60) / 60) * HOUR_HEIGHT;
        return { top, height: HOUR_HEIGHT, spanHours: 1 };
      }
    }

    return null;
  };

  // Group tasks by their overlapping positions to handle side-by-side display
  const positionedTasks = tasksWithDueDate
    .map(task => ({ task, pos: computeTaskPosition(task) }))
    .filter((p): p is { task: Task; pos: NonNullable<ReturnType<typeof computeTaskPosition>> } => p.pos !== null);

  const [showUndatedTasks, setShowUndatedTasks] = useState(true);

  return (
    <div className="flex-1 overflow-auto flex flex-col" style={{ backgroundColor: 'var(--bg-root)' }}>
      {/* 未排期任务 */}
      {tasksWithoutDueDate.length > 0 && (
        <div className="border-b shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <button
            onClick={() => setShowUndatedTasks(!showUndatedTasks)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg-root)]"
          >
            <h3 className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              未设置截止时间 ({tasksWithoutDueDate.length})
            </h3>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              className={`transition-transform ${showUndatedTasks ? "rotate-180" : ""}`}
              style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          {showUndatedTasks && (
            <div className="px-4 pb-4">
              <div className="flex flex-wrap gap-2">
                {tasksWithoutDueDate.map(task => {
                  const colors = getTaskColor(task);
                  const children = childMap[task.id] || [];
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div key={task.id} className="relative">
                      <div onClick={() => onTaskClick(task)}
                        className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border flex items-center justify-between"
                        style={{ backgroundColor: colors.bg, color: 'var(--text-inverse)', borderColor: 'var(--border-strong)' }}>
                        <span className="flex-1 truncate">
                          {task.title}
                          {task.status === "done" && <span className="ml-1">✓</span>}
                        </span>
                        {children.length > 0 && (
                          <button onClick={(e) => toggleExpand(task.id, e)} className="ml-2 p-0.5 rounded transition-colors hover:bg-[var(--text-inverse)]/20">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {isExpanded && children.map(child => {
                        const childColors = getTaskColor(child, colors.bg);
                        return (
                          <div key={child.id} onClick={() => onTaskClick(child)}
                            className="px-3 py-1 rounded-lg text-[10px] cursor-pointer border mt-1 ml-2"
                            style={{ backgroundColor: childColors.bg, color: 'var(--text-inverse)', borderColor: 'var(--border-strong)' }}>
                            └ {child.title}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 时间轴主体：左侧时间刻度 + 右侧内容区，共享滚动 */}
      <div className="flex-1 flex min-h-0">
        {/* 左侧时间刻度列 */}
        <div className="shrink-0 w-16 border-r" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <div className="pt-0">
            {hours.map(hour => (
              <div
                key={hour}
                className="flex items-start justify-end pr-3 text-[11px]"
                style={{ height: HOUR_HEIGHT, paddingTop: 1, color: 'var(--text-muted)' }}
              >
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {/* 右侧网格 + 任务区域 */}
        <div className="flex-1 relative" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
          {/* 小时网格线 */}
          {hours.map(hour => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t"
              style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT, borderColor: 'var(--border-subtle)' }}
            />
          ))}

          {/* 当前时间红线 */}
          <CurrentTimeLine startHour={START_HOUR} hourHeight={HOUR_HEIGHT} />

          {/* 任务块 */}
          {positionedTasks.map(({ task, pos }) => {
            const colors = getTaskColor(task);
            const statusStyle = getStatusStyle(task);
            const children = childMap[task.id] || [];
            const isExpanded = expandedTasks.has(task.id);
            const isTall = pos.height >= 50;

            return (
              <div
                key={task.id}
                className="absolute left-1 right-1 z-10 cursor-pointer group"
                style={{ top: pos.top + 2, height: Math.max(pos.height - 4, 28) }}
                onClick={() => onTaskClick(task)}
              >
                <div
                  className="rounded px-2 py-1 h-full border flex flex-col justify-center overflow-hidden"
                  style={{ ...statusStyle, color: 'var(--text-inverse)' }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="text-xs font-medium truncate flex-1">{task.title}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      {task.startTime && isTall && (
                        <span className="text-[10px] opacity-70">{task.startTime}</span>
                      )}
                      {children.length > 0 && (
                        <button onClick={(e) => toggleExpand(task.id, e)} className="p-0.5 rounded transition-colors hover:bg-[var(--text-inverse)]/20">
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {isTall && task.project && (
                    <div className="text-[10px] opacity-60 truncate">{task.project}</div>
                  )}
                  {isTall && task.endTime && task.startTime && (
                    <div className="text-[10px] opacity-50">{task.startTime}-{task.endTime}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CurrentTimeLine({ startHour, hourHeight }: { startHour: number; hourHeight: number }) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60;
  const endMinutes = 24 * 60;
  if (nowMinutes < startMinutes || nowMinutes >= endMinutes) return null;

  const top = ((nowMinutes - startMinutes) / 60) * hourHeight;

  return (
    <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-[var(--color-danger)] -ml-1" />
        <div className="flex-1 h-px bg-[var(--color-danger)]" />
      </div>
    </div>
  );
}
