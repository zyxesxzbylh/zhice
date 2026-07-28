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

interface TaskMonthViewProps {
  days: Date[];
  tasksByDate: Record<string, Task[]>;
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
  onDateClick: (date: Date, timeRange: string) => void;
}

export default function TaskMonthView({
  days,
  tasksByDate,
  childMap,
  onTaskClick,
  onDateClick,
}: TaskMonthViewProps) {
  const today = new Date();
  const weekDays = ["一", "二", "三", "四", "五", "六", "日"];
  const firstDay = days[0].getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const emptyDays = Array.from({ length: offset }, (_, i) => i);
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

  return (
    <div className="flex-1 overflow-auto" style={{ backgroundColor: 'var(--bg-root)' }}>
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        {weekDays.map((wd, i) => (
          <div key={i} className="py-2 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{wd}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1" style={{ backgroundColor: 'var(--bg-root)' }}>
        {emptyDays.map(i => (
          <div key={`e-${i}`} className="border-b border-r min-h-28" style={{ borderColor: 'var(--border-default)' }}></div>
        ))}
        {days.map((d, i) => {
          const dayTasks = (tasksByDate[getDateKey(d)] || []).filter(t => !t.parentTaskId);
          const isToday = getDateKey(d) === getDateKey(today);
          return (
            <div key={i} onClick={() => onDateClick(d, "day")}
              className={`border-b border-r min-h-28 p-1 cursor-pointer transition-colors`}
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: isToday ? 'var(--bg-muted)' : 'var(--bg-root)',
              }}
            >
              <div className="text-xs mb-1" style={{
                color: isToday ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isToday ? 'bold' : 'normal',
              }}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5 max-h-[calc(28px-1rem)] overflow-hidden">
                {dayTasks.slice(0, 3).map(task => {
                  const colors = getTaskColor(task);
                  const children = childMap[task.id] || [];
                  const isExpanded = expandedTasks.has(task.id);
                  return (
                    <div key={task.id}>
                      <div onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                        className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center justify-between ${task.status === "done" ? "opacity-50" : ""}`}
                        style={{ backgroundColor: colors.bg, color: 'var(--text-inverse)', textDecoration: task.status === "done" ? 'line-through' : 'none' }}>
                        <span className="truncate flex-1">{task.title}</span>
                        {children.length > 0 && (
                          <button onClick={(e) => toggleExpand(task.id, e)} className="ml-1 p-0.5 rounded transition-colors hover:bg-[var(--text-inverse)]/20">
                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                              className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {isExpanded && children.map(child => {
                        const childColors = getTaskColor(child, colors.bg);
                        return (
                          <div key={child.id} onClick={(e) => { e.stopPropagation(); onTaskClick(child); }}
                            className={`text-[9px] px-1 py-0.5 rounded truncate ml-2 ${child.status === "done" ? "opacity-50" : ""}`}
                            style={{ backgroundColor: childColors.bg, color: 'var(--text-inverse)', textDecoration: child.status === "done" ? 'line-through' : 'none' }}>
                            └ {child.title}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] pl-1" style={{ color: 'var(--text-muted)' }}>+{dayTasks.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
