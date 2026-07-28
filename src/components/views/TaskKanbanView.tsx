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

interface TaskKanbanViewProps {
  filteredTasks: Task[];
  childMap: Record<string, Task[]>;
  onTaskClick: (task: Task) => void;
}

const COLUMNS = [
  { key: "todo", title: "待开始", color: "var(--text-secondary)" },
  { key: "in_progress", title: "进行中", color: "var(--color-info)" },
  { key: "done", title: "已完成", color: "var(--color-success)" },
];

export default function TaskKanbanView({
  filteredTasks,
  childMap,
  onTaskClick,
}: TaskKanbanViewProps) {
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

  const getColumnTasks = (status: string) => {
    return filteredTasks.filter(t => t.status === status && !t.parentTaskId);
  };

  return (
    <div className="flex-1 flex gap-4 p-4 overflow-auto" style={{ backgroundColor: 'var(--bg-root)' }}>
      {COLUMNS.map(col => {
        const columnTasks = getColumnTasks(col.key);
        return (
          <div key={col.key} className="flex-1 min-w-[250px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: col.color }}></div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{col.title}</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-muted-hover)' }}>
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {columnTasks.map(task => {
                const colors = getTaskColor(task);
                const children = childMap[task.id] || [];
                const isExpanded = expandedTasks.has(task.id);
                return (
                  <div key={task.id}>
                    <div
                      onClick={() => onTaskClick(task)}
                      className="rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-default)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: colors.bg }}></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm" style={{
                            color: task.status === "done" ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: task.status === "done" ? 'line-through' : 'none',
                          }}>
                            {task.title}
                          </div>
                          {task.project && (
                            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{task.project}</div>
                          )}
                          {task.dueDate && (
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              {new Date(task.dueDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{
                              color: task.priority === 1 ? 'var(--color-danger)' : task.priority === 2 ? 'var(--color-warning)' : 'var(--text-muted)',
                              backgroundColor: task.priority === 1 ? 'var(--accent-muted)' : task.priority === 2 ? 'var(--accent-muted)' : 'var(--bg-root)',
                              borderColor: task.priority === 1 ? 'var(--color-danger)' : task.priority === 2 ? 'var(--color-warning)' : 'var(--border-default)',
                            }}>
                              {task.priority === 1 ? "紧急" : task.priority === 2 ? "高" : "普通"}
                            </span>
                            {children.length > 0 && (
                              <button onClick={(e) => toggleExpand(task.id, e)}
                                className="text-[10px] transition-colors flex items-center gap-1"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                  className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {children.length} 子任务
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {isExpanded && children.map(child => {
                      const childColors = getTaskColor(child, colors.bg);
                      return (
                        <div key={child.id} onClick={() => onTaskClick(child)}
                          className="rounded-lg border border-l-2 p-2 ml-4 mt-1 cursor-pointer transition-all hover:shadow-sm"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-default)',
                            borderLeftColor: childColors.bg,
                            boxShadow: 'var(--shadow-sm)',
                          }}>
                          <div className="text-xs" style={{
                            color: child.status === "done" ? 'var(--text-muted)' : 'var(--text-secondary)',
                            textDecoration: child.status === "done" ? 'line-through' : 'none',
                          }}>
                            {child.title}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
