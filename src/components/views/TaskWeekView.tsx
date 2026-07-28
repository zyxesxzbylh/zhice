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

interface TaskWeekViewProps {
  days: Date[];
  tasksByDate: Record<string, Task[]>;
  filteredTasks: Task[];
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
}

export default function TaskWeekView({
  days,
  tasksByDate,
  filteredTasks,
  childMap,
  onTaskClick,
}: TaskWeekViewProps) {
  const today = new Date();
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const tasksWithoutDueDate = filteredTasks.filter(t => !t.dueDate && !t.parentTaskId);
  const [showUndatedTasks, setShowUndatedTasks] = useState(true);

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-auto flex flex-col" style={{ backgroundColor: 'var(--bg-root)' }}>
      {tasksWithoutDueDate.length > 0 && (
        <div className="border-b" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
          <button onClick={() => setShowUndatedTasks(!showUndatedTasks)}
            className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--bg-root)]">
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
                        className="px-3 py-1.5 rounded-lg text-xs cursor-pointer border flex items-center gap-2"
                        style={{ backgroundColor: colors.bg, color: 'var(--text-inverse)', borderColor: 'var(--border-strong)' }}>
                        {task.title}
                        {task.status === "done" && <span>✓</span>}
                        {children.length > 0 && (
                          <button onClick={(e) => toggleExpand(task.id, e)} className="p-0.5 rounded transition-colors hover:bg-[var(--text-inverse)]/20">
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

      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">
          <div className="flex border-b sticky top-0 z-10" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div className="w-16 shrink-0"></div>
            {days.map((d, i) => (
              <div key={i} className="flex-1 text-center py-2 border-l" style={{ borderColor: 'var(--border-default)' }}>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{weekDays[i]}</div>
                <div className="text-sm" style={{
                  color: getDateKey(d) === getDateKey(today) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: getDateKey(d) === getDateKey(today) ? 'bold' : 'normal',
                }}>
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
          {hours.map(hour => {
            const maxChildren = Math.max(...days.map(d => {
              return (tasksByDate[getDateKey(d)] || []).filter(t => t.dueDate && !t.parentTaskId).filter(task => {
                const dueDate = new Date(task.dueDate!);
                return dueDate.getHours() === hour;
              }).reduce((max, task) => {
                const children = childMap[task.id] || [];
                const count = expandedTasks.has(task.id) ? children.length + 1 : 1;
                return Math.max(max, count);
              }, 1);
            }));
            const rowHeight = Math.max(64, maxChildren * 28);
            return (
              <div key={hour} className="flex border-b" style={{ minHeight: rowHeight, borderColor: 'var(--border-default)' }}>
                <div className="w-16 shrink-0 py-2 text-right pr-4 text-xs"
                  style={{ minHeight: rowHeight, color: 'var(--text-muted)', backgroundColor: 'var(--bg-root)' }}>
                  {String(hour).padStart(2, "0")}:00
                </div>
                {days.map((d, i) => (
                  <div key={i} className="flex-1 relative border-l"
                    style={{ minHeight: rowHeight, backgroundColor: 'var(--bg-root)', borderColor: 'var(--border-default)' }}>
                    {(tasksByDate[getDateKey(d)] || [])
                      .filter(t => t.dueDate && !t.parentTaskId)
                      .filter(task => new Date(task.dueDate!).getHours() === hour)
                      .map(task => {
                        const dueDate = new Date(task.dueDate!);
                        const dueMinute = dueDate.getMinutes();
                        const top = (dueMinute / 60) * rowHeight;
                        const colors = getTaskColor(task);
                        const children = childMap[task.id] || [];
                        const isExpanded = expandedTasks.has(task.id);
                        return (
                          <div key={task.id} className="absolute left-1 right-1" style={{ top: Math.max(top, 0) }}>
                            <div onClick={() => onTaskClick(task)}
                              className="rounded cursor-pointer px-1 py-0.5 text-xs border overflow-hidden flex items-center justify-between"
                              style={{ minHeight: 24, backgroundColor: colors.bg, borderColor: colors.border, color: 'var(--text-inverse)' }}>
                              <div className="flex-1 truncate">
                                <div className="font-medium truncate">{task.title}</div>
                                {task.project && <div className="text-[10px] truncate" style={{ color: 'var(--text-inverse)', opacity: 0.7 }}>{task.project}</div>}
                              </div>
                              {children.length > 0 && (
                                <button onClick={(e) => toggleExpand(task.id, e)} className="ml-1 p-0.5 rounded transition-colors hover:bg-[var(--text-inverse)]/20">
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
                                  className="rounded cursor-pointer px-1 py-0.5 text-[10px] border ml-2 mt-0.5"
                                  style={{ backgroundColor: childColors.bg, borderColor: childColors.border, color: 'var(--text-inverse)' }}>
                                  └ {child.title}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
