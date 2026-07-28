"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

/* ─── 类型 ─── */

export type BatchCommand =
  | "delete"
  | "move-to-project"
  | "change-priority"
  | "change-status"
  | "set-due-date"
  | "clone"
  | "archive"
  | "merge-check";
export type BatchStatus = "todo" | "in-progress" | "done" | "canceled";
export type BatchPriority = "low" | "medium" | "high" | "urgent";

export interface BatchAction {
  command: BatchCommand;
  label: string;
  icon: string;
  enabled: boolean;
  dangerous?: boolean;
}

export interface ProjectOption {
  id: string;
  name: string;
}

/* ─── BatchActions 组件 ─── */

interface Props {
  selectedCount: number;
  selectedIds: string[];
  projectId?: string;
  onClearSelection?: () => void;
  onRefetch?: () => void;
  className?: string;
}

export function BatchActions({
  selectedCount,
  selectedIds,
  projectId,
  onClearSelection,
  onRefetch,
  className,
}: Props) {
  const [confirming, setConfirming] = useState<BatchCommand | null>(null);
  const [moveProjectId, setMoveProjectId] = useState("");
  const [priorityValue, setPriorityValue] = useState<BatchPriority>("medium");
  const [statusValue, setStatusValue] = useState<BatchStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  /* 加载项目列表 */
  async function loadProjects() {
    if (projectsLoaded) return;
    setProjectsLoaded(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      // 静默失败
    }
  }

  /* 执行批量操作 */
  async function executeAction(command: BatchCommand) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          command,
          ...(command === "move-to-project" && { targetProjectId: moveProjectId }),
          ...(command === "change-priority" && { priority: priorityValue }),
          ...(command === "change-status" && { status: statusValue }),
          ...(command === "set-due-date" && { dueDate }),
          ...(command === "clone" && { targetProjectId: projectId }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "操作失败");
      }

      const actionMap: Record<string, string> = {
        delete: "已删除",
        "move-to-project": "已移动",
        "change-priority": "已更新优先级",
        "change-status": "已更新状态",
        "set-due-date": "已设置截止日期",
        clone: "已克隆",
        archive: "已归档",
        "merge-check": "已批量勾选",
      };
      toast.success(`${actionMap[command] || "操作完成"} ${selectedCount} 个任务`);
      setConfirming(null);
      onClearSelection?.();
      onRefetch?.();
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    } finally {
      setLoading(false);
    }
  }

  const actions: BatchAction[] = [
    {
      command: "merge-check",
      label: `批量勾选 (${selectedCount})`,
      icon: "check",
      enabled: selectedCount > 0,
    },
    {
      command: "change-status",
      label: "更改状态",
      icon: "status",
      enabled: selectedCount > 0,
    },
    {
      command: "change-priority",
      label: "更改优先级",
      icon: "priority",
      enabled: selectedCount > 0,
    },
    {
      command: "set-due-date",
      label: "设置截止日期",
      icon: "calendar",
      enabled: selectedCount > 0,
    },
    {
      command: "move-to-project",
      label: "移动到项目",
      icon: "move",
      enabled: selectedCount > 0,
    },
    {
      command: "clone",
      label: `克隆到当前项目`,
      icon: "clone",
      enabled: selectedCount > 0 && !!projectId,
    },
    {
      command: "archive",
      label: "归档",
      icon: "archive",
      enabled: selectedCount > 0,
    },
    {
      command: "delete",
      label: "删除",
      icon: "delete",
      enabled: selectedCount > 0,
      dangerous: true,
    },
  ];

  const icons: Record<string, React.ReactNode> = {
    check: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    status: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    ),
    priority: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ),
    calendar: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    move: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    clone: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    archive: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    delete: (
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* 按钮行 */}
      <div className="flex items-center gap-1 flex-wrap">
        {actions.map((action) => (
          <button
            key={action.command}
            disabled={!action.enabled}
            onClick={() => {
              if (action.command === "move-to-project") loadProjects();
              if (action.command === "merge-check") {
                executeAction(action.command);
              } else {
                setConfirming(action.command);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors disabled:opacity-40 border"
            style={{
              backgroundColor: confirming === action.command ? 'var(--bg-muted)' : undefined,
              borderColor: action.dangerous ? 'var(--color-danger-border)' : 'var(--border-default)',
              color: action.dangerous ? 'var(--color-danger)' : 'var(--text-secondary)',
            }}
          >
            {icons[action.icon]}
            {action.label}
          </button>
        ))}
        {onClearSelection && (
          <button
            onClick={onClearSelection}
            className="text-xs px-2 py-1 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            取消选择
          </button>
        )}
      </div>

      {/* 确认面板 */}
      {confirming && confirming !== "merge-check" && (
        <div className="rounded-lg p-3 border space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: confirming === "delete" ? 'var(--color-danger-border)' : 'var(--border-default)',
          }}>
          {/* 确认文字 */}
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {confirming === "delete" ? (
              <span style={{ color: 'var(--color-danger)' }}>确定要删除 {selectedCount} 个任务吗？此操作不可撤销。</span>
            ) : confirming === "move-to-project" ? (
              `选择要移入的项目`
            ) : confirming === "change-priority" ? (
              `为 ${selectedCount} 个任务设置优先级`
            ) : confirming === "change-status" ? (
              `为 ${selectedCount} 个任务设置状态`
            ) : confirming === "set-due-date" ? (
              `为 ${selectedCount} 个任务设置截止日期`
            ) : confirming === "archive" ? (
              `确定要归档 ${selectedCount} 个任务吗？`
            ) : (
              `确定要克隆 ${selectedCount} 个任务到当前项目吗？`
            )}
          </p>

          {/* 项目选择器 */}
          {confirming === "move-to-project" && (
            <select
              value={moveProjectId}
              onChange={(e) => setMoveProjectId(e.target.value)}
              className="w-full rounded text-xs px-2.5 py-1.5 outline-none"
              style={{
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value="">请选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* 优先级选择器 */}
          {confirming === "change-priority" && (
            <select
              value={priorityValue}
              onChange={(e) => setPriorityValue(e.target.value as BatchPriority)}
              className="w-full rounded text-xs px-2.5 py-1.5 outline-none"
              style={{
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value="low">低优先</option>
              <option value="medium">中等</option>
              <option value="high">高优先</option>
              <option value="urgent">紧急</option>
            </select>
          )}

          {/* 状态选择器 */}
          {confirming === "change-status" && (
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value as BatchStatus)}
              className="w-full rounded text-xs px-2.5 py-1.5 outline-none"
              style={{
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            >
              <option value="todo">待办</option>
              <option value="in-progress">进行中</option>
              <option value="done">已完成</option>
              <option value="canceled">已取消</option>
            </select>
          )}

          {/* 日期选择器 */}
          {confirming === "set-due-date" && (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded text-xs px-2.5 py-1.5 outline-none"
              style={{
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
              }}
            />
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setConfirming(null)}
              className="text-xs px-3 py-1 rounded transition-colors"
              style={{
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
              }}
            >
              取消
            </button>
            <button
              onClick={() => executeAction(confirming!)}
              disabled={
                loading ||
                (confirming === "move-to-project" && !moveProjectId)
              }
              className="text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
              style={{
                backgroundColor: confirming === "delete" ? 'var(--color-danger)' : 'var(--accent)',
                color: 'var(--text-inverse)',
              }}
            >
              {loading ? "执行中..." : "确认"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
