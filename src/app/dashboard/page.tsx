"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import EnhancedStatsCard from "@/components/EnhancedStatsCard";
import TaskChart from "@/components/charts/TaskChart";
import EmptyState from "@/components/EmptyState";
import { SkeletonCard, SkeletonStatsCard } from "@/components/Skeleton";
import { Modal } from "@/components/ui/Modal";
import WeeklyReport, { type WeeklyReportData } from "@/components/WeeklyReport";
import { useTasks } from "@/components/TaskContext";
import toast from "react-hot-toast";
import { detectWarnings } from "@/lib/warnings/detector";
import type { Warning } from "@/lib/warnings/detector";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  currentStage: string | null;
  progressStatus: string; // in_progress | pending | completed
  createdAt: string;
  taskCount: number;
  completedCount: number;
  color?: string;
}

interface Task {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: string;
  project: string | null;
  valueGoal?: string;
}

interface PushedGoal {
  id: string;
  goal: string;
  reason?: string;
  source: "ai" | "custom";
  period: "tomorrow" | "week" | "month" | "year";
  pushedAt: number;
}

const STATUS_TABS = ["全部", "进行中", "待推进", "已完成"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const STATUS_KEY_MAP: Record<string, string | null> = {
  "全部": null,
  "进行中": "in_progress",
  "待推进": "pending",
  "已完成": "completed",
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>("全部");
  const [search, setSearch] = useState("");
  const [tabAnimating, setTabAnimating] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [dismissedWarningIds, setDismissedWarningIds] = useState<Set<string>>(new Set());
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData | null>(null);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [retrospectives, setRetrospectives] = useState<any[]>([]);
  const [pushedGoals, setPushedGoals] = useState<PushedGoal[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // 加载已推送的下阶段目标
  const loadPushedGoals = useCallback(() => {
    try {
      const raw = localStorage.getItem("flowsync_pushed_goals");
      if (raw) {
        setPushedGoals(JSON.parse(raw));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadPushedGoals();
    window.addEventListener("pushed-goals-updated", loadPushedGoals);
    return () => window.removeEventListener("pushed-goals-updated", loadPushedGoals);
  }, [loadPushedGoals]);

  const { tasks: contextTasks, loading: tasksLoading } = useTasks();

  useEffect(() => {
    const mapped = contextTasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status as "todo" | "in_progress" | "done",
      priority: (t.priority === 1 ? "high" : t.priority === 3 ? "low" : "medium") as "low" | "medium" | "high" | "urgent",
      dueDate: t.dueDate,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
      createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      project: t.project,
      valueGoal: (t as any).valueGoal,
    }));
    setTasks(mapped);
  }, [contextTasks]);

  useEffect(() => {
    if (tasks.length === 0 && projects.length === 0) return;

    const taskDates = tasks
      .map((t) => t.createdAt ? new Date(t.createdAt).getTime() : 0)
      .filter((ts) => ts > 0);
    const lastTaskMs = taskDates.length > 0 ? Math.max(...taskDates) : 0;
    const daysSinceLastTask = lastTaskMs
      ? Math.floor((Date.now() - lastTaskMs) / (1000 * 60 * 60 * 24))
      : 999;

    const retroDates = retrospectives
      .map((r: any) => r.date ? new Date(r.date).getTime() : 0)
      .filter((ts: number) => ts > 0);
    const lastRetroMs = retroDates.length > 0 ? Math.max(...retroDates) : 0;
    const daysSinceLastRetro = lastRetroMs
      ? Math.floor((Date.now() - lastRetroMs) / (1000 * 60 * 60 * 24))
      : 999;

    const detected = detectWarnings({
      tasks: tasks.map((t) => ({
        status: t.status,
        valueGoal: t.valueGoal,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      })),
      projects: projects.map((p) => ({
        id: p.id,
      })),
      retrospectives: retrospectives as Array<{ id: string }>,
      daysSinceLastTask,
      daysSinceLastRetro,
      activeMethodCount: 0,
    });

    setWarnings(detected);
  }, [tasks, projects, retrospectives]);

  async function fetchData() {
    try {
      const [projectsRes, retroRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/career/retrospective?limit=30").catch(() => null),
      ]);

      if (!projectsRes.ok) {
        const err1 = await projectsRes.json();
        const errorMsg = err1?.error || "数据库连接失败";
        if (errorMsg.includes("database") || errorMsg.includes("SQLITE_ERROR")) {
          setDbError(errorMsg);
        } else {
          throw new Error(errorMsg);
        }
        setLoading(false);
        return;
      }

      const projectsData = await projectsRes.json();
      setProjects(Array.isArray(projectsData) ? projectsData : []);

      const retros = retroRes?.ok ? await retroRes.json() : [];
      setRetrospectives(retros);
    } catch (error) {
      console.error("获取数据失败:", error);
      setDbError("数据库连接失败，请初始化数据库");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleInitDb() {
    setInitializing(true);
    try {
      const res = await fetch("/api/init-db", { method: "POST" });
      if (res.ok) {
        toast.success("数据库初始化成功");
        setDbError(null);
        setInitializing(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "初始化失败");
        setInitializing(false);
      }
    } catch (error) {
      toast.error("初始化失败，请检查控制台");
      console.error("Init error:", error);
      setInitializing(false);
    }
  }

  const safeProjects = Array.isArray(projects) ? projects : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const dashboardLoading = loading || tasksLoading;

  const filtered = safeProjects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "全部") return matchSearch;
    const statusKey = STATUS_KEY_MAP[activeTab];
    if (statusKey) return matchSearch && p.progressStatus === statusKey;
    return matchSearch;
  });

  const inProgressCount = safeProjects.filter((p) => p.progressStatus === "in_progress").length;
  const pendingCount = safeProjects.filter((p) => p.progressStatus === "pending").length;
  const doneCount = safeProjects.filter((p) => p.progressStatus === "completed").length;
  const overdueCount = safeTasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const thisWeekCompleted = safeTasks.filter((t) => {
    if (!t.completedAt) return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(t.completedAt) >= weekAgo;
  }).length;

  const completionRate = safeTasks.length > 0 
    ? Math.round((safeTasks.filter(t => t.status === "done").length / safeTasks.length) * 100)
    : 0;

  function handleTabChange(tab: StatusTab) {
    setTabAnimating(true);
    setActiveTab(tab);
    setTimeout(() => setTabAnimating(false), 300);
  }

  const dismissWarning = useCallback((id: string) => {
    setDismissedWarningIds((prev) => new Set(prev).add(id));
  }, []);

  const visibleWarnings = warnings.filter((w) => !dismissedWarningIds.has(w.id));

  async function handleGenerateWeeklyReport() {
    setWeeklyReportLoading(true);
    setWeeklyReportOpen(true);
    try {
      const res = await fetch("/api/reports/weekly?period=本周");
      if (res.ok) {
        const data: WeeklyReportData = await res.json();
        setWeeklyReport(data);
      } else {
        toast.error("生成周报失败");
        setWeeklyReportOpen(false);
      }
    } catch (e) {
      toast.error("生成周报失败");
      setWeeklyReportOpen(false);
    } finally {
      setWeeklyReportLoading(false);
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      {dbError ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl shadow-lg p-6 text-center" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="var(--color-danger)">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>数据库未初始化</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{dbError}</p>
            <button
              onClick={handleInitDb}
              disabled={initializing}
              className="w-full py-2.5 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)]"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {initializing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  初始化中...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  初始化数据库
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
          <SidebarNav />

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <header className="h-14 border-b flex items-center justify-between px-4 md:px-6 shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>工作台</h1>
              <button
                onClick={() => router.push("/projects")}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:bg-[var(--accent-hover)]"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                新建项目
              </button>
            </header>

            {/* 避坑预警横幅 */}
            {visibleWarnings.length > 0 && (
              <div data-tour="dashboard-warnings">
                <WarningBanner warnings={visibleWarnings} onDismiss={dismissWarning} />
              </div>
            )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: 'var(--bg-root)' }} data-tour="page-dashboard">
          <div className="max-w-6xl mx-auto">
            {/* 搜索栏 */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200 focus:ring-2"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-strong)';
                    (e.currentTarget.style as any)['--tw-ring-color'] = 'var(--bg-muted)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="搜索项目..."
                />
              </div>
            </div>

            {/* 统计卡片 - 黑白灰配色 */}
            {dashboardLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
                <SkeletonStatsCard />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <EnhancedStatsCard
                  title="全部项目"
                  value={projects.length}
                  subtitle={`${inProgressCount}进行 › ${pendingCount}待推 › ${doneCount}完成`}
                  icon="projects"
                  color="black"
                />
                <EnhancedStatsCard
                  title="任务总数"
                  value={tasks.length}
                  subtitle={`${tasks.filter(t => t.status === "done").length} 个已完成`}
                  icon="tasks"
                  color="gray"
                />
                <EnhancedStatsCard
                  title="完成率"
                  value={`${completionRate}%`}
                  subtitle={`本周完成 ${thisWeekCompleted} 个`}
                  icon="completed"
                  color="white"
                />
                <EnhancedStatsCard
                  title="即将到期"
                  value={overdueCount}
                  subtitle="需要关注"
                  icon="overdue"
                  color={overdueCount > 0 ? "dark" : "light"}
                />
              </div>
            )}

            {/* 生成本周报告按钮 */}
            {!dashboardLoading && (
              <div className="mb-6">
                <button
                  onClick={handleGenerateWeeklyReport}
                  data-tour="dashboard-report-btn"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[var(--bg-surface-hover)]"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  生成本周报告
                </button>
              </div>
            )}

            {/* 数据图表 */}
            {!dashboardLoading && tasks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>任务状态分布</h3>
                  <TaskChart tasks={tasks} type="status" />
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>优先级分布</h3>
                  <TaskChart tasks={tasks} type="priority" />
                </div>
              </div>
            )}

            {/* 下阶段目标 */}
            {pushedGoals.length > 0 && (
              <div className="mb-6">
                <PushedGoalsCard goals={pushedGoals} onRemove={(id) => {
                  const updated = pushedGoals.filter((g) => g.id !== id);
                  setPushedGoals(updated);
                  localStorage.setItem("flowsync_pushed_goals", JSON.stringify(updated));
                }} />
              </div>
            )}

            {/* 标签筛选 - 黑白灰风格 */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className="relative rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300"
                  style={
                    activeTab === tab
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)', boxShadow: 'var(--shadow-md)' }
                      : { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
                  }
                  onMouseEnter={activeTab !== tab ? (e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; } : undefined}
                  onMouseLeave={activeTab !== tab ? (e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-default)'; } : undefined}
                >
                  <span>{tab}</span>
                  {activeTab !== tab && (
                    <span className="ml-1.5 text-xs opacity-60">
                      {tab === "全部" && safeProjects.length}
                      {tab === "进行中" && inProgressCount}
                      {tab === "待推进" && pendingCount}
                      {tab === "已完成" && doneCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 项目列表 */}
            {dashboardLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={search ? "search" : "projects"}
                title={search ? "未找到匹配的项目" : "还没有项目"}
                description={search ? "尝试使用其他关键词搜索" : "开始创建您的第一个项目，开启高效工作之旅"}
                actionText="立即创建"
                actionUrl="/projects/new"
                searchMode={!!search}
              />
            ) : (
              <div className={`space-y-3 transition-all duration-300 ${tabAnimating ? "opacity-50" : "opacity-100"}`} data-tour="dashboard-projects">
                {filtered.map((project, index) => (
                  <Link
                    href={`/projects/${project.id}`}
                    key={project.id}
                    className="block"
                  >
                    <ProjectCard
                      project={project}
                      index={index}
                    />
                  </Link>
                ))}
              </div>
            )}

          </div>
        </div>

        <MobileNav activeItem="dashboard" />
          </main>
        </>
      )}

      {/* 周报弹窗 */}
      <WeeklyReport
        open={weeklyReportOpen}
        onClose={() => setWeeklyReportOpen(false)}
        report={weeklyReport}
        loading={weeklyReportLoading}
      />
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const progress = project.taskCount > 0 
    ? Math.round((project.completedCount / project.taskCount) * 100)
    : 0;

  const statusLabel = project.progressStatus === "completed" ? "已完成"
    : project.progressStatus === "pending" ? "待推进"
    : "进行中";

  const statusBg = project.progressStatus === "completed" ? 'var(--color-success)'
    : project.progressStatus === "pending" ? 'var(--color-warning)'
    : 'var(--color-info)';
  const statusTextColor = 'var(--text-inverse)';
  const dotColor = 'var(--text-inverse)';

  async function handleStatusChange(e: React.MouseEvent, newStatus: string) {
    e.stopPropagation();
    if (changingStatus || newStatus === project.progressStatus) return;
    setChangingStatus(true);
    const label = newStatus === "completed" ? "已完成"
      : newStatus === "pending" ? "待推进" : "进行中";
    try {
      const res = await fetch("/api/projects/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, progressStatus: newStatus }),
      });
      if (res.ok) {
        project.progressStatus = newStatus;
        toast.success(`已切换为「${label}」`);
      }
    } catch {
      toast.error("状态更新失败");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group rounded-xl p-5 cursor-pointer transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: isHovered ? '1px solid var(--border-strong)' : '1px solid var(--border-default)',
        boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: project.color || 'var(--accent)' }}
            />
            <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
            {/* 进度状态标签 */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium cursor-default"
              style={{ backgroundColor: statusBg, color: statusTextColor }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
              {statusLabel}
            </span>
            {/* 快速切换状态 */}
            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
              <select
                value={project.progressStatus}
                onChange={(e) => handleStatusChange(e as any, e.target.value)}
                className="appearance-none text-[11px] rounded px-1.5 py-0.5 cursor-pointer hover:border-[var(--border-strong)] focus:outline-none"
                style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              >
                <option value="in_progress">切换到 进行中</option>
                <option value="pending">切换到 待推进</option>
                <option value="completed">切换到 已完成</option>
              </select>
            </div>
            {project.currentStage && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--text-secondary)' }} />
                {project.currentStage}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-sm truncate mb-2" style={{ color: 'var(--text-secondary)' }}>{project.description}</p>
          )}
          
          {/* 进度条 - 黑白灰 */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{progress}%</span>
          </div>
        </div>

        <div className="ml-4 flex flex-col items-end gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {new Date(project.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
          </span>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>{project.taskCount} 任务</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>{project.completedCount} 完成</span>
          </div>
          <div className="transition-transform duration-300" style={{ transform: isHovered ? "translateX(4px)" : "translateX(0)" }}>
            <svg className="transition-colors duration-300" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: isHovered ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  WarningBanner -- 避坑预警横向横幅
 * ------------------------------------------------------------------ */

const LEVEL_STYLES: Record<Warning["level"], { bg: string; border: string; text: string; icon: string; dot: string }> = {
  warning: {
    bg: "var(--bg-muted)",
    border: "var(--color-warning)",
    text: "var(--color-warning)",
    icon: "var(--color-warning)",
    dot: "var(--color-warning)",
  },
  info: {
    bg: "var(--bg-muted)",
    border: "var(--color-info)",
    text: "var(--color-info)",
    icon: "var(--color-info)",
    dot: "var(--color-info)",
  },
  tip: {
    bg: "var(--bg-muted)",
    border: "var(--color-success)",
    text: "var(--color-success)",
    icon: "var(--color-success)",
    dot: "var(--color-success)",
  },
};

const LEVEL_LABELS: Record<Warning["level"], string> = {
  warning: "提醒",
  info: "建议",
  tip: "贴士",
};

function PushedGoalsCard({
  goals,
  onRemove,
}: {
  goals: PushedGoal[];
  onRemove: (id: string) => void;
}) {
  if (goals.length === 0) return null;

  const periodLabels: Record<PushedGoal["period"], string> = {
    tomorrow: "明日",
    week: "本周",
    month: "本月",
    year: "本年",
  };
  const periodOrder: PushedGoal["period"][] = ["tomorrow", "week", "month", "year"];

  const grouped: Record<string, PushedGoal[]> = {};
  for (const g of goals) {
    const key = g.period || "week";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  }

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>下阶段目标</h3>
      <div className="space-y-3">
        {periodOrder.map((period) => {
          const items = grouped[period];
          if (!items || items.length === 0) return null;
          return (
            <div key={period}>
              <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>{periodLabels[period]}</h4>
              <div className="space-y-1.5">
                {items.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-2.5 rounded-lg group" style={{ backgroundColor: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{g.goal}</p>
                      {g.reason && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{g.reason}</p>
                      )}
                    </div>
                    <span
                      className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded ml-2"
                      style={g.source === "ai" ? { backgroundColor: 'var(--color-info)', color: 'var(--text-inverse)' } : { backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
                    >
                      {g.source === "ai" ? "AI" : "自定义"}
                    </span>
                    <button
                      onClick={() => onRemove(g.id)}
                      className="flex-shrink-0 ml-2 transition-colors opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="移除"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WarningBanner({
  warnings,
  onDismiss,
}: {
  warnings: Warning[];
  onDismiss: (id: string) => void;
}) {
  if (warnings.length === 0) return null;

  return (
    <div className="px-4 md:px-6 pt-3 pb-1 space-y-2" style={{ backgroundColor: 'var(--bg-root)' }}>
      {warnings.map((w) => {
        const style = LEVEL_STYLES[w.level];
        return (
          <div
            key={w.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg animate-slide-in-left"
            style={{ backgroundColor: style.bg, border: `1px solid ${style.border}`, color: style.text }}
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: style.dot }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70 shrink-0">
              {LEVEL_LABELS[w.level]}
            </span>
            <span className="text-sm flex-1 min-w-0">{w.message}</span>
            {w.action && (
              <a
                href={w.actionUrl || "#"}
                className="text-xs font-medium underline underline-offset-2 shrink-0 hover:opacity-80"
              >
                {w.action}
              </a>
            )}
            <button
              onClick={() => onDismiss(w.id)}
              className="shrink-0 p-0.5 rounded transition-colors"
              style={{ color: style.text }}
              aria-label="关闭提醒"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
