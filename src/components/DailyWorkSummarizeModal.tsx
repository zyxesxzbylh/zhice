"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  project?: string;
  dueDate?: string;
}

interface DailyWorkSummarizeModalProps {
  tasks: TaskItem[];
  onClose: () => void;
}

export default function DailyWorkSummarizeModal({
  tasks,
  onClose,
}: DailyWorkSummarizeModalProps) {
  const [loading, setLoading] = useState(false);
  const [achievement, setAchievement] = useState("");
  const [tomorrowTodos, setTomorrowTodos] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [incompleteCount, setIncompleteCount] = useState(0);

  useEffect(() => {
    doSummarize();
  }, []);

  async function doSummarize() {
    const completed = tasks.filter((t) => t.status === "done");
    const incomplete = tasks.filter((t) => t.status !== "done");

    setCompletedCount(completed.length);
    setIncompleteCount(incomplete.length);

    if (tasks.length === 0) {
      setAchievement("今日暂无任务记录。");
      setTomorrowTodos("继续保持，明天可以规划新的工作内容。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tasks/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedTasks: completed.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            status: t.status,
            projectName: t.project || "",
          })),
          incompleteTasks: incomplete.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description || "",
            status: t.status,
            projectName: t.project || "",
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "总结失败");
        if (completed.length > 0) {
          setAchievement(`今日完成 ${completed.length} 个任务：\n${completed.map((t) => `• ${t.title}`).join("\n")}`);
        } else {
          setAchievement("今日暂无已完成的任务。");
        }
        if (incomplete.length > 0) {
          setTomorrowTodos(`明日待继续处理 ${incomplete.length} 个任务：\n${incomplete.map((t) => `• ${t.title}`).join("\n")}`);
        } else {
          setTomorrowTodos("所有任务已完成，表现优秀！");
        }
        return;
      }

      setAchievement(data.achievement);
      setTomorrowTodos(data.tomorrowTodos);
    } catch {
      toast.error("网络错误，请稍后重试");
      if (completed.length > 0) {
        setAchievement(`今日完成 ${completed.length} 个任务：\n${completed.map((t) => `• ${t.title}`).join("\n")}`);
      } else {
        setAchievement("今日暂无已完成的任务。");
      }
      if (incomplete.length > 0) {
        setTomorrowTodos(`明日待继续处理 ${incomplete.length} 个任务：\n${incomplete.map((t) => `• ${t.title}`).join("\n")}`);
      } else {
        setTomorrowTodos("所有任务已完成，表现优秀！");
      }
    } finally {
      setLoading(false);
    }
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}>
        <div className="p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>今日总结 · {todayStr}</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                自动分析今日任务完成情况，生成成果与明日计划
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full transition-colors hover:bg-[var(--bg-muted)]">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[55vh] space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <svg className="animate-spin h-10 w-10" fill="none" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AI 正在分析今日任务...</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--color-success-bg)', borderColor: 'var(--color-success-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-success)] flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-success-text)' }}>今日成果</h3>
                    <span className="text-xs" style={{ color: 'var(--color-success)' }}>已完成 {completedCount} 个任务</span>
                  </div>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-success-text)' }}>
                  {achievement || "加载中..."}
                </div>
              </div>

              <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--color-info-bg)', borderColor: 'var(--color-info-border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--color-info)] flex items-center justify-center">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--color-info-text)' }}>明日待办</h3>
                    <span className="text-xs" style={{ color: 'var(--color-info)' }}>待处理 {incompleteCount} 个任务</span>
                  </div>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-info-text)' }}>
                  {tomorrowTodos || "加载中..."}
                </div>
              </div>

              {tasks.length === 0 && (
                <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                  今日暂无任务数据
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 flex justify-end"
          style={{
            borderTop: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-root)',
          }}>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--text-inverse)',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
