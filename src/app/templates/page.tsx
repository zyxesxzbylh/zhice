"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import { EmptyState } from "@/components/ui/EmptyState";

interface FlowStage {
  name: string;
  checklist: string[];
}

interface FlowTemplate {
  id: string;
  name: string;
  stages: FlowStage[];
  deadline?: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [instantiatingId, setInstantiatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`确定要删除模板「${name}」吗？\n关联的 SOP 项目及其任务将一并删除。`)) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (data.deletedProjects > 0) {
          toast.success(`模板已删除，同时清理了 ${data.deletedProjects} 个关联项目`);
        } else {
          toast.success("模板已删除");
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "删除失败");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("删除失败");
    }
  }

  async function handleInstantiate(template: FlowTemplate) {
    if (!confirm(`确定要使用模板「${template.name}」创建新项目吗？\n将自动创建 ${template.stages.length} 个任务。`)) return;
    setInstantiatingId(template.id);
    try {
      const res = await fetch(`/api/templates/${template.id}/instantiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "实例化失败");
      }

      const data = await res.json();
      const taskCount = data.createdTasks?.length ?? data.tasksCreated ?? 0;
      toast.success(`模板已实例化！创建了 ${taskCount} 个任务`);
      router.push(`/projects/${data.projectId}`);
    } catch (error: any) {
      console.error("实例化模板失败:", error);
      toast.error(error.message || "实例化失败");
    } finally {
      setInstantiatingId(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      <SidebarNav />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>模板管理</h1>
          <button
            onClick={() => router.push("/templates/new")}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建模板
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: 'var(--bg-root)' }}>
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
              </div>
            ) : templates.length === 0 ? (
              <EmptyState
                icon="templates"
                title="还没有流程模板"
                description="流程模板帮助你标准化重复性工作，将 SOP 转化为可复用的任务流。"
                action={
                  <button
                    onClick={() => router.push("/templates/new")}
                    className="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-medium transition-all duration-200"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    创建第一个模板
                  </button>
                }
              />
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <div key={template.id}
                    className="rounded-xl p-5 transition-all duration-300"
                    style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{template.name}</h3>
                        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {template.stages.length} 个阶段 · {new Date(template.createdAt).toLocaleDateString("zh-CN")}
                        </p>
                        {template.deadline && (
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            应用期限：{new Date(template.deadline).toLocaleDateString("zh-CN")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInstantiate(template)}
                          disabled={instantiatingId === template.id}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                        >
                          {instantiatingId === template.id ? (
                            <>
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              实例化中...
                            </>
                          ) : (
                            <>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              使用此模板
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => router.push(`/templates/${template.id}/edit`)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(template.id, template.name)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 overflow-x-auto">
                      {template.stages.map((stage, i) => (
                        <div
                          key={i}
                          className="flex-1 min-w-[120px] rounded-lg p-3"
                          style={{ border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-root)' }}
                        >
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{stage.name}</p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {stage.checklist.length} 项检查
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <MobileNav activeItem="templates" />
      </main>
    </div>
  );
}
