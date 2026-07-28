"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import AITextToProjectModal from "@/components/AITextToProjectModal";

interface FlowStage {
  name: string;
  checklist: string[];
}

interface FlowTemplate {
  id: string;
  name: string;
  stages: FlowStage[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [timeLimit, setTimeLimit] = useState("");
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");

  const isSopProject = !!templateId;
  const sopColors = ["#DADEEO", "#A6B2BA", "#BCC8CE", "#5B6770"];
  const dailyColors = ["#E9F1FC", "#C8CFD6", "#B0BECC", "#65768E"];
  const availableColors = isSopProject ? sopColors : dailyColors;

  const fetchTemplates = useCallback(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then(setTemplates)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          flowTemplateId: templateId || undefined,
          color: selectedColor || null,
          ...(timeLimit.trim() ? { dueDate: timeLimit.trim() } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "创建失败");
        return;
      }

      router.push(`/projects/${data.id}`);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleAICreate(projectName: string, projectDesc: string, stages: { name: string; checklist: string[] }[]) {
    setLoading(true);
    setError("");

    try {
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description: projectDesc || undefined,
          dueDate: timeLimit.trim() || undefined,
        }),
      });
      if (!projectRes.ok) {
        const data = await projectRes.json();
        throw new Error(data.error || "创建项目失败");
      }
      const project = await projectRes.json();

      for (const stage of stages) {
        const taskRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            title: stage.name,
          }),
        });
        if (!taskRes.ok) continue;
        const task = await taskRes.json();
        for (const item of stage.checklist) {
          if (!item.trim()) continue;
          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              parentTaskId: task.id,
              title: item.trim(),
            }),
          });
        }
      }

      router.push(`/projects/${project.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "创建失败");
      setLoading(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <div className="flex h-dvh" style={{ backgroundColor: 'var(--bg-root)' }}>
      <SidebarNav />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center px-4 shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回项目列表
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>新建项目</h2>
              <button
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-muted)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 智能识别
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              项目颜色
            </label>
            <div className="mt-2 flex gap-3">
              {availableColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(selectedColor === c ? "" : c)}
                  className="w-9 h-9 rounded-lg border-2 transition-all"
                  style={{
                    backgroundColor: c,
                    borderColor: selectedColor === c ? "var(--border-strong)" : "transparent",
                    boxShadow: selectedColor === c ? `0 0 0 2px ${c}40` : "none",
                  }}
                  title={c}
                >
                  {selectedColor === c && (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto" style={{ color: 'var(--text-secondary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {isSopProject ? "SOP项目颜色" : "日常项目颜色"}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              项目名称 <span style={{ color: 'var(--text-muted)' }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              placeholder="输入项目名称"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              项目描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              placeholder="可选，描述项目目标和范围"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              截止日期（可选）
            </label>
            <input
              type="date"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              流程模板（可选）
            </label>
            <div className="mt-1 flex gap-2">
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                setSelectedColor("");
              }}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            >
              <option value="">不使用模板</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={fetchTemplates}
              className="shrink-0 px-2.5 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              title="刷新模板列表"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link
              href="/templates/new"
              className="shrink-0 inline-flex items-center px-2.5 rounded-lg transition-colors text-xs no-underline"
              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-muted)' }}
              title="新建模板"
            >
              + 模板
            </Link>
            </div>
            {selectedTemplate && (
              <div className="mt-3 rounded-lg p-3" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>流程阶段预览：</p>
                <div className="mt-2 flex gap-2">
                  {selectedTemplate.stages.map((stage, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-md p-2 text-center"
                      style={{ backgroundColor: 'var(--bg-muted)' }}
                    >
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stage.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            {loading ? "创建中..." : "创建项目"}
          </button>
        </form>
          </div>
        </main>
        <MobileNav activeItem="tasks" />
      </div>

      {showAIModal && (
        <AITextToProjectModal
          onClose={() => setShowAIModal(false)}
          onConfirm={handleAICreate}
        />
      )}
    </div>
  );
}
