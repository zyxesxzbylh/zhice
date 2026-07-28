"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

interface Stage {
  name: string;
  checklist: string[];
  dueDate?: string;
}

interface FlowTemplate {
  id: string;
  name: string;
  stages: Stage[];
  deadline?: string;
}

function emptyStage(): Stage {
  const now = new Date();
  return { name: "", checklist: [""], dueDate: now.toISOString().slice(0, 16) };
}

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [stages, setStages] = useState<Stage[]>([emptyStage()]);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("模板不存在");
        return res.json();
      })
      .then((data: FlowTemplate) => {
        setName(data.name);
        setDeadline(data.deadline || "");
        setStages(
          data.stages.length > 0
            ? data.stages.map((s, index) => {
                const now = new Date();
                now.setDate(now.getDate() + index);
                return {
                  name: s.name,
                  checklist: s.checklist.length > 0 ? s.checklist : [""],
                  dueDate: (s as any).dueDate || now.toISOString().slice(0, 16),
                };
              })
            : [emptyStage()]
        );
        setLoading(false);
      })
      .catch(() => {
        router.push("/templates");
      });
  }, [id]);

  function addStage() {
    setStages((prev) => [...prev, emptyStage()]);
  }

  function removeStage(index: number) {
    if (stages.length <= 1) return;
    setStages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStage(index: number, value: string) {
    setStages((prev) =>
      prev.map((s, i) => (i === index ? { ...s, name: value } : s))
    );
  }

  function addChecklist(stageIndex: number) {
    setStages((prev) =>
      prev.map((s, i) =>
        i === stageIndex ? { ...s, checklist: [...s.checklist, ""] } : s
      )
    );
  }

  function updateChecklist(stageIndex: number, itemIndex: number, value: string) {
    setStages((prev) =>
      prev.map((s, i) =>
        i === stageIndex
          ? {
              ...s,
              checklist: s.checklist.map((c, j) => (j === itemIndex ? value : c)),
            }
          : s
      )
    );
  }

  function removeChecklist(stageIndex: number, itemIndex: number) {
    setStages((prev) =>
      prev.map((s, i) =>
        i === stageIndex
          ? {
              ...s,
              checklist: s.checklist.filter((_, j) => j !== itemIndex),
            }
          : s
      )
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
      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), stages: validStages, deadline: deadline || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "保存失败");
        return;
      }

      router.push("/templates");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <p style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh" style={{ backgroundColor: 'var(--bg-root)' }}>
      <header className="border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/templates")} className="text-sm" style={{ color: 'var(--text-muted)' }}>
              ← 返回
            </button>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>编辑模板</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              模板名称 <span style={{ color: 'var(--text-muted)' }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
              placeholder="例如：软件开发流程"
            />
          </div>

          <div>
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>应用期限</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-1"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                流程阶段
              </label>
              <button
                type="button"
                onClick={addStage}
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                + 添加阶段
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="rounded-lg p-4"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      阶段 {i + 1}
                    </span>
                    {stages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStage(i)}
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        删除阶段
                      </button>
                    )}
                  </div>
                  <input
                    value={stage.name}
                    onChange={(e) => updateStage(i, e.target.value)}
                    className="mt-2 w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                    placeholder="阶段名称，如：需求分析"
                  />
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>阶段截止时间</label>
                    <input
                      type="datetime-local"
                      value={stage.dueDate || ""}
                      onChange={(e) => {
                        setStages((prev) =>
                          prev.map((s, index) =>
                            index === i ? { ...s, dueDate: e.target.value } : s
                          )
                        );
                      }}
                      className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                      style={{ border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>检查清单</span>
                      <button
                        type="button"
                        onClick={() => addChecklist(i)}
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        + 添加项
                      </button>
                    </div>
                    {stage.checklist.map((item, j) => (
                      <div key={j} className="mb-1 flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                        <input
                          value={item}
                          onChange={(e) => updateChecklist(i, j, e.target.value)}
                          className="flex-1 rounded px-2 py-1 text-sm outline-none"
                          style={{ border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
                          placeholder="检查项"
                        />
                        {stage.checklist.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeChecklist(i, j)}
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            ✕
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

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            {saving ? "保存中..." : "保存修改"}
          </button>
        </form>
      </div>
    </main>
  );
}
