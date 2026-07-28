"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from "react";
import SidebarNav from "@/components/SidebarNav";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import TaskCard from "@/components/TaskCard";
import { useTasks } from "@/components/TaskContext";
import toast from "react-hot-toast";

// Heavy modals & views are loaded on-demand to keep the initial bundle
// small. The first render only ships SidebarNav + TaskCard + the small
// scheduler logic — everything else streams in when the user opens the
// corresponding modal or switches to that view.
const TaskSplitModal = dynamic(
  () => import("@/components/TaskSplitModal"),
  { ssr: false, loading: () => null },
);
const DailyWorkSummarizeModal = dynamic(
  () => import("@/components/DailyWorkSummarizeModal"),
  { ssr: false, loading: () => null },
);
const AIBatchCreateModal = dynamic(
  () => import("@/components/AIBatchCreateModal"),
  { ssr: false, loading: () => null },
);
const GanttView = dynamic(
  () => import("@/components/GanttView"),
  { ssr: false, loading: () => null },
);
const FloatingView = dynamic(
  () => import("@/components/FloatingView"),
  { ssr: false, loading: () => null },
);
// View components extracted from this file into individual modules under
// @/components/views/ to reduce page complexity from ~1830 lines.
import TaskScheduleView from "@/components/views/TaskScheduleView";
import TaskListView from "@/components/views/TaskListView";
import TaskKanbanView from "@/components/views/TaskKanbanView";
import TaskTimelineView from "@/components/views/TaskTimelineView";
import TaskDayView from "@/components/views/TaskDayView";
import TaskWeekView from "@/components/views/TaskWeekView";
import TaskMonthView from "@/components/views/TaskMonthView";
import TaskYearView from "@/components/views/TaskYearView";
// 由 foundation-contract 任务迁移: these helpers used to live as
// local functions at the top of this file. They are now imported from
// `@/lib/task-helpers` so TaskCard and the page agree on the same
// implementation. The call sites below are unchanged.
import { timeToHours, formatDueDate, getTaskColor, getDateKey } from "@/lib/task-helpers";
import { cn } from "@/lib/utils";

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

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "待开始",
  in_progress: "进行中",
  done: "已完成",
};

const SOP_COLOR = "#4b5563";
const PROJECT_COLORS = ["#374151", "#4b5563", "#6b7280", "#52525b", "#57534e", "#44403c"];
const CHILD_OPACITY = "CC";

function TasksPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, loading, refreshTasks, updateTask } = useTasks();
  const initialView = (searchParams.get("view") as "schedule" | "list" | "kanban" | "timeline" | "gantt") || "schedule";
  const [viewMode, setViewMode] = useState<"schedule" | "list" | "kanban" | "timeline" | "gantt">(initialView);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month" | "year">("day");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // URL view 参数变化时同步 viewMode
  useEffect(() => {
    const viewParam = searchParams.get("view") as "schedule" | "list" | "kanban" | "timeline" | "gantt";
    if (viewParam && viewParam !== viewMode) {
      setViewMode(viewParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleViewChange(newView: "schedule" | "list" | "kanban" | "timeline" | "gantt") {
    setViewMode(newView);
    // 时间轴视图强制切换到日视图
    if (newView === "timeline") {
      setTimeRange("day");
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", newView);
    router.replace(`/tasks?${params.toString()}`, { scroll: false });
  }
  const [searchQuery, setSearchQuery] = useState("");
  const [showFloatingView, setShowFloatingView] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState<"sop" | "specific" | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProjectId, setNewTaskProjectId] = useState("");
  const [projectList, setProjectList] = useState<Array<{ id: string; name: string }>>([]);
  const [createTaskLoading, setCreateTaskLoading] = useState(false);

  const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const startOfWeek = (d: Date): Date => { const m = startOfDay(d); return new Date(m.setDate(m.getDate() - m.getDay() + 1)); };
  const startOfMonth = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), 1);
  const startOfYear = (d: Date): Date => new Date(d.getFullYear(), 0, 1);

  const getStartDate = useCallback((): Date => {
    switch (timeRange) {
      case "day": return startOfDay(selectedDate);
      case "week": return startOfWeek(selectedDate);
      case "month": return startOfMonth(selectedDate);
      case "year": return startOfYear(selectedDate);
      default: return startOfDay(selectedDate);
    }
  }, [timeRange, selectedDate]);

  const getDaysToShow = useCallback((): Date[] => {
    const start = getStartDate();
    const days: Date[] = [];
    let count: number;
    switch (timeRange) {
      case "day": count = 1; break;
      case "week": count = 7; break;
      case "month": count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate(); break;
      case "year": count = 365; break;
      default: count = 7;
    }
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [getStartDate, timeRange]);

  useEffect(() => {
    refreshTasks();
  }, []);

  // 加载项目列表（用于新建任务）
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProjectList(data.map((p: any) => ({ id: p.id, name: p.name })));
          if (data.length > 0) setNewTaskProjectId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function handleCreateTask(taskType: "sop" | "specific") {
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    setCreateTaskLoading(true);
    try {
      const projectId = newTaskProjectId || projectList[0]?.id;
      if (!projectId) {
        toast.error("请先创建一个项目");
        return;
      }

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: trimmed,
          description: taskType === "sop"
            ? "SOP工作流 - 常态化任务"
            : null,
          isRecurring: taskType === "sop",
          status: "todo",
        }),
      });

      if (res.ok) {
        toast.success(taskType === "sop" ? "SOP任务已创建" : "特定任务已创建");
        setNewTaskTitle("");
        setShowCreateForm(null);
        refreshTasks();
      } else {
        toast.error("创建失败");
      }
    } catch {
      toast.error("创建失败");
    } finally {
      setCreateTaskLoading(false);
    }
  }

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) || false));
    }
    return filtered;
  }, [tasks, searchQuery]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    const days = getDaysToShow();
    days.forEach(d => map[getDateKey(d)] = []);
    filteredTasks.forEach(task => {
      if (!task.dueDate) return;
      const key = getDateKey(new Date(task.dueDate));
      if (map[key]) map[key].push(task);
    });
    return map;
  }, [filteredTasks, getDaysToShow]);

  const tasksWithParent = useMemo(() => {
    const parentMap: Record<string, Task> = {};
    const childMap: Record<string, Task[]> = {};
    filteredTasks.forEach(t => {
      if (t.parentTaskId) {
        if (!childMap[t.parentTaskId]) childMap[t.parentTaskId] = [];
        childMap[t.parentTaskId].push(t);
      } else {
        parentMap[t.id] = t;
      }
    });
    return { parentMap, childMap };
  }, [filteredTasks]);

  const toggleCollapse = (p: string) => {
    setCollapsedProjects(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleToggleComplete = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = task.status === "done" ? "todo" : (task.status === "todo" ? "in_progress" : "done");
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      updateTask(taskId, {
        status: newStatus,
        completedAt: updated.completedAt || null
      });
    }
  };

  async function handleBatchCreateConfirm(projectId: string, tasks: { title: string; description: string; subtasks: { title: string; description: string }[] }[]) {
    try {
      for (const task of tasks) {
        if (!task.title.trim()) continue;
        const taskRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: task.title.trim(),
            description: task.description || null,
          }),
        });
        if (!taskRes.ok) continue;
        const createdTask = await taskRes.json();
        if (task.subtasks && task.subtasks.length > 0) {
          for (const sub of task.subtasks) {
            if (!sub.title.trim()) continue;
            await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId,
                parentTaskId: createdTask.id,
                title: sub.title.trim(),
                description: sub.description || null,
              }),
            });
          }
        }
      }
      const totalTasks = tasks.reduce((sum, t) => sum + 1 + (t.subtasks?.filter(s => s.title).length || 0), 0);
      toast.success(`已创建 ${totalTasks} 个任务`);
      refreshTasks();
    } catch {
      toast.error("创建任务失败");
    }
  }

  const navigatePrev = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      switch (timeRange) {
        case "day": d.setDate(d.getDate() - 1); break;
        case "week": d.setDate(d.getDate() - 7); break;
        case "month": d.setMonth(d.getMonth() - 1); break;
        case "year": d.setFullYear(d.getFullYear() - 1); break;
      }
      return d;
    });
  };

  const navigateNext = () => {
    setSelectedDate(prev => {
      const d = new Date(prev);
      switch (timeRange) {
        case "day": d.setDate(d.getDate() + 1); break;
        case "week": d.setDate(d.getDate() + 7); break;
        case "month": d.setMonth(d.getMonth() + 1); break;
        case "year": d.setFullYear(d.getFullYear() + 1); break;
      }
      return d;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const getTitleText = (): string => {
    const d = selectedDate;
    switch (timeRange) {
      case "day":
        const today = new Date();
        if (getDateKey(d) === getDateKey(today)) return "今天";
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        if (getDateKey(d) === getDateKey(tomorrow)) return "明天";
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
      case "week":
        const sw = startOfWeek(d);
        const ew = new Date(sw); ew.setDate(ew.getDate() + 6);
        return `${sw.getMonth() + 1}月${sw.getDate()}日 - ${ew.getMonth() + 1}月${ew.getDate()}日`;
      case "month":
        return `${d.getFullYear()}年${d.getMonth() + 1}月`;
      case "year":
        return `${d.getFullYear()}年`;
      default:
        return "";
    }
  };

  // handleDateSelect: used by MonthView and YearView to drill down into day view
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setTimeRange("day");
  };

  // TaskDetailModal — kept in-page because it directly depends on page-level
  // state (selectedTask, updateTask) and is tightly coupled to the header UI.
  function TaskDetailModal() {
    if (!selectedTask) return null;
    const colors = getTaskColor(selectedTask);
    const [editStartTime, setEditStartTime] = useState(selectedTask.startTime || "");
    const [editEndTime, setEditEndTime] = useState(selectedTask.endTime || "");
    const [editDueDate, setEditDueDate] = useState(
    selectedTask.dueDate ? (() => {
      const d = new Date(selectedTask.dueDate);
      const dueStr = String(selectedTask.dueDate);
      if (dueStr.includes("T")) {
        return dueStr.slice(0, 16);
      }
      if (dueStr.includes(" ")) {
        return dueStr.replace(" ", "T");
      }
      return d.toISOString().slice(0, 16);
    })() : ""
  );

    async function saveTimeChanges() {
      try {
        const dueDateValue = editDueDate ? editDueDate.replace("T", " ") : null;
        await fetch(`/api/tasks/${selectedTask!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startTime: editStartTime || null,
            endTime: editEndTime || null,
            dueDate: dueDateValue,
          }),
        });
        updateTask(selectedTask!.id, {
          ...selectedTask!,
          startTime: editStartTime || null,
          endTime: editEndTime || null,
          dueDate: editDueDate ? new Date(editDueDate) : null,
        });
        toast.success("已更新");
      } catch {
        toast.error("保存失败");
      }
    }

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedTask(null)}>
        <div className="rounded-xl w-full max-w-md shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} onClick={e => e.stopPropagation()}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.bg }} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>任务详情</h2>
            </div>
            <button onClick={() => setSelectedTask(null)} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>标题</label>
              <div style={{ color: 'var(--text-primary)' }}>{selectedTask.title}</div>
            </div>
            {selectedTask.description && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>描述</label>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedTask.description}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>状态</label>
                <span className="px-2 py-1 rounded text-xs bg-[var(--bg-muted-hover)]" style={{ color: 'var(--text-inverse)' }}>
                  {STATUS_LABELS[selectedTask.status]}
                </span>
              </div>
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>优先级</label>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>P{selectedTask.priority}</span>
              </div>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>截止时间</label>
              <input
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="w-full rounded-lg px-2 py-1.5 text-sm outline-none"
                style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>
            {selectedTask.completedAt && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>完成时间</label>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(selectedTask.completedAt).toLocaleString("zh-CN")}
                </p>
              </div>
            )}
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>时间</label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  className="rounded-lg px-2 py-1 text-sm outline-none"
                  style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>至</span>
                <input
                  type="time"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  className="rounded-lg px-2 py-1 text-sm outline-none"
                  style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
                <button
                  onClick={saveTimeChanges}
                  className="px-2 py-1 rounded text-xs transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  保存
                </button>
              </div>
            </div>
            {selectedTask.project && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>所属项目</label>
                <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: colors.bg, color: 'var(--text-inverse)' }}>
                  {selectedTask.project}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border-default)' }}>
            {selectedTask.projectId && (
              <button
                onClick={() => { router.push(`/projects/${selectedTask.projectId}`); }}
                className="px-4 py-2 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                查看项目
              </button>
            )}
            <TaskSplitModal taskId={selectedTask.id} taskTitle={selectedTask.title} onTaskSplit={refreshTasks} />
            <button
              onClick={() => setSelectedTask(null)}
              className="px-4 py-2 text-sm rounded transition-colors"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  function CreateTaskModal({
    taskType,
    title,
    onTitleChange,
    projectId,
    onProjectIdChange,
    projectList,
    loading,
    onCreate,
    onClose,
  }: {
    taskType: "sop" | "specific";
    title: string;
    onTitleChange: (v: string) => void;
    projectId: string;
    onProjectIdChange: (v: string) => void;
    projectList: Array<{ id: string; name: string }>;
    loading: boolean;
    onCreate: () => void;
    onClose: () => void;
  }) {
    const isSop = taskType === "sop";
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="rounded-xl w-full max-w-sm shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }} onClick={e => e.stopPropagation()}>
          <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", isSop ? "bg-[var(--color-success)]" : "bg-[var(--color-info)]")} />
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {isSop ? "新建 SOP 任务" : "新建特定任务"}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-4">
            {isSop && (
              <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-default)', color: 'var(--color-success)' }}>
                <p className="font-medium mb-1">SOP 任务特点</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>常态化重复任务，会自动标记为定期执行</li>
                  <li>适合日常工作流、晨会、周报、代码审查等</li>
                  <li>可在任务设置中配置重复规则</li>
                </ul>
              </div>
            )}
            {!isSop && (
              <div className="p-3 rounded-lg text-xs" style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-default)', color: 'var(--color-info)' }}>
                <p className="font-medium mb-1">特定任务特点</p>
                <ul className="space-y-0.5 list-disc list-inside">
                  <li>一次性特定目标的任务</li>
                  <li>归属于具体项目，用于追踪专项工作</li>
                  <li>支持设定截止日期、优先级、拆分子任务</li>
                </ul>
              </div>
            )}

            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>任务名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && title.trim()) onCreate(); }}
                placeholder={isSop ? "如：每日晨会、代码审查..." : "输入任务名称..."}
                autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              />
            </div>

            {projectList.length > 0 && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>所属项目</label>
                <select
                  value={projectId}
                  onChange={(e) => onProjectIdChange(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%221.5%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                >
                  {projectList.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="p-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--border-default)' }}>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded transition-colors"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-primary)' }}
            >
              取消
            </button>
            <button
              onClick={onCreate}
              disabled={!title.trim() || loading}
              className={cn(
                "px-4 py-2 text-sm rounded transition-colors disabled:opacity-50",
                isSop ? "bg-[var(--color-success)] text-[var(--text-inverse)] hover:opacity-90" : "bg-[var(--color-info)] text-[var(--text-inverse)] hover:opacity-90"
              )}
            >
              {loading ? "创建中..." : `创建${isSop ? "SOP" : ""}任务`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const viewOptions = [
    { value: "schedule", label: "日程", icon: "M8 7V3m8 4V3m-9 8h10M3 12a9 9 0 1118 0 9 9 0 01-18 0z" },
    { value: "list", label: "列表", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
    { value: "kanban", label: "看板", icon: "M9 17V7m6 10V7M3 7h4m10 0h4M5 7v10m7-10v10" },
    { value: "timeline", label: "时间轴", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { value: "gantt", label: "甘特图", icon: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" },
  ];

  const timeRangeOptions = [
    { value: "year", label: "年" },
    { value: "month", label: "月" },
    { value: "week", label: "周" },
    { value: "day", label: "日" },
  ];

  return (
    <div className="flex h-dvh" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      <SidebarNav className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-3 sm:px-4 shrink-0 gap-2" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h1 className="text-base sm:text-lg font-bold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>任务管理</h1>
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="搜索任务..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-36 md:w-48 lg:w-64 rounded-lg px-3 py-1.5 pl-9 text-sm placeholder-[var(--text-muted)] focus:outline-none"
                style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-muted)', color: 'var(--text-primary)' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* 新建任务下拉 - 始终可见 */}
            <div className="relative" data-tour="tasks-create-btn">
              <button
                onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-[var(--accent-hover)]" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">新建任务</span>
              </button>
              {showCreateDropdown && (
                <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg py-1 z-10" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}
                  onMouseLeave={() => setShowCreateDropdown(false)}>
                  <button
                    onClick={() => { setShowCreateDropdown(false); setShowCreateForm("specific"); }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-primary)' }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--color-info)]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                    </svg>
                    新建特定任务
                  </button>
                  <button
                    onClick={() => { setShowCreateDropdown(false); setShowCreateForm("sop"); }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-surface-hover)]" style={{ color: 'var(--text-primary)' }}
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--color-success)]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    新建SOP任务
                  </button>
                </div>
              )}
            </div>
            {/* 新建模板 - SOP 流程模板 */}
            <Link
              href="/templates/new"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-[var(--bg-muted-hover)]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
              title="新建SOP模板"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              新建模板
            </Link>
            {/* 今日总结 - sm以上显示文字 */}
            <button
              onClick={async () => {
                await refreshTasks();
                setShowSummarizeModal(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-[var(--bg-muted-hover)]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
              title="今日总结"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">今日总结</span>
            </button>
            {/* AI 拆分 - md以上显示 */}
            <button
              onClick={() => setShowBatchCreateModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all hover:bg-[var(--bg-muted-hover)]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI 拆分
            </button>
            {/* 悬浮视图 */}
            <button
              onClick={() => setShowFloatingView(!showFloatingView)}
              className={`hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                showFloatingView
                  ? ""
                  : "hover:bg-[var(--bg-muted-hover)]"
              }`}
              style={
                showFloatingView
                  ? { backgroundColor: 'var(--color-info)', opacity: 0.15, color: 'var(--color-info)' }
                  : { backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }
              }
              title="悬浮视图"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
              </svg>
              <span className="hidden lg:inline">{showFloatingView ? "关闭悬浮" : "悬浮视图"}</span>
            </button>
            <div className="hidden md:flex p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-muted)' }} data-tour="tasks-view-switcher">
              {viewOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleViewChange(option.value as any)}
                  className={`px-2 lg:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 flex items-center gap-1 lg:gap-1.5 ${
                    viewMode === option.value
                      ? "shadow-sm"
                      : ""
                  }`}
                  style={
                    viewMode === option.value
                      ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                  </svg>
                  <span className="hidden lg:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2">
              <button onClick={navigatePrev} className="p-2 rounded-full transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 className="text-sm font-bold min-w-[180px] text-center" style={{ color: 'var(--text-primary)' }}>{getTitleText()}</h2>
              <button onClick={navigateNext} className="p-2 rounded-full transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--text-muted)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <button onClick={goToToday} className="ml-2 px-3 py-1 text-xs rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                今天
              </button>
            </div>

            <div className="flex items-center gap-2">
              {(viewMode === "schedule") && (
              <div className="flex p-0.5 rounded-lg" style={{ backgroundColor: 'var(--bg-muted)' }}>
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as any)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                      timeRange === option.value
                        ? "shadow-sm"
                        : ""
                    }`}
                    style={
                      timeRange === option.value
                        ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              )}

              <div className="md:hidden flex items-center gap-1">
                {viewOptions.slice(0, 3).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleViewChange(option.value as any)}
                    className={`p-2 rounded-lg ${
                      viewMode === option.value ? "shadow-sm" : ""
                    }`}
                    style={
                      viewMode === option.value
                        ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={option.icon} />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div style={{ color: 'var(--text-muted)' }}>加载中...</div>
            </div>
          ) : (
            <>
              {viewMode === "schedule" && (
                <TaskScheduleView
                  timeRange={timeRange}
                  days={getDaysToShow()}
                  tasksByDate={tasksByDate}
                  childMap={tasksWithParent.childMap}
                  filteredTasks={filteredTasks}
                  onTaskClick={handleTaskClick}
                  onDateClick={(date, range) => { setSelectedDate(date); setTimeRange(range as any); }}
                  year={selectedDate.getFullYear()}
                />
              )}
              {viewMode === "list" && (
                <div data-tour="tasks-list">
                  <TaskListView
                    filteredTasks={filteredTasks}
                    childMap={tasksWithParent.childMap}
                    onTaskClick={handleTaskClick}
                  />
                </div>
              )}
              {viewMode === "kanban" && (
                <TaskKanbanView
                  filteredTasks={filteredTasks}
                  childMap={tasksWithParent.childMap}
                  onTaskClick={handleTaskClick}
                />
              )}
              {viewMode === "timeline" && (
                <TaskTimelineView
                  days={getDaysToShow()}
                  tasksByDate={tasksByDate}
                  filteredTasks={filteredTasks}
                  childMap={tasksWithParent.childMap}
                  onTaskClick={handleTaskClick}
                />
              )}
              {viewMode === "gantt" && (
                <GanttView
                  tasks={filteredTasks as any}
                  onTaskClick={handleTaskClick as any}
                  getTaskColor={getTaskColor as any}
                  viewType={timeRange}
                  onViewTypeChange={setTimeRange}
                />
              )}
            </>
          )}
        </div>
      </div>

      <MobileNav activeItem="tasks" className="md:hidden" />
      <TaskDetailModal />
      {/* 新建任务模态框 */}
      {showCreateForm && (
        <CreateTaskModal
          taskType={showCreateForm}
          title={newTaskTitle}
          onTitleChange={setNewTaskTitle}
          projectId={newTaskProjectId}
          onProjectIdChange={setNewTaskProjectId}
          projectList={projectList}
          loading={createTaskLoading}
          onCreate={() => handleCreateTask(showCreateForm)}
          onClose={() => { setShowCreateForm(null); setNewTaskTitle(""); setShowCreateDropdown(false); }}
        />
      )}
      {showSummarizeModal && (
        <DailyWorkSummarizeModal
          tasks={tasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            status: t.status,
            project: t.project || undefined,
            dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
          }))}
          onClose={() => setShowSummarizeModal(false)}
        />
      )}
      {showBatchCreateModal && (
        <AIBatchCreateModal
          onClose={() => setShowBatchCreateModal(false)}
          onConfirm={handleBatchCreateConfirm}
        />
      )}

      {/* 悬浮视图 */}
      {showFloatingView && (
        <FloatingView
          tasks={filteredTasks as any}
          onTaskClick={handleTaskClick as any}
          getTaskColor={getTaskColor as any}
          onClose={() => setShowFloatingView(false)}
        />
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={
      <div className="flex h-dvh items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </div>
    }>
      <TasksPageInner />
    </Suspense>
  );
}
