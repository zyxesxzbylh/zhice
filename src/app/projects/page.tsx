"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import { useTasks } from "@/components/TaskContext";
import toast from "react-hot-toast";

interface Project {
  id: string;
  name: string;
  description?: string;
  taskCount: number;
  completedCount: number;
  color: string;
  dueDate?: string | null;
  progressStatus?: string;
}

const PROJECT_COLORS = [
  "bg-[var(--color-info)]",
  "bg-[var(--bg-muted-hover)]",
  "bg-[var(--bg-muted)]",
  "bg-[var(--color-info)]",
];

function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { refreshTasks } = useTasks();
  const fetchingRef = useRef(false);

  useEffect(() => {
    async function fetchProjects() {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.map((p: any, idx: number) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            taskCount: p.taskCount || 0,
            completedCount: p.completedCount || 0,
            color: p.color || PROJECT_COLORS[idx % PROJECT_COLORS.length],
            dueDate: p.dueDate || null,
            progressStatus: p.progressStatus || "in_progress",
          })));
        } else {
          setProjects([]);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setProjects([]);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    }
    fetchProjects();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchProjects();
    };
    const onFocus = () => fetchProjects();
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  async function handleDeleteProject(projectId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("项目已删除");
        setProjects(prev => prev.filter(p => p.id !== projectId));
        setDeleteConfirm(null);
        refreshTasks();
      } else {
        const data = await res.json();
        toast.error(data.error || "删除失败");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("删除失败，请检查网络连接");
    }
  }

  async function handleStatusChange(projectId: string, newStatus: string) {
    const label = newStatus === "completed" ? "已完成"
      : newStatus === "pending" ? "待推进" : "进行中";
    try {
      const res = await fetch("/api/projects/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, progressStatus: newStatus }),
      });
      if (res.ok) {
        setProjects(prev => prev.map(p =>
          p.id === projectId ? { ...p, progressStatus: newStatus } : p
        ));
        toast.success(`已切换为「${label}」`);
      }
    } catch {
      toast.error("状态更新失败");
    }
  }

  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
  const totalCompleted = projects.reduce((sum, p) => sum + p.completedCount, 0);
  const inProgressCount = projects.filter((p) => p.progressStatus === "in_progress").length;
  const pendingCount = projects.filter((p) => p.progressStatus === "pending").length;

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      <SidebarNav />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>项目管理</h1>
          </div>
          <button
            onClick={() => router.push("/projects/new")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建项目
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: 'var(--bg-root)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{projects.length}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>项目总数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-info)]">{inProgressCount}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>进行中</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-warning)]">{pendingCount}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>待推进</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-success)]">{projects.filter(p => p.progressStatus === "completed").length}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>已完成</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalTasks}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>总任务</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="rounded-2xl p-5 transition-all duration-300 group relative cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="flex items-start gap-4 pointer-events-none">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: project.color?.startsWith("#") ? project.color : undefined }}
                    >
                      {!project.color?.startsWith("#") && (
                        <div className={`w-full h-full rounded-xl ${project.color || "bg-[var(--color-info)]"} flex items-center justify-center`}>
                          <svg className="text-[var(--text-inverse)]" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      )}
                      {project.color?.startsWith("#") && (
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                          style={{ color: isLightColor(project.color) ? "var(--text-primary)" : "var(--text-inverse)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h3>
                      {project.description && (
                        <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
                      )}
                      {/* 进度状态 */}
                      <StatusBadge
                        status={project.progressStatus || "in_progress"}
                        onChange={(newStatus) => handleStatusChange(project.id, newStatus)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 pointer-events-none" style={{ borderTop: '1px solid var(--border-default)' }}>
                    <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                      <span>{project.taskCount} 个任务</span>
                      <span>{project.completedCount} 已完成</span>
                    </div>
                    {project.dueDate && (
                      <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {project.dueDate}
                      </div>
                    )}
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ backgroundColor: 'var(--accent)', width: `${project.taskCount > 0 ? (project.completedCount / project.taskCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(project.id); }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--color-danger)]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              <div
                onClick={() => router.push("/projects/new")}
                className="rounded-2xl border-2 border-dashed p-5 cursor-pointer transition-all duration-300 flex items-center justify-center min-h-[140px]"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-strong)' }}
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>创建新项目</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <MobileNav activeItem="projects" />
      </main>

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-xl w-full max-w-sm shadow-2xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-[var(--color-danger)]">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>删除项目</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>此操作不可撤销</p>
                  </div>
                </div>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  确定要删除该项目吗？项目下的所有任务也将被删除。
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleDeleteProject(deleteConfirm)}
                    className="px-4 py-2 rounded-lg bg-[var(--color-danger)] text-[var(--text-inverse)] text-sm font-medium hover:opacity-90 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

function StatusBadge({ status, onChange }: {
  status: string;
  onChange: (newStatus: string) => void;
}) {
  const label = status === "completed" ? "已完成"
    : status === "pending" ? "待推进"
    : "进行中";
  const color = status === "completed" ? "bg-[var(--bg-muted)] text-[var(--color-success)] border-[var(--border-default)]"
    : status === "pending" ? "bg-[var(--bg-muted)] text-[var(--color-warning)] border-[var(--border-default)]"
    : "bg-[var(--accent-muted)] text-[var(--color-info)] border-[var(--border-default)]";

  return (
    <div className="flex items-center gap-2 mt-2 pointer-events-auto">
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          status === "completed" ? "bg-[var(--color-success)]" :
          status === "pending" ? "bg-[var(--color-warning)]" : "bg-[var(--color-info)]"
        }`} />
        {label}
      </span>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-[11px] rounded px-1.5 py-0.5 cursor-pointer focus:outline-none"
        style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
      >
        <option value="in_progress">进行中</option>
        <option value="pending">待推进</option>
        <option value="completed">已完成</option>
      </select>
    </div>
  );
}
