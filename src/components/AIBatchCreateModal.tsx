"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface SubtaskItem {
  title: string;
  description: string;
}

interface IdentifiedTask {
  title: string;
  description: string;
  subtasks: SubtaskItem[];
}

interface AIBatchCreateModalProps {
  projectId?: string;
  projectName?: string;
  onClose: () => void;
  onConfirm: (projectId: string, tasks: IdentifiedTask[]) => void;
}

export default function AIBatchCreateModal({
  projectId: presetProjectId,
  projectName: presetProjectName,
  onClose,
  onConfirm,
}: AIBatchCreateModalProps) {
  const [inputText, setInputText] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(presetProjectId || "");
  const [tasks, setTasks] = useState<IdentifiedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "result">("input");

  useEffect(() => {
    if (!presetProjectId) fetchProjects();
  }, [presetProjectId]);

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) setProjects(await res.json());
    } catch {}
  }

  async function handleIdentify() {
    if (!inputText.trim()) {
      toast.error("请输入内容");
      return;
    }
    if (!presetProjectId && !selectedProjectId) {
      toast.error("请选择项目");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/batch-identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          projectContext: presetProjectName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "识别失败");
        return;
      }
      setTasks(data.tasks);
      setStep("result");
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function updateTaskField(ti: number, field: "title" | "description", value: string) {
    setTasks((prev) => {
      const updated = [...prev];
      updated[ti] = { ...updated[ti], [field]: value };
      return updated;
    });
  }

  function updateSubtaskField(ti: number, si: number, field: "title" | "description", value: string) {
    setTasks((prev) => {
      const updated = [...prev];
      const subtasks = [...updated[ti].subtasks];
      subtasks[si] = { ...subtasks[si], [field]: value };
      updated[ti] = { ...updated[ti], subtasks };
      return updated;
    });
  }

  function removeTask(ti: number) {
    setTasks((prev) => prev.filter((_, i) => i !== ti));
  }

  function addTask() {
    setTasks((prev) => [...prev, { title: "", description: "", subtasks: [] }]);
  }

  function addSubtask(ti: number) {
    setTasks((prev) => {
      const updated = [...prev];
      updated[ti] = { ...updated[ti], subtasks: [...updated[ti].subtasks, { title: "", description: "" }] };
      return updated;
    });
  }

  function removeSubtask(ti: number, si: number) {
    setTasks((prev) => {
      const updated = [...prev];
      updated[ti] = { ...updated[ti], subtasks: updated[ti].subtasks.filter((_, i) => i !== si) };
      return updated;
    });
  }

  function handleConfirm() {
    const validTasks = tasks.filter((t) => t.title.trim());
    if (validTasks.length === 0) {
      toast.error("请至少保留一个有效任务");
      return;
    }
    onConfirm(presetProjectId || selectedProjectId, validTasks);
    onClose();
  }

  const totalSubtasks = tasks.reduce((sum, t) => sum + t.subtasks.filter(s => s.title).length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI 智能识别 · 批量创建任务</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {step === "input"
                  ? "粘贴工作内容，AI 自动识别并拆分为多级任务"
                  : `已识别 ${tasks.length} 个任务 · ${totalSubtasks} 个子任务`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-[var(--bg-muted)]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
          {step === "input" ? (
            <>
              {!presetProjectId && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>选择项目</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                    style={{
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="">请选择项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>工作内容</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={10}
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all resize-none"
                  style={{
                    border: '1px solid var(--border-strong)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                  }}
                  placeholder="请描述你今天完成的工作内容，每条一行，系统将自动识别并创建任务记录"
                />
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>识别结果</label>
                <button onClick={addTask} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:bg-[var(--bg-muted)]"
                  style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  添加任务
                </button>
              </div>

              {tasks.map((task, ti) => (
                <div key={ti} className="rounded-xl p-4 space-y-3"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}>
                      {ti + 1}
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTaskField(ti, "title", e.target.value)}
                        className="w-full rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-all"
                        style={{
                          border: '1px solid var(--border-strong)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                        }}
                        placeholder="任务标题"
                      />
                      <textarea
                        value={task.description}
                        onChange={(e) => updateTaskField(ti, "description", e.target.value)}
                        rows={1}
                        className="w-full rounded-lg px-3 py-1.5 text-xs outline-none transition-all resize-none"
                        style={{
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--bg-root)',
                          color: 'var(--text-secondary)',
                        }}
                        placeholder="任务描述（可选）"
                      />
                    </div>
                    <button onClick={() => removeTask(ti)} className="p-1.5 rounded-lg transition-colors shrink-0 mt-0.5 hover:bg-[var(--color-danger-bg)]">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {task.subtasks.length > 0 && (
                    <div className="pl-9 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>子任务</span>
                        <button onClick={() => addSubtask(ti)}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] transition-all hover:bg-[var(--bg-muted)]"
                          style={{ border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          添加
                        </button>
                      </div>
                      {task.subtasks.map((sub, si) => (
                        <div key={si} className="flex items-start gap-2 group">
                          <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: 'var(--border-strong)' }} />
                          <input
                            type="text"
                            value={sub.title}
                            onChange={(e) => updateSubtaskField(ti, si, "title", e.target.value)}
                            className="flex-1 rounded-md px-2.5 py-1 text-xs outline-none transition-all"
                            style={{
                              border: '1px solid var(--border-default)',
                              backgroundColor: 'var(--bg-root)',
                              color: 'var(--text-secondary)',
                            }}
                            placeholder="子任务标题"
                          />
                          <button onClick={() => removeSubtask(ti, si)} className="p-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {task.subtasks.length === 0 && (
                    <div className="pl-9">
                      <button onClick={() => addSubtask(ti)} className="flex items-center gap-1 text-[11px] transition-colors"
                        style={{ color: 'var(--text-muted)' }}>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        添加子任务
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-root)' }}>
          {step === "input" ? (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: 'var(--text-muted)' }}>取消</button>
              <button
                onClick={handleIdentify}
                disabled={loading || !inputText.trim() || (!presetProjectId && !selectedProjectId)}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
              >
                {loading ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>AI 识别中...</>
                ) : (
                  <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>AI 识别并拆分</>
                )}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("input")} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: 'var(--text-muted)' }}>返回修改</button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                确认创建（{tasks.filter(t => t.title).length} 个任务）
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
