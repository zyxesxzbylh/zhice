"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import AITextToProjectModal from "@/components/AITextToProjectModal";

interface Stage {
  name: string;
  checklist: string[];
  dueDate?: string;
}

function emptyStage(): Stage {
  const now = new Date();
  return { name: "", checklist: [""], dueDate: now.toISOString().slice(0, 16) };
}

interface TaskTemplateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export default function TaskTemplateModal({ onClose, onCreated }: TaskTemplateModalProps) {
  const [name, setName] = useState("");
  const [stages, setStages] = useState<Stage[]>([emptyStage()]);
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAIModal, setShowAIModal] = useState(false);

  function addStage() {
    setStages((prev) => [...prev, emptyStage()]);
  }

  function removeStage(index: number) {
    if (stages.length <= 1) return;
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStage(index: number, value: string) {
    setStages((prev) => prev.map((s, i) => (i === index ? { ...s, name: value } : s)));
  }

  function addChecklist(stageIndex: number) {
    setStages((prev) =>
      prev.map((s, i) => (i === stageIndex ? { ...s, checklist: [...s.checklist, ""] } : s))
    );
  }

  function updateChecklist(stageIndex: number, itemIndex: number, value: string) {
    setStages((prev) =>
      prev.map((s, i) =>
        i === stageIndex
          ? { ...s, checklist: s.checklist.map((c, j) => (j === itemIndex ? value : c)) }
          : s
      )
    );
  }

  function removeChecklist(stageIndex: number, itemIndex: number) {
    setStages((prev) =>
      prev.map((s, i) =>
        i === stageIndex
          ? { ...s, checklist: s.checklist.filter((_, j) => j !== itemIndex) }
          : s
      )
    );
  }

  function handleAIConfirm(
    projectName: string,
    _description: string,
    aiStages: { name: string; checklist: string[] }[]
  ) {
    setName(projectName);
    setStages(
      aiStages.map((s, index) => {
        const now = new Date();
        now.setDate(now.getDate() + index);
        return {
          name: s.name,
          checklist: s.checklist.length > 0 ? s.checklist : [""],
          dueDate: now.toISOString().slice(0, 16),
        };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validStages = stages
      .map((s) => ({
        name: s.name.trim(),
        checklist: s.checklist.map((c) => c.trim()).filter(Boolean),
        dueDate: s.dueDate,
      }))
      .filter((s) => s.name);

    if (!name.trim()) {
      setError("请输入模板名称");
      return;
    }
    if (validStages.length === 0) {
      setError("至少需要一个有效的流程阶段");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), stages: validStages, deadline: deadline || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "创建失败");
        return;
      }

      toast.success("模板创建成功");
      onCreated();
      onClose();
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-16 overflow-y-auto">
        <div className="rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col" style={{ backgroundColor: 'var(--bg-surface)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>新建 SOP 模板</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>定义标准化流程，方便重复使用</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAIModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-muted)' }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI 智能识别
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  模板名称 <span className="text-[var(--text-muted)]">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  placeholder="例如：软件开发流程、季度OKR推进"
                />
              </div>

              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>应用期限</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>流程阶段</label>
                  <button
                    type="button"
                    onClick={addStage}
                    className="text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    + 添加阶段
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {stages.map((stage, i) => (
                    <div key={i} className="rounded-lg p-4" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-root)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                          阶段 {i + 1}
                        </span>
                        {stages.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStage(i)}
                            className="text-xs hover:text-[var(--color-danger)]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            删除
                          </button>
                        )}
                      </div>
                      <input
                        value={stage.name}
                        onChange={(e) => updateStage(i, e.target.value)}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        placeholder="阶段名称，如：需求分析"
                      />

                      <div className="mt-2">
                        <label className="block text-[11px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>阶段截止时间</label>
                        <input
                          type="datetime-local"
                          value={stage.dueDate || ""}
                          onChange={(e) => {
                            setStages((prev) =>
                              prev.map((s, idx) => (idx === i ? { ...s, dueDate: e.target.value } : s))
                            );
                          }}
                          className="w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                          style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                        />
                      </div>

                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>检查清单</span>
                          <button
                            type="button"
                            onClick={() => addChecklist(i)}
                            className="text-[11px]"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            + 添加
                          </button>
                        </div>
                        {stage.checklist.map((item, j) => (
                          <div key={j} className="mb-1 flex items-center gap-2">
                            <span className="text-[11px] shrink-0" style={{ color: 'var(--text-muted)' }}>&#8226;</span>
                            <input
                              value={item}
                              onChange={(e) => updateChecklist(i, j, e.target.value)}
                              className="flex-1 rounded px-2 py-1 text-xs outline-none"
                              style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                              placeholder="检查项"
                            />
                            {stage.checklist.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeChecklist(i, j)}
                                className="text-[11px] shrink-0"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                &#10005;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm transition-colors"
                  style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
                >
                  {saving ? "保存中..." : "保存模板"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showAIModal && (
        <AITextToProjectModal
          onClose={() => setShowAIModal(false)}
          onConfirm={handleAIConfirm}
        />
      )}
    </>
  );
}
