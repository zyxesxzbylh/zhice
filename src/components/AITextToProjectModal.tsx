"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface StageData {
  name: string;
  checklist: string[];
}

interface AITextToProjectModalProps {
  onClose: () => void;
  onConfirm: (projectName: string, description: string, stages: StageData[]) => void;
}

export default function AITextToProjectModal({ onClose, onConfirm }: AITextToProjectModalProps) {
  const [inputText, setInputText] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "result">("input");

  async function handleAnalyze() {
    if (!inputText.trim()) {
      toast.error("请输入内容");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/text-to-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "识别失败");
        return;
      }
      setProjectName(data.projectName);
      setDescription(data.description);
      setStages(data.stages);
      setStep("result");
    } catch {
      toast.error("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  function updateStageName(index: number, value: string) {
    setStages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: value };
      return updated;
    });
  }

  function updateChecklistItem(stageIndex: number, itemIndex: number, value: string) {
    setStages((prev) => {
      const updated = [...prev];
      const checklist = [...updated[stageIndex].checklist];
      checklist[itemIndex] = value;
      updated[stageIndex] = { ...updated[stageIndex], checklist };
      return updated;
    });
  }

  function removeChecklistItem(stageIndex: number, itemIndex: number) {
    setStages((prev) => {
      const updated = [...prev];
      const checklist = updated[stageIndex].checklist.filter((_, i) => i !== itemIndex);
      updated[stageIndex] = { ...updated[stageIndex], checklist };
      return updated;
    });
  }

  function addChecklistItem(stageIndex: number) {
    setStages((prev) => {
      const updated = [...prev];
      const checklist = [...updated[stageIndex].checklist, ""];
      updated[stageIndex] = { ...updated[stageIndex], checklist };
      return updated;
    });
  }

  function removeStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  function addStage() {
    setStages((prev) => [...prev, { name: "", checklist: [""] }]);
  }

  function handleConfirm() {
    const validStages = stages
      .map((s) => ({
        name: s.name.trim(),
        checklist: s.checklist.filter((item) => item.trim()),
      }))
      .filter((s) => s.name && s.checklist.length > 0);

    if (!projectName.trim()) {
      toast.error("请填写项目名称");
      return;
    }
    if (validStages.length === 0) {
      toast.error("请至少保留一个有效阶段");
      return;
    }
    onConfirm(projectName.trim(), description.trim(), validStages);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI 智能识别 · 创建项目</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {step === "input"
                  ? "粘贴或输入工作内容，AI 将自动整理为结构化项目"
                  : "确认 AI 生成的项目信息，可编辑后一键创建"}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-[var(--bg-muted)]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[62vh] space-y-5">
          {step === "input" ? (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>输入内容</label>
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
                placeholder="描述你的项目需求和阶段划分，系统将自动生成项目结构和任务列表"
              />
            </div>
          ) : (
            <>
              <div className="space-y-4 rounded-xl p-4" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                <div>
                  <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>项目名称</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
                    style={{
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="项目名称"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>项目描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all resize-none"
                    style={{
                      border: '1px solid var(--border-strong)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                    placeholder="项目描述（可选）"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                    工作阶段
                    <span className="ml-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>({stages.length} 个)</span>
                  </label>
                  <button
                    onClick={addStage}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all hover:bg-[var(--bg-muted)]"
                    style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
                  >
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    添加阶段
                  </button>
                </div>
                <div className="space-y-3">
                  {stages.map((stage, si) => (
                    <div key={si} className="rounded-lg p-4 space-y-3"
                      style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}>
                          {si + 1}
                        </div>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStageName(si, e.target.value)}
                          className="flex-1 rounded-lg px-3 py-1.5 text-sm font-medium outline-none transition-all"
                          style={{
                            border: '1px solid var(--border-strong)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)',
                          }}
                          placeholder="阶段名称"
                        />
                        <button
                          onClick={() => removeStage(si)}
                          className="p-1.5 rounded-lg transition-colors shrink-0 hover:bg-[var(--color-danger-bg)]"
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <div className="pl-9 space-y-1.5">
                        {stage.checklist.map((item, ci) => (
                          <div key={ci} className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--border-strong)' }} />
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateChecklistItem(si, ci, e.target.value)}
                              className="flex-1 rounded-md px-2.5 py-1 text-xs outline-none transition-all"
                              style={{
                                border: '1px solid var(--border-default)',
                                backgroundColor: 'var(--bg-root)',
                                color: 'var(--text-secondary)',
                              }}
                              placeholder="检查项"
                            />
                            <button
                              onClick={() => removeChecklistItem(si, ci)}
                              className="p-1 rounded transition-colors shrink-0 hover:bg-[var(--bg-muted)]"
                            >
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addChecklistItem(si)}
                          className="flex items-center gap-1 pl-1 text-xs transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          添加检查项
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 flex items-center justify-between gap-3"
          style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--bg-root)' }}>
          {step === "input" ? (
            <>
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: 'var(--text-muted)' }}>
                取消
              </button>
              <button
                onClick={handleAnalyze}
                disabled={loading || !inputText.trim()}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI 识别中...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI 智能识别
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("input")} className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-muted)]"
                style={{ color: 'var(--text-muted)' }}>
                返回修改
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                确认创建项目（{stages.length} 个阶段）
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
