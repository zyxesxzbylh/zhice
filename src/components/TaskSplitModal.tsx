"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface TaskSplitModalProps {
  taskId: string;
  taskTitle: string;
  onTaskSplit: () => void;
}

export default function TaskSplitModal({ taskId, taskTitle, onTaskSplit }: TaskSplitModalProps) {
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
      } else {
        toast.error("AI 拆分失败");
      }
    } catch {
      toast.error("AI 拆分服务异常");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmSplit() {
    if (subtasks.length === 0) {
      toast.error("请先生成子任务");
      return;
    }

    setLoading(true);
    try {
      for (const title of subtasks) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: null,
            parentTaskId: taskId,
            title: title.trim(),
            status: "todo",
            priority: "medium",
          }),
        });
      }
      toast.success(`已添加 ${subtasks.length} 个子任务`);
      onTaskSplit();
    } catch {
      toast.error("添加子任务失败");
    } finally {
      setLoading(false);
    }
  }

  function handleCustomAdd() {
    if (!customInput.trim()) return;
    setSubtasks([...subtasks, customInput.trim()]);
    setCustomInput("");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleAISplit("拆分为 3 个子任务")}
        disabled={loading}
        className="px-3 py-1.5 text-xs text-white rounded transition-colors disabled:opacity-50"
        style={{ backgroundColor: 'var(--text-secondary)' }}
      >
        AI 拆分
      </button>

      {subtasks.length > 0 && (
        <button
          onClick={handleConfirmSplit}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-white rounded transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--text-secondary)' }}
        >
          确认 ({subtasks.length})
        </button>
      )}

      {subtasks.length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-64 border rounded-lg shadow-xl p-3 z-50"
          style={{ backgroundColor: 'var(--bg-muted)', borderColor: 'var(--border-strong)' }}>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>生成的子任务：</p>
          <ul className="space-y-1 mb-3">
            {subtasks.map((st, i) => (
              <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--text-muted)' }} />
                {st}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomAdd()}
              placeholder="自定义添加..."
              className="flex-1 px-2 py-1 text-xs border rounded outline-none"
              style={{
                backgroundColor: 'var(--bg-root)',
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={handleCustomAdd}
              className="px-2 py-1 text-xs text-white rounded transition-colors"
              style={{ backgroundColor: 'var(--bg-muted-hover)' }}
            >
              添加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
