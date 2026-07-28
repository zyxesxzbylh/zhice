"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  format,
  addDays,
  addMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  startOfYear,
  endOfMonth,
  endOfYear,
  eachMonthOfInterval,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  getDate,
  getDaysInMonth,
  differenceInDays,
} from "date-fns";
import { zhCN } from "date-fns/locale";

function getDateKeyUtil(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

interface FloatingViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  getTaskColor: (task: Task, parentColor?: string) => { bg: string; border: string; text: string };
  onClose?: () => void;
}

type ViewType = "schedule" | "gantt";
type TimeRange = "day" | "week" | "month" | "year";

const STATUS_COLORS: Record<string, { bg: string; border: string }> = {
  todo: { bg: "var(--text-muted)", border: "var(--border-default)" },
  in_progress: { bg: "var(--color-info)", border: "var(--color-info-border)" },
  done: { bg: "var(--color-success)", border: "var(--color-success-border)" },
};

export default function FloatingView({ tasks, onTaskClick, getTaskColor, onClose }: FloatingViewProps) {
  // 位置和大小状态
  const [position, setPosition] = useState({ x: window.innerWidth - 440, y: 60 });
  const [size, setSize] = useState({ width: 420, height: 560 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // 视图状态
  const [viewType, setViewType] = useState<ViewType>("schedule");
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 从 localStorage 读取状态
  useEffect(() => {
    const saved = localStorage.getItem("floatingViewState");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setPosition(state.position || { x: window.innerWidth - 440, y: 60 });
        setSize(state.size || { width: 420, height: 560 });
        setIsMinimized(state.isMinimized || false);
        setViewType(state.viewType || "schedule");
        setTimeRange(state.timeRange || "day");
      } catch { /* ignore */ }
    }
  }, []);

  // 保存状态到 localStorage
  useEffect(() => {
    const state = { position, size, isMinimized, viewType, timeRange };
    localStorage.setItem("floatingViewState", JSON.stringify(state));
  }, [position, size, isMinimized, viewType, timeRange]);

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (headerRef.current && headerRef.current.contains(e.target as Node)) {
      setIsDragging(true);
      setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragOffset.y)),
      });
    }
    if (isResizing) {
      setSize({
        width: Math.max(300, resizeStart.w + (e.clientX - resizeStart.x)),
        height: Math.max(200, resizeStart.h + (e.clientY - resizeStart.y)),
      });
    }
  }, [isDragging, isResizing, dragOffset, resizeStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, w: size.width, h: size.height });
  }, [size]);

  // 导航
  const navigatePrev = () => {
    const d = new Date(selectedDate);
    switch (timeRange) {
      case "day": d.setDate(d.getDate() - 1); break;
      case "week": d.setDate(d.getDate() - 7); break;
      case "month": d.setMonth(d.getMonth() - 1); break;
      case "year": d.setFullYear(d.getFullYear() - 1); break;
    }
    setSelectedDate(d);
  };

  const navigateNext = () => {
    const d = new Date(selectedDate);
    switch (timeRange) {
      case "day": d.setDate(d.getDate() + 1); break;
      case "week": d.setDate(d.getDate() + 7); break;
      case "month": d.setMonth(d.getMonth() + 1); break;
      case "year": d.setFullYear(d.getFullYear() + 1); break;
    }
    setSelectedDate(d);
  };

  const goToday = () => setSelectedDate(new Date());

  const getTitleText = () => {
    const d = selectedDate;
    switch (timeRange) {
      case "day":
        if (getDateKeyUtil(d) === getDateKeyUtil(new Date())) return "今天";
        return format(d, "M月d日 EEEE", { locale: zhCN });
      case "week": {
        const ws = startOfWeek(d);
        const we = addDays(ws, 6);
        return `${format(ws, "M/d")} - ${format(we, "M/d")}`;
      }
      case "month": return format(d, "yyyy年M月", { locale: zhCN });
      case "year": return format(d, "yyyy年", { locale: zhCN });
    }
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // 构建父子关系
  const { parentMap, childMap } = useMemo(() => {
    const pm: Record<string, Task> = {};
    const cm: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (!t.parentTaskId) pm[t.id] = t;
      else {
        if (!cm[t.parentTaskId]) cm[t.parentTaskId] = [];
        cm[t.parentTaskId].push(t);
      }
    });
    return { parentMap: pm, childMap: cm };
  }, [tasks]);

  // 按日期索引任务
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(t => {
      if (t.dueDate) {
        const key = getDateKeyUtil(new Date(t.dueDate));
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    });
    return map;
  }, [tasks]);

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    const c = STATUS_COLORS[status] || STATUS_COLORS.todo;
    switch (status) {
      case "done":
        return { backgroundColor: c.bg, opacity: 0.7 };
      case "in_progress":
        return { backgroundColor: c.bg, boxShadow: `0 0 0 1.5px ${c.bg}50` };
      default:
        return { backgroundColor: c.bg };
    }
  };

  // 任务卡片组件
  const TaskCard = ({ task, compact = false }: { task: Task; compact?: boolean }) => {
    const children = childMap[task.id] || [];
    const isExpanded = expandedTasks.has(task.id);
    const style = getStatusStyle(task.status);
    const sizeClass = compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-1";

    return (
      <div>
        <div
          onClick={() => onTaskClick(task)}
          className={`rounded-md text-white cursor-pointer hover:brightness-110 transition-all flex items-center gap-1 ${sizeClass}`}
          style={style}
        >
          <span className="truncate flex-1">{task.title}</span>
          {children.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }}
              className="shrink-0 text-white/[0.7] hover:text-white"
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
        {isExpanded && children.map(child => (
          <TaskCard key={child.id} task={child} compact />
        ))}
      </div>
    );
  };

  // 空状态
  const EmptyState = ({ text }: { text: string }) => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-white/[0.3] text-xs">
        <div className="text-2xl mb-1">📭</div>
        <div>{text}</div>
      </div>
    </div>
  );

  // ========== 日程视图 ==========

  // 日程 - 日视图
  const ScheduleDayView = () => {
    const START_HOUR = 9;
    const END_HOUR = 24;
    const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
    const todayKey = getDateKeyUtil(selectedDate);
    const dayTasks = (tasksByDate[todayKey] || []).filter(t => !t.parentTaskId);

    const tasksByHour: Record<number, Task[]> = {};
    dayTasks.forEach(task => {
      if (task.dueDate) {
        const hour = new Date(task.dueDate).getHours();
        if (hour >= START_HOUR && hour < END_HOUR) {
          if (!tasksByHour[hour]) tasksByHour[hour] = [];
          tasksByHour[hour].push(task);
        }
      }
    });

    if (dayTasks.length === 0) return <EmptyState text="今日暂无任务" />;

    return (
      <div className="flex-1 overflow-auto">
        {hours.map(hour => {
          const ht = tasksByHour[hour] || [];
          return (
            <div key={hour} className="flex border-b border-white/[0.08] min-h-[32px]">
              <div className="w-10 shrink-0 py-1 text-right pr-2 text-[10px] text-white/[0.4] font-mono">
                {String(hour).padStart(2, "0")}
              </div>
              <div className="flex-1 flex flex-col gap-0.5 px-1 py-0.5">
                {ht.map(task => <TaskCard key={task.id} task={task} compact />)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 日程 - 周视图
  const ScheduleWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const today = new Date();

    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 gap-px bg-white/5">
          {days.map(day => {
            const key = getDateKeyUtil(day);
            const dayTasks = (tasksByDate[key] || []).filter(t => !t.parentTaskId);
            const isToday = isSameDay(day, today);

            return (
              <div key={key} className="bg-[var(--bg-inverse)]/50 min-h-[60px] flex flex-col">
                <div className={`text-center py-1 text-[10px] border-b border-white/8 ${isToday ? "text-[var(--accent)] font-bold" : "text-white/[0.5]"}`}>
                  {format(day, "E", { locale: zhCN })}
                  <div className={`text-sm ${isToday ? "text-[var(--accent)]" : "text-white/[0.7]"}`}>{getDate(day)}</div>
                </div>
                <div className="flex-1 flex flex-col gap-0.5 p-0.5 overflow-auto">
                  {dayTasks.map(task => <TaskCard key={task.id} task={task} compact />)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 日程 - 月视图
  const ScheduleMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const allDays = eachDayOfInterval({ start: calStart, end: calEnd });
    const today = new Date();
    const isCurrentMonth = isSameMonth(selectedDate, today);

    return (
      <div className="flex-1 overflow-auto">
        {/* 星期头 */}
        <div className="grid grid-cols-7 border-b border-white/[0.1]">
          {["一", "二", "三", "四", "五", "六", "日"].map(d => (
            <div key={d} className="text-center py-1 text-[10px] text-white/[0.4]">{d}</div>
          ))}
        </div>
        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-px bg-white/5">
          {allDays.map(day => {
            const key = getDateKeyUtil(day);
            const dayTasks = (tasksByDate[key] || []).filter(t => !t.parentTaskId);
            const isToday = isSameDay(day, today);
            const isCurrent = isSameMonth(day, selectedDate);

            return (
              <div key={key} className={`bg-[var(--bg-inverse)]/50 min-h-[48px] flex flex-col ${!isCurrent ? "opacity-30" : ""}`}>
                <div className={`text-center py-0.5 text-[10px] ${isToday ? "text-[var(--accent)] font-bold" : "text-white/[0.5]"}`}>
                  {getDate(day)}
                </div>
                <div className="flex-1 flex flex-col gap-0.5 px-0.5 overflow-hidden">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="rounded px-1 py-0 text-[8px] text-white truncate cursor-pointer"
                      style={getStatusStyle(task.status)}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[8px] text-white/[0.4] text-center">+{dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 日程 - 年视图
  const ScheduleYearView = () => {
    const yearStart = startOfYear(selectedDate);
    const yearEnd = endOfYear(selectedDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    const today = new Date();

    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-3 gap-2 p-2">
          {months.map((month, idx) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
            let taskCount = 0;
            let doneCount = 0;
            let inProgressCount = 0;
            days.forEach(day => {
              const key = getDateKeyUtil(day);
              const dt = (tasksByDate[key] || []).filter(t => !t.parentTaskId);
              taskCount += dt.length;
              doneCount += dt.filter(t => t.status === "done").length;
              inProgressCount += dt.filter(t => t.status === "in_progress").length;
            });
            const isCurrent = isSameMonth(month, today);

            return (
              <div
                key={idx}
                onClick={() => { setTimeRange("month"); setSelectedDate(month); }}
                className={`rounded-lg p-2 cursor-pointer transition-all hover:bg-white/10 ${isCurrent ? "bg-white/10 border border-[var(--accent)]/30" : "bg-white/5 border border-white/5"}`}
              >
                <div className={`text-[11px] font-medium mb-1 ${isCurrent ? "text-[var(--accent)]" : "text-white/[0.7]"}`}>
                  {format(month, "M月", { locale: zhCN })}
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/[0.4]">
                  {taskCount > 0 && <span>{taskCount}个任务</span>}
                  {inProgressCount > 0 && <span className="text-[var(--accent)]">·{inProgressCount}进行中</span>}
                  {doneCount > 0 && <span className="text-[var(--color-success)]">·{doneCount}完成</span>}
                  {taskCount === 0 && <span className="text-white/[0.2]">无任务</span>}
                </div>
                {/* 迷你进度条 */}
                {taskCount > 0 && (
                  <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--color-success)]/60" style={{ width: `${(doneCount / taskCount) * 100}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ========== 甘特图视图 ==========

  // 甘特图时间轴
  const ganttTimeAxis = useMemo(() => {
    switch (timeRange) {
      case "year": {
        const start = startOfYear(selectedDate);
        const end = endOfYear(selectedDate);
        const months = eachMonthOfInterval({ start, end });
        return {
          type: "year" as const,
          columns: months.map((m, i) => ({
            key: `m-${i}`,
            label: format(m, "M月", { locale: zhCN }),
            widthPercent: 100 / 12,
            start: m,
            end: endOfMonth(m),
          })),
        };
      }
      case "month": {
        const daysInMonth = getDaysInMonth(selectedDate);
        const decades = [
          { name: "上旬", start: 1, end: 10 },
          { name: "中旬", start: 11, end: 20 },
          { name: "下旬", start: 21, end: daysInMonth },
        ];
        return {
          type: "month" as const,
          columns: decades.map(d => ({
            key: `d-${d.name}`,
            label: d.name,
            widthPercent: (d.end - d.start + 1) / daysInMonth * 100,
            start: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d.start),
            end: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), d.end, 23, 59, 59),
          })),
        };
      }
      case "week": {
        const start = addDays(selectedDate, -selectedDate.getDay() + 1);
        const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
        return {
          type: "week" as const,
          columns: days.map((day) => ({
            key: `w-${format(day, "yyyy-MM-dd")}`,
            label: format(day, "E", { locale: zhCN }),
            widthPercent: 100 / 7,
            date: day,
          })),
        };
      }
      case "day": {
        const START_HOUR = 9;
        const TOTAL_HOURS = 15;
        const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
        return {
          type: "day" as const,
          columns: hours.map(h => ({
            key: `h-${h}`,
            label: `${h}`,
            widthPercent: 100 / TOTAL_HOURS,
            hour: h,
          })),
        };
      }
    }
  }, [timeRange, selectedDate]);

  // 甘特图任务位置计算
  const getGanttPosition = (task: Task) => {
    if (!task.dueDate) return null;
    const dd = new Date(task.dueDate);

    switch (ganttTimeAxis.type) {
      case "year": {
        const idx = ganttTimeAxis.columns.findIndex(col => isSameMonth(dd, col.start));
        if (idx === -1) return null;
        const col = ganttTimeAxis.columns[idx];
        const dim = getDaysInMonth(col.start);
        const dom = getDate(dd);
        const offset = ((dom - 1) / dim) * col.widthPercent;
        const left = ganttTimeAxis.columns.slice(0, idx).reduce((s, c) => s + c.widthPercent, 0) + offset;
        return { leftPercent: left, widthPercent: Math.max(2, 100 / dim) };
      }
      case "month": {
        const idx = ganttTimeAxis.columns.findIndex(col => dd >= col.start && dd <= col.end);
        if (idx === -1) return null;
        const col = ganttTimeAxis.columns[idx];
        const did = differenceInDays(col.end, col.start) + 1;
        const dod = differenceInDays(dd, col.start) + 1;
        const offset = ((dod - 1) / did) * col.widthPercent;
        const left = ganttTimeAxis.columns.slice(0, idx).reduce((s, c) => s + c.widthPercent, 0) + offset;
        return { leftPercent: left, widthPercent: Math.max(2, col.widthPercent / did) };
      }
      case "week": {
        const idx = ganttTimeAxis.columns.findIndex(col => col.date && isSameDay(dd, col.date));
        if (idx === -1) return null;
        return { leftPercent: idx * (100 / 7) + 1, widthPercent: 100 / 7 - 2 };
      }
      case "day": {
        const hour = dd.getHours();
        const minute = dd.getMinutes();
        if (hour < 9) return null;
        const TOTAL_HOURS = 15;
        const left = (hour - 9 + minute / 60) / TOTAL_HOURS * 100;
        return { leftPercent: left, widthPercent: Math.max(3, 100 / TOTAL_HOURS * 0.7) };
      }
    }
  };

  // 甘特视图
  const GanttChartView = () => {
    const parentTasks = Object.values(parentMap).filter(t => t.dueDate);
    if (parentTasks.length === 0) return <EmptyState text="暂无甘特图数据" />;

    return (
      <div className="flex-1 overflow-auto">
        {/* 时间轴头部 */}
        <div className="flex border-b border-white/[0.15] bg-white/5 sticky top-0 z-10">
          {ganttTimeAxis.columns.map(col => (
            <div
              key={col.key}
              className="text-center py-1 text-[10px] text-white/[0.5] border-r border-white/5 last:border-r-0"
              style={{ width: `${col.widthPercent}%` }}
            >
              {col.label}
            </div>
          ))}
        </div>
        {/* 任务条 */}
        <div className="relative">
          {/* 网格线 */}
          <div className="absolute inset-0 flex pointer-events-none">
            {ganttTimeAxis.columns.map(col => (
              <div key={`g-${col.key}`} className="border-r border-white/5 h-full" style={{ width: `${col.widthPercent}%` }} />
            ))}
          </div>
          {/* 任务 */}
          {parentTasks.map(task => {
            const children = childMap[task.id] || [];
            const isExpanded = expandedTasks.has(task.id);
            const pos = getGanttPosition(task);
            const style = getStatusStyle(task.status);

            return (
              <div key={task.id}>
                <div className="h-7 border-b border-white/5 relative">
                  {pos && (
                    <div
                      onClick={() => onTaskClick(task)}
                      className="absolute top-0.5 h-6 rounded px-1.5 flex items-center text-[10px] text-white cursor-pointer hover:brightness-110 transition-all"
                      style={{ left: `${pos.leftPercent}%`, width: `${pos.widthPercent}%`, ...style, minWidth: "40px" }}
                    >
                      <span className="truncate">{task.title}</span>
                      {children.length > 0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpand(task.id); }}
                          className="shrink-0 ml-0.5 text-white/[0.7]"
                        >
                          <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {isExpanded && children.map(child => {
                  const cpos = getGanttPosition(child);
                  const cstyle = getStatusStyle(child.status);
                  return (
                    <div key={child.id} className="h-6 border-b border-white/5 relative">
                      {cpos && (
                        <div
                          onClick={() => onTaskClick(child)}
                          className="absolute top-0.5 h-5 rounded px-1 flex items-center text-[9px] text-white cursor-pointer hover:brightness-110 transition-all"
                          style={{ left: `${cpos.leftPercent}%`, width: `${cpos.widthPercent * 0.8}%`, ...cstyle, minWidth: "30px" }}
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
    );
  };

  // 渲染当前视图内容
  const renderContent = () => {
    if (viewType === "schedule") {
      switch (timeRange) {
        case "day": return <ScheduleDayView />;
        case "week": return <ScheduleWeekView />;
        case "month": return <ScheduleMonthView />;
        case "year": return <ScheduleYearView />;
      }
    } else {
      return <GanttChartView />;
    }
  };

  // 统计当前视图的任务数
  const getTaskCount = () => {
    switch (timeRange) {
      case "day": {
        const key = getDateKeyUtil(selectedDate);
        return (tasksByDate[key] || []).filter(t => !t.parentTaskId).length;
      }
      case "week": {
        const ws = startOfWeek(selectedDate);
        let count = 0;
        for (let i = 0; i < 7; i++) {
          const key = getDateKeyUtil(addDays(ws, i));
          count += (tasksByDate[key] || []).filter(t => !t.parentTaskId).length;
        }
        return count;
      }
      case "month": {
        const ms = startOfMonth(selectedDate);
        const me = endOfMonth(selectedDate);
        const days = eachDayOfInterval({ start: ms, end: me });
        let count = 0;
        days.forEach(d => {
          const key = getDateKeyUtil(d);
          count += (tasksByDate[key] || []).filter(t => !t.parentTaskId).length;
        });
        return count;
      }
      case "year": {
        const ys = startOfYear(selectedDate);
        const ye = endOfYear(selectedDate);
        const months = eachMonthOfInterval({ start: ys, end: ye });
        let count = 0;
        months.forEach(m => {
          const ms2 = startOfMonth(m);
          const me2 = endOfMonth(m);
          const days = eachDayOfInterval({ start: ms2, end: me2 });
          days.forEach(d => {
            const key = getDateKeyUtil(d);
            count += (tasksByDate[key] || []).filter(t => !t.parentTaskId).length;
          });
        });
        return count;
      }
    }
  };

  // ========== 最小化状态 ==========
  if (isMinimized) {
    return (
      <div
        ref={containerRef}
        className="fixed z-50 cursor-move"
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <div className="bg-[var(--bg-inverse)]/80 backdrop-blur-md rounded-lg shadow-2xl border border-white/20 px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-white/[0.8]">📋 任务视图</span>
          <button onClick={() => setIsMinimized(false)} className="text-white/[0.6] hover:text-white text-xs">▲</button>
          <button onClick={onClose} className="text-white/[0.6] hover:text-white text-xs">✕</button>
        </div>
      </div>
    );
  }

  // ========== 完整视图 ==========
  return (
    <div
      ref={containerRef}
      className="fixed z-50 flex flex-col"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      <div className="flex-1 bg-gray-950/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/[0.15] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div
          ref={headerRef}
          className="flex items-center justify-between px-3 py-1.5 bg-white/8 border-b border-white/[0.1] cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-white/[0.9]">📋 悬浮视图</span>
            <span className="text-[9px] text-white/[0.3]">{getTaskCount()}个任务</span>
          </div>
          <div className="flex items-center gap-1">
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as ViewType)}
              className="text-[10px] bg-white/10 text-white/[0.8] rounded px-1 py-0.5 border-none outline-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="schedule" className="bg-[var(--bg-inverse)]">日程</option>
              <option value="gantt" className="bg-[var(--bg-inverse)]">甘特</option>
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="text-[10px] bg-white/10 text-white/[0.8] rounded px-1 py-0.5 border-none outline-none cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="day" className="bg-[var(--bg-inverse)]">日</option>
              <option value="week" className="bg-[var(--bg-inverse)]">周</option>
              <option value="month" className="bg-[var(--bg-inverse)]">月</option>
              <option value="year" className="bg-[var(--bg-inverse)]">年</option>
            </select>
            <button onClick={() => setIsMinimized(true)} className="text-white/[0.5] hover:text-white text-xs px-0.5">▼</button>
            <button onClick={onClose} className="text-white/[0.5] hover:text-white text-xs px-0.5">✕</button>
          </div>
        </div>

        {/* 导航栏 */}
        <div className="flex items-center justify-between px-3 py-1 bg-white/4 border-b border-white/[0.08]">
          <button onClick={navigatePrev} className="text-white/[0.5] hover:text-white text-xs p-0.5">◀</button>
          <span className="text-[11px] text-white/[0.8] font-medium">{getTitleText()}</span>
          <button onClick={navigateNext} className="text-white/[0.5] hover:text-white text-xs p-0.5">▶</button>
          <button
            onClick={goToday}
            className="text-[10px] text-[var(--accent)]/80 hover:text-[var(--accent)] px-1.5 py-0.5 rounded bg-[var(--accent-muted)] transition-colors"
          >
            今天
          </button>
        </div>

        {/* 视图内容 */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* 图例 */}
        <div className="flex items-center justify-center gap-3 px-2 py-1 bg-white/4 border-t border-white/[0.08] text-[9px]">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS.todo.bg }} />
            <span className="text-white/[0.4]">待开始</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS.in_progress.bg }} />
            <span className="text-white/[0.4]">进行中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-sm opacity-70" style={{ backgroundColor: STATUS_COLORS.done.bg }} />
            <span className="text-white/[0.4]">已完成</span>
          </div>
        </div>
      </div>

      {/* 调整大小手柄 */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize"
        onMouseDown={handleResizeStart}
        style={{ background: "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.2) 50%)" }}
      />
    </div>
  );
}
