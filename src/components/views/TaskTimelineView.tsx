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

interface TaskTimelineViewProps {
  days: Date[];
  tasksByDate: Record<string, Task[]>;
  filteredTasks: Task[];
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
}

const START_HOUR = 6;
const END_HOUR = 24;
const HOUR_HEIGHT = 72; // px

function timeToMinutes(t: string | null): number {
  if (!t) return -1;
  const parts = t.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TaskTimelineView({
  days,
  tasksByDate,
  filteredTasks,
  childMap,
  onTaskClick,
}: TaskTimelineViewProps) {
  const day = days[0];
  const todayKey = getDateKey(day);
  const dayTasks = (tasksByDate[todayKey] || []).filter(t => t.dueDate && !t.parentTaskId);
  const tasksWithoutDueDate = filteredTasks.filter(t => !t.dueDate && !t.parentTaskId);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // 计算任务时间位置
  const computePosition = (task: Task) => {
    const startMin = timeToMinutes(task.startTime);
    const endMin = timeToMinutes(task.endTime);

    if (startMin >= 0 && endMin > startMin) {
      return {
        top: ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT,
        height: ((endMin - startMin) / 60) * HOUR_HEIGHT,
        label: `${task.startTime} - ${task.endTime}`,
      };
    }

    if (task.dueDate) {
      const h = new Date(task.dueDate).getHours();
      if (h >= START_HOUR && h < END_HOUR) {
        return {
          top: (h - START_HOUR) * HOUR_HEIGHT,
          height: HOUR_HEIGHT,
          label: `${String(h).padStart(2, "0")}:00`,
        };
      }
    }
    return null;
  };

  const positioned = dayTasks
    .map(task => ({ task, pos: computePosition(task) }))
    .filter((p): p is { task: Task; pos: NonNullable<ReturnType<typeof computePosition>> } => p.pos !== null);

  const formatDate = (d: Date) => {
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekDays[d.getDay()]}`;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-root)' }}>
      {/* 日期标题 */}
      <div className="px-4 py-3 border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{formatDate(day)}</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {dayTasks.length} 个任务 · {tasksWithoutDueDate.length} 个未排期
        </p>
      </div>

      {/* 未排期任务 */}
      {tasksWithoutDueDate.length > 0 && (
        <div className="px-4 py-2 border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex flex-wrap gap-1.5">
            {tasksWithoutDueDate.map(task => {
              const colors = getTaskColor(task);
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="px-2 py-0.5 rounded text-[11px] cursor-pointer transition-colors hover:bg-[var(--bg-muted-hover)]"
                  style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-muted)' }}
                >
                  {task.title}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 时间轴主体 */}
      <div className="flex-1 overflow-auto">
        <div className="flex min-h-full">
          {/* 时间刻度列 */}
          <div className="w-20 shrink-0 border-r" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            {hours.map(hour => (
              <div
                key={hour}
                className="flex items-start justify-end pr-3 border-b"
                style={{ height: HOUR_HEIGHT, borderColor: 'var(--bg-root)' }}
              >
                <span className="text-xs -mt-2" style={{ color: 'var(--text-muted)' }}>
                  {String(hour).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* 任务区域 */}
          <div className="flex-1 relative" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
            {/* 小时网格线 */}
            {hours.map(hour => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT, borderColor: 'var(--border-subtle)' }}
              />
            ))}

            {/* 半小时虚线 */}
            {hours.map(hour => (
              <div
                key={`half-${hour}`}
                className="absolute left-0 right-0 border-b border-dashed"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2, borderColor: 'var(--bg-root)' }}
              />
            ))}

            {/* 当前时间线 */}
            <CurrentTimeLine startHour={START_HOUR} hourHeight={HOUR_HEIGHT} />

            {/* 任务时间块 */}
            {positioned.map(({ task, pos }) => {
              const colors = getTaskColor(task);
              const isDone = task.status === "done";
              const isSmall = pos.height < 40;

              return (
                <div
                  key={task.id}
                  className="absolute left-1 right-1 z-10 group"
                  style={{ top: pos.top + 2, height: Math.max(pos.height - 4, 24) }}
                >
                  <div
                    onClick={() => onTaskClick(task)}
                    className="h-full rounded-lg border cursor-pointer transition-all hover:shadow-md overflow-hidden"
                    style={{
                      backgroundColor: isDone ? "var(--bg-muted)" : colors.bg,
                      borderColor: isDone ? "var(--border-strong)" : "transparent",
                      opacity: isDone ? 0.7 : 1,
                    }}
                  >
                    {/* 时间标签（顶部） */}
                    <div className="absolute top-0 left-0 right-0 px-2 py-0.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-inverse)]/40 shrink-0" />
                      <span className="text-[10px] text-[var(--text-inverse)]/80 font-mono">{pos.label}</span>
                    </div>

                    {/* 任务内容（居中） */}
                    <div className="h-full flex flex-col justify-center px-3 pt-5 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-medium truncate flex-1`} style={{
                          color: isDone ? 'var(--text-muted)' : 'var(--text-inverse)',
                        }}>
                          {task.title}
                        </span>
                      </div>
                      {!isSmall && task.description && (
                        <p className="text-[10px] truncate mt-0.5" style={{
                          color: isDone ? 'var(--text-muted)' : 'rgba(255,255,255,0.7)',
                        }}>
                          {task.description}
                        </p>
                      )}
                      {!isSmall && task.project && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px]" style={{
                            color: isDone ? 'var(--text-muted)' : 'rgba(255,255,255,0.5)',
                          }}>
                            {task.project}
                          </span>
                          {task.priority <= 2 && (
                            <span className="text-[10px] px-1 rounded" style={{
                              backgroundColor: isDone ? 'var(--bg-muted-hover)' : 'rgba(255,255,255,0.2)',
                              color: isDone ? 'var(--text-muted)' : 'rgba(255,255,255,0.8)',
                            }}>
                              P{task.priority}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 空状态 */}
            {positioned.length === 0 && (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
                当日无已排期任务
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部统计条 */}
      {positioned.length > 0 && (
        <div className="px-4 py-2 border-t flex items-center gap-4 text-xs" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-muted)' }}>
          <span>时间跨度: {START_HOUR}:00 - {END_HOUR}:00</span>
          <span>·</span>
          <span>已排期 {positioned.length} 个任务</span>
        </div>
      )}
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
