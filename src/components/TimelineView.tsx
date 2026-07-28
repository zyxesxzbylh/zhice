"use client";

import { useState, useMemo } from "react";
import { format, isToday, isPast, isFuture, startOfDay, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: number;
  dueDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  project: string | null;
  isSop: boolean;
  parentTaskId: string | null;
}

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  getTaskColor: (task: Task, parentColor?: string) => { bg: string; border: string; text: string };
}

type GroupBy = "time" | "project" | "priority" | "status";

export default function TimelineView({ tasks, onTaskClick, getTaskColor }: TimelineViewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("time");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 构建父子关系
  const { parentMap, childMap } = useMemo(() => {
    const parentMap: Record<string, Task> = {};
    const childMap: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      if (!task.parentTaskId) {
        parentMap[task.id] = task;
      } else {
        if (!childMap[task.parentTaskId]) {
          childMap[task.parentTaskId] = [];
        }
        childMap[task.parentTaskId].push(task);
      }
    });

    return { parentMap, childMap };
  }, [tasks]);

  // 过滤任务
  const filteredTasks = useMemo(() => {
    let result = Object.values(parentMap).filter((t) => t.dueDate);
    if (filterStatus !== "all") {
      result = result.filter((t) => t.status === filterStatus);
    }
    return result;
  }, [parentMap, filterStatus]);

  // 按时间分组
  const timeGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      future: [],
      noDate: [],
    };

    const now = new Date();
    const today = startOfDay(now);

    filteredTasks.forEach((task) => {
      if (!task.dueDate) {
        groups.noDate.push(task);
        return;
      }

      const due = new Date(task.dueDate);
      const daysDiff = differenceInDays(due, today);

      if (task.status === "done") {
        groups.today.push(task); // 已完成的任务放在今天
      } else if (isPast(due) && !isToday(due)) {
        groups.overdue.push(task);
      } else if (isToday(due)) {
        groups.today.push(task);
      } else if (daysDiff === 1) {
        groups.tomorrow.push(task);
      } else if (daysDiff > 1 && daysDiff <= 7) {
        groups.thisWeek.push(task);
      } else if (daysDiff > 7 && daysDiff <= 14) {
        groups.nextWeek.push(task);
      } else {
        groups.future.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  // 按项目分组
  const projectGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    filteredTasks.forEach((task) => {
      const key = task.project || "未分类";
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [filteredTasks]);

  // 按优先级分组
  const priorityGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };
    filteredTasks.forEach((task) => {
      if (task.priority >= 4) groups.urgent.push(task);
      else if (task.priority === 3) groups.high.push(task);
      else if (task.priority === 2) groups.medium.push(task);
      else groups.low.push(task);
    });
    return groups;
  }, [filteredTasks]);

  // 按状态分组
  const statusGroups = useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    filteredTasks.forEach((task) => {
      groups[task.status].push(task);
    });
    return groups;
  }, [filteredTasks]);

  const getGroupLabel = (key: string) => {
    const labels: Record<string, string> = {
      overdue: "已逾期",
      today: "今天",
      tomorrow: "明天",
      thisWeek: "本周",
      nextWeek: "下周",
      future: "未来",
      noDate: "无截止日期",
      urgent: "紧急",
      high: "高优先级",
      medium: "中优先级",
      low: "低优先级",
      todo: "待开始",
      in_progress: "进行中",
      done: "已完成",
    };
    return labels[key] || key;
  };

  const getGroupColor = (key: string) => {
    const colors: Record<string, string> = {
      overdue: "var(--color-danger)",
      today: "var(--text-primary)",
      tomorrow: "var(--text-secondary)",
      thisWeek: "var(--accent)",
      nextWeek: "var(--text-muted)",
      future: "var(--border-strong)",
      urgent: "var(--color-danger)",
      high: "var(--color-warning)",
      medium: "var(--accent)",
      low: "var(--text-muted)",
    };
    return colors[key] || "var(--text-muted)";
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderTask = (task: Task, isChild = false) => {
    const colors = getTaskColor(task);
    const children = childMap[task.id] || [];
    const isExpanded = expandedGroups.has(task.id);

    return (
      <div key={task.id} className={`${isChild ? "ml-8" : ""}`}>
        <div
          onClick={() => onTaskClick(task)}
          className="group flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all cursor-pointer hover:shadow-md"
          style={{
            borderLeftColor: colors.bg,
            backgroundColor: 'var(--bg-surface)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* 展开按钮 */}
          {children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGroup(task.id);
              }}
              className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-[var(--bg-muted-hover)]"
            >
              <svg
                width="12"
                height="12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!children.length && <div className="w-5" />}

          {/* 状态指示器 */}
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                task.status === "done"
                  ? "var(--text-muted)"
                  : task.status === "in_progress"
                  ? "var(--text-secondary)"
                  : "var(--border-strong)",
            }}
          />

          {/* 任务内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate" style={{
                color: task.status === "done" ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: task.status === "done" ? 'line-through' : 'none',
              }}>
                {task.title}
              </span>
              {task.isSop && (
                <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: 'var(--bg-muted-hover)', color: 'var(--text-secondary)' }}>SOP</span>
              )}
              {isChild && (
                <span className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>子</span>
              )}
            </div>
            {task.project && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{task.project}</div>
            )}
          </div>

          {/* 时间信息 */}
          <div className="text-right shrink-0">
            {task.dueDate && (
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {format(new Date(task.dueDate), "MM/dd", { locale: zhCN })}
              </div>
            )}
            {task.startTime && task.endTime && (
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {task.startTime}-{task.endTime}
              </div>
            )}
          </div>

          {/* 完成标记 */}
          {task.status === "done" && task.completedAt && (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ✓ {format(new Date(task.completedAt), "MM/dd HH:mm", { locale: zhCN })}
            </div>
          )}
        </div>

        {/* 子任务 */}
        {isExpanded && children.map((child) => renderTask(child, true))}
      </div>
    );
  };

  const renderGroup = (key: string, tasks: Task[]) => {
    if (tasks.length === 0) return null;
    const isExpanded = expandedGroups.has(key);

    return (
      <div key={key} className="mb-4">
        <button
          onClick={() => toggleGroup(key)}
          className="flex items-center gap-3 w-full py-2 group"
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getGroupColor(key) }} />
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{getGroupLabel(key)}</span>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>({tasks.length})</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--bg-muted-hover)' }} />
          <svg
            width="16"
            height="16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
            style={{ color: 'var(--text-muted)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && <div className="space-y-2 mt-2">{tasks.map((task) => renderTask(task))}</div>}
      </div>
    );
  };

  const getCurrentGroups = () => {
    switch (groupBy) {
      case "project":
        return projectGroups;
      case "priority":
        return priorityGroups;
      case "status":
        return statusGroups;
      default:
        return timeGroups;
    }
  };

  const groups = getCurrentGroups();

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-root)' }}>
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>分组:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="time">按时间</option>
            <option value="project">按项目</option>
            <option value="priority">按优先级</option>
            <option value="status">按状态</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>筛选:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">全部状态</option>
            <option value="todo">待开始</option>
            <option value="in_progress">进行中</option>
            <option value="done">已完成</option>
          </select>
        </div>

        <div className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>
          共 {filteredTasks.length} 个任务
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 overflow-auto p-4">
        {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)' }}>
            暂无任务
          </div>
        ) : (
          <div>
            {groupBy === "time" && (
              <>
                {renderGroup("overdue", groups.overdue || [])}
                {renderGroup("today", groups.today || [])}
                {renderGroup("tomorrow", groups.tomorrow || [])}
                {renderGroup("thisWeek", groups.thisWeek || [])}
                {renderGroup("nextWeek", groups.nextWeek || [])}
                {renderGroup("future", groups.future || [])}
                {renderGroup("noDate", groups.noDate || [])}
              </>
            )}
            {groupBy === "priority" && (
              <>
                {renderGroup("urgent", groups.urgent || [])}
                {renderGroup("high", groups.high || [])}
                {renderGroup("medium", groups.medium || [])}
                {renderGroup("low", groups.low || [])}
              </>
            )}
            {groupBy === "status" && (
              <>
                {renderGroup("todo", groups.todo || [])}
                {renderGroup("in_progress", groups.in_progress || [])}
                {renderGroup("done", groups.done || [])}
              </>
            )}
            {groupBy === "project" &&
              Object.entries(groups).map(([key, tasks]) => renderGroup(key, tasks))}
          </div>
        )}
      </div>
    </div>
  );
}
