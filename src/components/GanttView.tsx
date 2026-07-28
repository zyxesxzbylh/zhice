"use client";

import { useState, useMemo } from "react";


import {
  format,
  addDays,
  addMonths,
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  getDate,
  getDaysInMonth,
  differenceInDays,
} from "date-fns";
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

export type ViewType = "day" | "week" | "month" | "year";

interface GanttViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  getTaskColor: (task: Task, parentColor?: string) => { bg: string; border: string; text: string };
  viewType?: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
}

// 获取旬（上中下三旬）
function getDecade(date: Date): number {
  const day = getDate(date);
  if (day <= 10) return 1; // 上旬
  if (day <= 20) return 2; // 中旬
  return 3; // 下旬
}

export default function GanttView({ tasks, onTaskClick, getTaskColor, viewType: externalViewType, onViewTypeChange }: GanttViewProps) {
  const [internalViewType, setInternalViewType] = useState<ViewType>("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 使用外部传入的 viewType 或内部状态
  const viewType = externalViewType ?? internalViewType;

  const setViewType = (newViewType: ViewType) => {
    if (onViewTypeChange) {
      onViewTypeChange(newViewType);
    } else {
      setInternalViewType(newViewType);
    }
  };

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

  // 获取有截止日期的父任务
  const parentTasks = useMemo(() => {
    return Object.values(parentMap).filter((t) => t.dueDate);
  }, [parentMap]);

  // 时间轴列配置
interface TimeAxisColumn {
  key: string;
  label: string;
  fullLabel: string;
  widthPercent: number;
  start?: Date;
  end?: Date;
  date?: Date;
  hour?: number;
}

// 根据视图类型生成时间轴配置
const timeAxis: { type: "year" | "month" | "week" | "day"; columns: TimeAxisColumn[] } = useMemo(() => {
  switch (viewType) {
    case "year": {
      // 年视图：12个月
      const start = startOfYear(selectedDate);
      const end = endOfYear(selectedDate);
      const months = eachMonthOfInterval({ start, end });
      return {
        type: "year" as const,
        columns: months.map((month, index): TimeAxisColumn => ({
          key: `month-${index}`,
          label: format(month, "MMM", { locale: zhCN }),
          fullLabel: format(month, "yyyy年M月", { locale: zhCN }),
          start: month,
          end: endOfMonth(month),
          widthPercent: 100 / 12,
        })),
      };
    }

    case "month": {
      // 月视图：上中下三旬
      const daysInMonth = getDaysInMonth(selectedDate);
      const decades = [
        { name: "上旬", start: 1, end: 10 },
        { name: "中旬", start: 11, end: 20 },
        { name: "下旬", start: 21, end: daysInMonth },
      ];

      return {
        type: "month" as const,
        columns: decades.map((decade): TimeAxisColumn => ({
          key: `decade-${decade.name}`,
          label: decade.name,
          fullLabel: `${format(selectedDate, "M月", { locale: zhCN })}${decade.name}`,
          start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), decade.start),
          end: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), decade.end, 23, 59, 59),
          widthPercent: (decade.end - decade.start + 1) / daysInMonth * 100,
        })),
      };
    }

    case "week": {
      // 周视图：7天，每格自适应宽度
      const start = addDays(selectedDate, -selectedDate.getDay() + 1); // 周一开始
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      return {
        type: "week" as const,
        columns: days.map((day): TimeAxisColumn => ({
          key: `day-${format(day, "yyyy-MM-dd")}`,
          label: format(day, "E", { locale: zhCN }),
          fullLabel: format(day, "MM/dd", { locale: zhCN }),
          date: day,
          widthPercent: 100 / 7,
        })),
      };
    }

    case "day": {
      // 日视图：6:00-24:00（18个小时）
      const START_HOUR = 6;
      const END_HOUR = 24;
      const TOTAL_HOURS = END_HOUR - START_HOUR; // 18小时
      const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
      return {
        type: "day" as const,
        columns: hours.map((hour): TimeAxisColumn => ({
          key: `hour-${hour}`,
          label: `${hour}:00`,
          fullLabel: format(selectedDate, "MM/dd", { locale: zhCN }),
          hour,
          widthPercent: 100 / TOTAL_HOURS,
        })),
      };
    }
    default: {
      // 默认返回周视图
      const start = addDays(selectedDate, -selectedDate.getDay() + 1);
      const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
      return {
        type: "week" as const,
        columns: days.map((day): TimeAxisColumn => ({
          key: `day-${format(day, "yyyy-MM-dd")}`,
          label: format(day, "E", { locale: zhCN }),
          fullLabel: format(day, "MM/dd", { locale: zhCN }),
          date: day,
          widthPercent: 100 / 7,
        })),
      };
    }
  }
}, [viewType, selectedDate]);

  // 解析时间字符串为分钟数
  const timeToMinutes = (t: string | null): number => {
    if (!t) return -1;
    const parts = t.split(":");
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  // 计算任务在时间轴上的位置
  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null;

    const dueDate = new Date(task.dueDate);
    const startMin = timeToMinutes(task.startTime);
    const endMin = timeToMinutes(task.endTime);

    switch (timeAxis.type) {
      case "year": {
        // 找到任务所属的月份列
        const monthIndex = timeAxis.columns.findIndex(
          (col) => col.start && isSameMonth(dueDate, col.start)
        );
        if (monthIndex === -1) return null;

        const col = timeAxis.columns[monthIndex];
        const daysInMonth = col.start ? getDaysInMonth(col.start) : 30;
        const dayOfMonth = getDate(dueDate);
        const offsetPercent = ((dayOfMonth - 1) / daysInMonth) * col.widthPercent;

        return {
          leftPercent: timeAxis.columns.slice(0, monthIndex).reduce((sum, c) => sum + c.widthPercent, 0) + offsetPercent,
          widthPercent: Math.max(1, col.widthPercent / daysInMonth),
        };
      }

      case "month": {
        // 找到任务所属的旬列
        const decadeIndex = timeAxis.columns.findIndex((col) => {
          return col.start && col.end && dueDate >= col.start && dueDate <= col.end;
        });
        if (decadeIndex === -1) return null;

        const col = timeAxis.columns[decadeIndex];
        const daysInDecade = col.start && col.end ? differenceInDays(col.end, col.start) + 1 : 10;
        const dayOfDecade = col.start ? differenceInDays(dueDate, col.start) + 1 : 1;
        const offsetPercent = ((dayOfDecade - 1) / daysInDecade) * col.widthPercent;

        return {
          leftPercent: timeAxis.columns.slice(0, decadeIndex).reduce((sum, c) => sum + c.widthPercent, 0) + offsetPercent,
          widthPercent: Math.max(1, col.widthPercent / daysInDecade),
        };
      }

      case "week": {
        // 找到任务所属的日期列
        const dayIndex = timeAxis.columns.findIndex((col) =>
          col.date && isSameDay(dueDate, col.date)
        );
        if (dayIndex === -1) return null;

        return {
          leftPercent: dayIndex * (100 / 7) + 2,
          widthPercent: 100 / 7 - 4,
        };
      }

      case "day": {
        // 根据 startTime-endTime 计算位置和跨度（6:00-24:00，18个小时）
        const START_HOUR = 6;
        const END_HOUR = 24;
        const TOTAL_HOURS = END_HOUR - START_HOUR; // 18小时

        if (startMin >= 0 && endMin > startMin) {
          // 有明确的起止时间，按时间跨度填充
          const startHourDecimal = startMin / 60;
          const endHourDecimal = endMin / 60;

          if (startHourDecimal < START_HOUR || endHourDecimal > END_HOUR ||
              startHourDecimal >= END_HOUR || endHourDecimal <= START_HOUR) {
            return null;
          }

          const clampedStart = Math.max(startHourDecimal, START_HOUR);
          const clampedEnd = Math.min(endHourDecimal, END_HOUR);

          const leftPercent = ((clampedStart - START_HOUR) / TOTAL_HOURS) * 100;
          const widthPercent = ((clampedEnd - clampedStart) / TOTAL_HOURS) * 100;

          return {
            leftPercent,
            widthPercent: Math.max(1, widthPercent),
          };
        }

        // Fallback: 没有起止时间，使用 dueDate 的小时
        const hour = dueDate.getHours();
        const minute = dueDate.getMinutes();

        if (hour < START_HOUR || hour >= END_HOUR) {
          return null;
        }

        const offsetPercent = (minute / 60) * (100 / TOTAL_HOURS);
        return {
          leftPercent: (hour - START_HOUR) * (100 / TOTAL_HOURS) + offsetPercent,
          widthPercent: Math.max(1, 100 / TOTAL_HOURS * 0.8),
        };
      }
    }
  };

  // 导航函数
  const navigatePrev = () => {
    switch (viewType) {
      case "year":
        setSelectedDate(addMonths(selectedDate, -12));
        break;
      case "month":
        setSelectedDate(addMonths(selectedDate, -1));
        break;
      case "week":
        setSelectedDate(addDays(selectedDate, -7));
        break;
      case "day":
        setSelectedDate(addDays(selectedDate, -1));
        break;
    }
  };

  const navigateNext = () => {
    switch (viewType) {
      case "year":
        setSelectedDate(addMonths(selectedDate, 12));
        break;
      case "month":
        setSelectedDate(addMonths(selectedDate, 1));
        break;
      case "week":
        setSelectedDate(addDays(selectedDate, 7));
        break;
      case "day":
        setSelectedDate(addDays(selectedDate, 1));
        break;
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
    todo: { bg: "var(--text-muted)", border: "var(--border-default)" },
    in_progress: { bg: "var(--color-info)", border: "var(--color-info-border)" },
    done: { bg: "var(--color-success)", border: "var(--color-success-border)" },
  };

  const getStatusStyle = (status: string): { className: string; style: React.CSSProperties } => {
    const statusColor = STATUS_COLORS[status];
    switch (status) {
      case "done":
        return {
          className: "opacity-75",
          style: {
            backgroundColor: statusColor?.bg || "var(--bg-muted-hover)",
            borderColor: statusColor?.border || "var(--border-strong)",
          },
        };
      case "in_progress":
        return {
          className: "",
          style: {
            backgroundColor: statusColor?.bg || "var(--color-info)",
            borderColor: statusColor?.border || "var(--color-info-border)",
            boxShadow: `0 0 0 2px ${statusColor?.bg || "var(--color-info)"}30, 0 1px 3px ${statusColor?.bg || "var(--color-info)"}20`,
          },
        };
      default:
        return {
          className: "",
          style: {
            backgroundColor: statusColor?.bg || "var(--text-secondary)",
            borderColor: statusColor?.border || "var(--border-strong)",
          },
        };
    }
  };

  // 获取当前视图标题
  const getViewTitle = () => {
    switch (viewType) {
      case "year":
        return format(selectedDate, "yyyy年", { locale: zhCN });
      case "month":
        return format(selectedDate, "yyyy年M月", { locale: zhCN });
      case "week":
        const weekStart = addDays(selectedDate, -selectedDate.getDay() + 1);
        const weekEnd = addDays(weekStart, 6);
        return `${format(weekStart, "MM/dd")} - ${format(weekEnd, "MM/dd")}`;
      case "day":
        return format(selectedDate, "yyyy年MM月dd日 EEEE", { locale: zhCN });
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--bg-root)' }}>
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>视图:</span>

          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2"
            style={{
              borderColor: 'var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="year">年</option>
            <option value="month">月</option>
            <option value="week">周</option>
            <option value="day">日</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrev}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[180px] text-center" style={{ color: 'var(--text-secondary)' }}>
            {getViewTitle()}
          </span>
          <button
            onClick={navigateNext}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:bg-[var(--bg-muted-hover)]"
          style={{ backgroundColor: 'var(--bg-muted)' }}
        >
          今天
        </button>

        <div className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>
          共 {parentTasks.length} 个任务
        </div>
      </div>

      {/* 甘特图主体 */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* 左侧任务列表 */}
          <div className="w-64 shrink-0 border-r overflow-y-auto" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
            <div className="h-14 border-b flex items-center px-4 text-sm font-medium" style={{ borderColor: 'var(--border-default)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-root)' }}>
              任务
            </div>
            {parentTasks.map((task) => {
              const colors = getTaskColor(task);
              const children = childMap[task.id] || [];
              const isExpanded = expandedTasks.has(task.id);

              return (
                <div key={task.id}>
                  <div className="h-11 border-b flex items-center px-3 transition-colors hover:bg-[var(--bg-root)]" style={{ borderColor: 'var(--border-subtle)' }}>
                    {children.length > 0 && (
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="w-5 h-5 flex items-center justify-center rounded mr-1 hover:bg-[var(--bg-muted-hover)]"
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
                    {!children.length && <div className="w-5 mr-1" />}
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: colors.bg }} />
                    <span className="text-sm truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{task.title}</span>
                  </div>
                  {isExpanded &&
                    children.map((child) => (
                      <div
                        key={child.id}
                        className="h-9 border-b flex items-center px-3 pl-8 transition-colors hover:bg-[var(--bg-root)]"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: 'var(--text-muted)' }} />
                        <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{child.title}</span>
                      </div>
                    ))}
                </div>
              );
            })}
          </div>

          {/* 右侧时间轴 - 自适应全屏 */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* 时间轴头部 */}
              <div className="h-14 border-b flex" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-root)' }}>
                {timeAxis.columns.map((col, index) => (
                  <div
                    key={col.key}
                    className={`flex flex-col items-center justify-center border-r ${
                      index === 0 ? "border-l" : ""
                    }`}
                    style={{ width: `${col.widthPercent}%`, borderColor: 'var(--border-default)' }}
                    title={col.fullLabel}
                  >
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{col.label}</span>
                    {viewType === "month" && col.start && col.end && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {format(col.start, "d")}-{format(col.end, "d")}日
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* 任务条区域 */}
              <div className="flex-1 relative overflow-y-auto">
                {/* 今天指示线 */}
                {(() => {
                  const today = new Date();
                  let leftPercent = 0;

                  switch (timeAxis.type) {
                    case "year": {
                      const monthIndex = timeAxis.columns.findIndex((col) =>
                        col.start && isSameMonth(today, col.start)
                      );
                      if (monthIndex === -1) return null;
                      const col = timeAxis.columns[monthIndex];
                      const daysInMonth = col.start ? getDaysInMonth(col.start) : 30;
                      const dayOfMonth = getDate(today);
                      const offsetPercent = ((dayOfMonth - 1) / daysInMonth) * col.widthPercent;
                      leftPercent = timeAxis.columns.slice(0, monthIndex).reduce((sum, c) => sum + c.widthPercent, 0) + offsetPercent;
                      break;
                    }
                    case "month": {
                      const decadeIndex = timeAxis.columns.findIndex((col) => {
                        return col.start && col.end && today >= col.start && today <= col.end;
                      });
                      if (decadeIndex === -1) return null;
                      const col = timeAxis.columns[decadeIndex];
                      const daysInDecade = col.start && col.end ? differenceInDays(col.end, col.start) + 1 : 10;
                      const dayOfDecade = col.start ? differenceInDays(today, col.start) + 1 : 1;
                      const offsetPercent = ((dayOfDecade - 1) / daysInDecade) * col.widthPercent;
                      leftPercent = timeAxis.columns.slice(0, decadeIndex).reduce((sum, c) => sum + c.widthPercent, 0) + offsetPercent;
                      break;
                    }
                    case "week": {
                      const dayIndex = timeAxis.columns.findIndex((col) =>
                        col.date && isSameDay(today, col.date)
                      );
                      if (dayIndex === -1) return null;
                      leftPercent = dayIndex * (100 / 7) + 50 / 7;
                      break;
                    }
                    case "day": {
                      const hour = today.getHours();
                      const minute = today.getMinutes();
                      const START_HOUR = 6;
                      const END_HOUR = 24;
                      const TOTAL_HOURS = END_HOUR - START_HOUR;
                      if (hour < START_HOUR || hour >= END_HOUR) {
                        leftPercent = -1;
                      } else {
                        leftPercent = (hour - START_HOUR) * (100 / TOTAL_HOURS) + (minute / 60) * (100 / TOTAL_HOURS);
                      }
                      break;
                    }
                  }

                  return (
                    leftPercent >= 0 ? (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-[var(--color-danger)] z-20 pointer-events-none"
                      style={{ left: `${leftPercent}%` }}
                    >
                      <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-[var(--color-danger)] rounded-full" />
                    </div>
                    ) : null
                  );
                })()}

                {/* 网格线 */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {timeAxis.columns.map((col, index) => (
                    <div
                      key={`grid-${col.key}`}
                      className="border-r h-full"
                      style={{ width: `${col.widthPercent}%`, borderColor: 'var(--border-subtle)' }}
                    />
                  ))}
                </div>

                {/* 任务条 */}
                {parentTasks.map((task) => {
                  const children = childMap[task.id] || [];
                  const isExpanded = expandedTasks.has(task.id);
                  const position = getTaskPosition(task);
                  const statusStyle = getStatusStyle(task.status);

                  return (
                    <div key={task.id}>
                      {/* 父任务 */}
                      <div className="h-11 border-b relative" style={{ borderColor: 'var(--border-subtle)' }}>
                        {position && (
                          <div
                            onClick={() => onTaskClick(task)}
                            className={`absolute top-2 h-7 rounded-md px-2 flex items-center text-xs cursor-pointer hover:opacity-90 transition-all ${statusStyle.className}`}
                            style={{
                              left: `${position.leftPercent}%`,
                              width: `${Math.max(4, position.widthPercent)}%`,
                              ...statusStyle.style,
                              minWidth: "60px",
                              color: 'var(--text-inverse)',
                            }}
                            title={`${task.title} (${format(new Date(task.dueDate!), viewType === "day" ? "HH:mm" : "MM/dd")})`}
                          >
                            <span className="truncate">{task.title}</span>
                          </div>
                        )}
                      </div>

                      {/* 子任务 */}
                      {isExpanded &&
                        children.map((child) => {
                          const childPosition = getTaskPosition(child);
                          const childStatusStyle = getStatusStyle(child.status);

                          return (
                            <div key={child.id} className="h-9 border-b relative" style={{ borderColor: 'var(--border-subtle)' }}>
                              {childPosition && (
                                <div
                                  onClick={() => onTaskClick(child)}
                                  className={`absolute top-1.5 h-6 rounded px-1.5 flex items-center text-[10px] cursor-pointer hover:opacity-90 transition-all ${childStatusStyle.className}`}
                                  style={{
                                    left: `${childPosition.leftPercent}%`,
                                    width: `${Math.max(3, childPosition.widthPercent * 0.8)}%`,
                                    ...childStatusStyle.style,
                                    minWidth: "50px",
                                    color: 'var(--text-inverse)',
                                  }}
                                  title={`${child.title} (${format(new Date(child.dueDate!), viewType === "day" ? "HH:mm" : "MM/dd")})`}
                                >
                                  <span className="truncate">{child.title}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-6 px-4 py-2 border-t text-xs" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "var(--text-secondary)" }} />
          <span>待开始</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "var(--color-info)", boxShadow: "0 0 0 2px color-mix(in srgb, var(--color-info) 20%, transparent)" }} />
          <span>进行中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded opacity-75" style={{ backgroundColor: "var(--bg-muted-hover)" }} />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-px h-3 bg-[var(--color-danger)]" />
          <span>今天</span>
        </div>
      </div>
    </div>
  );
}
