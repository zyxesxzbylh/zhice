"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import TaskTree from "@/components/TaskTree";
import type { TaskNode } from "@/components/TaskTree";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import DailyWorkSummarizeModal from "@/components/DailyWorkSummarizeModal";
import AIBatchCreateModal from "@/components/AIBatchCreateModal";
import { useTasks } from "@/components/TaskContext";

interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  currentStage: string | null;
  flowTemplateId: string | null;
  category: string | null;
  color: string | null;
  dueDate: string | null;
  tasks: Task[];
  createdAt: string;
}

interface FlowStage {
  name: string;
  checklist: string[];
}

interface FlowInstance {
  id: string;
  projectId: string;
  templateId: string;
  stageChecklistStatus: Record<string, boolean[]>;
  stageTimeLimits: Record<string, number> | null;
}

const CATEGORIES = [
  { id: "work", label: "工作", icon: "💼" },
  { id: "personal", label: "个人", icon: "👤" },
  { id: "study", label: "学习", icon: "📚" },
  { id: "health", label: "健康", icon: "💪" },
  { id: "finance", label: "财务", icon: "💰" },
  { id: "life", label: "生活", icon: "🏠" },
];

function ProjectSettingsModal({ project, stages, stageTimeLimits: initialTimeLimits, onClose, onSave }: {
  project: Project;
  stages: FlowStage[];
  stageTimeLimits: Record<string, number> | null;
  onClose: () => void;
  onSave: (data: Partial<Project> & { stageTimeLimits?: Record<string, number> }) => void;
}) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [dueDate, setDueDate] = useState(project.dueDate || "");
  const [stageDueDates, setStageDueDates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    stages.forEach((stage, index) => {
      if (initialTimeLimits && initialTimeLimits[stage.name]) {
        const date = new Date();
        date.setDate(date.getDate() + initialTimeLimits[stage.name]);
        initial[stage.name] = date.toISOString().slice(0, 16);
      } else {
        const date = new Date();
        date.setDate(date.getDate() + index);
        initial[stage.name] = date.toISOString().slice(0, 16);
      }
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [selectedColor, setSelectedColor] = useState(project.color || "");
  const isSop = stages.length > 0;
  const sopColors = ["#DADEEO", "#A6B2BA", "#BCC8CE", "#5B6770"];
  const dailyColors = ["#E9F1FC", "#C8CFD6", "#B0BECC", "#65768E"];
  const availableColors = isSop ? sopColors : dailyColors;

  async function handleSave() {
    if (!name.trim()) {
      toast.error("项目名称不能为空");
      return;
    }
    setSaving(true);
    try {
      const body: any = { name: name.trim(), description: description.trim() };
      body.dueDate = dueDate || null;
      let timeLimits: Record<string, number> = {};
      if (isSop) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        stages.forEach((stage) => {
          if (stageDueDates[stage.name]) {
            const stageDate = new Date(stageDueDates[stage.name]);
            const diffTime = stageDate.getTime() - today.getTime();
            const diffDays = Math.max(0, diffTime / (1000 * 60 * 60 * 24));
            timeLimits[stage.name] = diffDays;
          }
        });
        body.stageTimeLimits = timeLimits;
      }
      body.color = selectedColor || null;

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        const savePayload: any = { name: name.trim(), description: description.trim(), dueDate: dueDate || null };
        if (isSop) {
          savePayload.stageTimeLimits = timeLimits;
        }
        onSave(savePayload);
        onClose();
        toast.success("项目设置已保存");
      } else {
        toast.error(data.error || "保存失败");
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("保存失败，请检查网络连接");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>项目设置</h2>
            <button onClick={onClose} className="p-2 rounded-full transition-colors">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>项目名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:shadow-sm transition-all"
              style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              placeholder="输入项目名称"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>项目描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:shadow-sm transition-all resize-none"
              style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              placeholder="输入项目描述（可选）"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>截止日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:shadow-sm transition-all"
              style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>项目颜色</label>
            <div className="flex gap-3">
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
                >
                  {selectedColor === c && (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto" style={{ color: 'var(--text-secondary)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{isSop ? "SOP项目颜色" : "日常项目颜色"}</p>
          </div>

          {isSop && (
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>各阶段任务截止时间</label>
              <div className="space-y-2">
                {stages.map((stage) => (
                  <div key={stage.name} className="flex items-center gap-3">
                    <span className="text-sm w-24 shrink-0" style={{ color: 'var(--text-secondary)' }}>{stage.name}</span>
                    <input
                      type="datetime-local"
                      value={stageDueDates[stage.name] || ""}
                      onChange={(e) => {
                        setStageDueDates((prev) => ({
                          ...prev,
                          [stage.name]: e.target.value,
                        }));
                      }}
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none focus:shadow-sm transition-all"
                      style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                    {stage.checklist.length > 0 && (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{stage.checklist.length} 个子任务</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>设置每个阶段的截止时间（年/月/日 时/分），创建任务时将使用该截止时间</p>
            </div>
          )}
        </div>

        <div className="p-6 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-root)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AISplitModal({ taskTitle, onClose, onConfirm }: { taskTitle: string; onClose: () => void; onConfirm: (subtasks: string[]) => void }) {
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");

  const quickPrompts = [
    "拆分为 3 个子任务",
    "拆分为 5 个子任务",
    "按阶段拆分",
    "按优先级拆分",
  ];

  async function handleAISplit(prompt: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskTitle, prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subtasks && Array.isArray(data.subtasks)) {
          setSubtasks(data.subtasks);
        }
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("AI 拆分失败");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomSplit() {
    if (!customInput.trim()) return;
    const lines = customInput.split("\n").filter(l => l.trim());
    if (lines.length > 0) {
      setSubtasks(lines.map(l => l.trim()));
    }
  }

  function updateSubtask(index: number, value: string) {
    setSubtasks(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  }

  function removeSubtask(index: number) {
    setSubtasks(prev => prev.filter((_, i) => i !== index));
  }

  function handleConfirm() {
    if (subtasks.length === 0) {
      toast.error("请先添加子任务");
      return;
    }
    onConfirm(subtasks);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI 智能拆分</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>为「{taskTitle}」智能拆分任务</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>快速拆分</label>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleAISplit(prompt)}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>手动输入子任务</label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all resize-none"
              style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
              placeholder="每行一个子任务，按回车分隔"
            />
            <button
              onClick={handleCustomSplit}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}
            >
              解析子任务
            </button>
          </div>

          {subtasks.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>子任务列表</label>
              <div className="space-y-2">
                {subtasks.map((subtask, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--bg-muted-hover)', color: 'var(--text-inverse)' }}>
                      {i + 1}
                    </div>
                    <input
                      type="text"
                      value={subtask}
                      onChange={(e) => updateSubtask(i, e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-all"
                      style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                    />
                    <button
                      onClick={() => removeSubtask(i)}
                      className="p-1.5 rounded-lg transition-colors shrink-0"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex items-center justify-end gap-3" style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-root)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={subtasks.length === 0}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            确认拆分 ({subtasks.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [template, setTemplate] = useState<{ stages: FlowStage[] } | null>(null);
  const [flowInstance, setFlowInstance] = useState<FlowInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [newRootTitle, setNewRootTitle] = useState("");
  const [showNewRoot, setShowNewRoot] = useState(false);
  const { refreshTasks, updateTask } = useTasks();
  const [showSettings, setShowSettings] = useState(false);
  const [aiSplitTask, setAiSplitTask] = useState<{ title: string } | null>(null);
  const [showSummarizeModal, setShowSummarizeModal] = useState(false);
  const [showBatchCreateModal, setShowBatchCreateModal] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());

  function toggleStageExpand(stageName: string) {
    setExpandedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageName)) next.delete(stageName);
      else next.add(stageName);
      return next;
    });
  }

  async function loadProject() {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.status === 404) { router.push("/projects"); return; }
      const data = await res.json();
      setProject(data);

      if (data.flowTemplateId) {
        const [tRes, fiRes] = await Promise.all([
          fetch("/api/templates"),
          fetch(`/api/projects/${id}/flow-instance`),
        ]);
        const templates = await tRes.json();
        const t = templates.find((tmpl: { id: string }) => tmpl.id === data.flowTemplateId);
        if (t) setTemplate(t);

        const fi = await fiRes.json();
        if (fi) setFlowInstance(fi);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setLoading(false);
        return;
      }
      toast.error("加载项目失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [id]);

  async function addRootTask() {
    if (!newRootTitle.trim()) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: id,
          title: newRootTitle.trim(),
        }),
      });
      setNewRootTitle("");
      setShowNewRoot(false);
      toast.success("任务创建成功");
      loadProject();
      refreshTasks();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("创建任务失败");
    }
  }

  async function addAISubtask(parentTaskId: string, subtasks: string[]) {
    try {
      for (const title of subtasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: id,
            parentTaskId,
            title: title.trim(),
          }),
        });
      }
      toast.success(`已添加 ${subtasks.length} 个子任务`);
      loadProject();
      refreshTasks();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("添加子任务失败");
    }
  }

  async function toggleChecklist(stageName: string, index: number, current: boolean) {
    if (!flowInstance) return;
    try {
      const res = await fetch(`/api/projects/${id}/flow-instance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName,
          checklistIndex: index,
          completed: !current,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFlowInstance(updated);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("更新检查项失败");
    }
  }

  async function switchStage(stageName: string) {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: stageName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProject((prev) => prev ? { ...prev, currentStage: updated.currentStage } : null);
        toast.success(`已切换到阶段「${stageName}」`);
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("切换阶段失败");
    }
  }

  async function handleSettingsSave(data: Partial<Project> & { stageTimeLimits?: Record<string, number> }) {
    setProject((prev) => prev ? { ...prev, ...data, dueDate: data.dueDate ?? prev.dueDate } : null);
    if (data.stageTimeLimits && flowInstance) {
      setFlowInstance((prev) => prev ? { ...prev, stageTimeLimits: data.stageTimeLimits! } : null);
    }
    refreshTasks();
    loadProject();
  }

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
      loadProject();
      refreshTasks();
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error(e instanceof Error ? e.message : "创建任务失败");
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </main>
    );
  }

  if (!project) return null;

  const stages: FlowStage[] = template?.stages || [];
  const checklistStatus = flowInstance?.stageChecklistStatus || {};

  const categoryInfo = CATEGORIES.find(c => c.id === project.category);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      {showSettings && project && (
        <ProjectSettingsModal
          project={project}
          stages={stages}
          stageTimeLimits={flowInstance?.stageTimeLimits ?? null}
          onClose={() => setShowSettings(false)}
          onSave={handleSettingsSave}
        />
      )}

      {aiSplitTask && (
        <AISplitModal
          taskTitle={aiSplitTask.title}
          onClose={() => setAiSplitTask(null)}
          onConfirm={(subtasks) => addAISubtask("", subtasks)}
        />
      )}

      {showSummarizeModal && (
        <DailyWorkSummarizeModal
          tasks={(project?.tasks || []).map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            status: t.status,
            project: project?.name || undefined,
            dueDate: t.dueDate || undefined,
          }))}
          onClose={() => setShowSummarizeModal(false)}
        />
      )}
      {showBatchCreateModal && (
        <AIBatchCreateModal
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowBatchCreateModal(false)}
          onConfirm={handleBatchCreateConfirm}
        />
      )}

      <SidebarNav />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/projects")} className="p-2 rounded-lg transition-colors">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{project.name}</h1>
              {categoryInfo && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <span>{categoryInfo.icon}</span>
                  <span>{categoryInfo.label}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiSplitTask({ title: project.name })}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI 拆分
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              设置
            </button>
            <button
              onClick={async () => {
                await refreshTasks();
                await loadProject();
                setShowSummarizeModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              今日总结
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ backgroundColor: 'var(--bg-root)' }}>
          <div className="max-w-4xl mx-auto">
            {project.description && (
              <p className="mb-6 text-sm p-4 rounded-xl" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>{project.description}</p>
            )}

            {project.dueDate && (
              <div className="mb-6 flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>截止日期：</span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{project.dueDate}</span>
              </div>
            )}

            {stages.length > 0 && (
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3">
                  {stages.map((stage, i) => {
                    const stageStatus = checklistStatus[stage.name];
                    const checkedCount = stageStatus ? stageStatus.filter(Boolean).length : 0;
                    const totalCount = stage.checklist.length;
                    const isCurrent = project.currentStage === stage.name;

                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs cursor-pointer transition ${
                          isCurrent ? "font-medium" : ""
                        }`}
                        style={
                          isCurrent
                            ? { borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }
                            : { borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-root)', color: 'var(--text-muted)' }
                        }
                        onClick={() => switchStage(stage.name)}
                      >
                        {stage.name}
                        {totalCount > 0 && (
                          <div className="mt-1.5 flex items-center justify-center gap-1">
                            {stageStatus ? stageStatus.map((done, j) => (
                              <div
                                key={j}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  done ? "bg-[var(--color-info)]" : "bg-[var(--bg-muted-hover)]"
                                }`}
                              />
                            )) : (
                              stage.checklist.map((_, j) => (
                                <div
                                  key={j}
                                  className="h-1.5 w-1.5 rounded-full bg-[var(--bg-muted-hover)]"
                                />
                              ))
                            )}
                          </div>
                        )}
                        {totalCount > 0 && (
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {checkedCount}/{totalCount}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  {stages.map((stage, stageIndex) => {
                    const stageStatus = checklistStatus[stage.name] || [];
                    const isCurrent = project.currentStage === stage.name;
                    const isExpanded = expandedStages.has(stage.name);
                    const checkedCount = stageStatus.filter(Boolean).length;
                    const totalCount = stage.checklist.length;

                    return (
                      <div
                        key={stageIndex}
                        className={`rounded-lg border transition ${
                          isCurrent ? "" : ""
                        }`}
                        style={
                          isCurrent
                            ? { borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface)' }
                            : { borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-root)' }
                        }
                      >
                        <button
                          onClick={() => {
                            switchStage(stage.name);
                            toggleStageExpand(stage.name);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium" style={{
                              color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)'
                            }}>
                              {stage.name}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                                当前阶段
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {totalCount > 0 && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {checkedCount}/{totalCount}
                              </span>
                            )}
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              className={`transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                              style={{ color: 'var(--text-muted)' }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                            <div className="space-y-1.5">
                              {stage.checklist.map((item, j) => (
                                <label
                                  key={j}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <button
                                    onClick={() => toggleChecklist(stage.name, j, stageStatus[j])}
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                                      stageStatus[j]
                                        ? "border-[var(--color-info)] bg-[var(--color-info)] text-[var(--text-inverse)]"
                                        : "border-[var(--border-strong)] group-hover:border-[var(--text-secondary)]"
                                    }`}
                                  >
                                    {stageStatus[j] && (
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                  <span className={`text-sm ${stageStatus[j] ? "line-through" : ""}`} style={{ color: stageStatus[j] ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                                    {item}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-secondary)' }}>
                任务列表
                <span className="ml-2 text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  {project.tasks.length} 个
                </span>
              </h2>
              <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowNewRoot(true); setNewRootTitle(""); }}
                className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加任务
              </button>
              <button
                onClick={() => setShowBatchCreateModal(true)}
                className="flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition-all"
                style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 拆分
              </button>
              </div>
            </div>

            {showNewRoot && (
              <div className="mb-4 flex gap-2">
                <input
                  value={newRootTitle}
                  onChange={(e) => setNewRootTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addRootTask();
                    if (e.key === "Escape") { setShowNewRoot(false); setNewRootTitle(""); }
                  }}
                  className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                  placeholder="输入任务名称，按 Enter 添加"
                  autoFocus
                />
                <button
                  onClick={() => { setShowNewRoot(false); setNewRootTitle(""); }}
                  className="rounded-lg px-3 py-2 text-sm transition-colors"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}
                >
                  取消
                </button>
              </div>
            )}

            <TaskTree
              nodes={project.tasks.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate ?? undefined,
                projectId: t.projectId,
              }))}
              onNodeSelect={(id) => router.push(`/tasks?id=${id}`)}
              onNodeCheck={(id) => {
                const task = project.tasks.find(t => t.id === id);
                if (task) {
                  const newStatus = task.status === "done" ? "todo" : "done";
                  updateTask(id, { status: newStatus });
                  loadProject();
                }
              }}
            />
          </div>
        </div>

        <MobileNav activeItem="projects" />
      </main>
    </div>
  );
}
