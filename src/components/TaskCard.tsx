"use client";

import { memo } from "react";
import { COLORS } from "@/lib/colors";
// 由 foundation-contract 任务迁移: formatDueDate / getTaskColor used to
// be defined locally here. They now live in `@/lib/task-helpers` so the
// page-level view and the card agree on the same implementation.
import { formatDueDate, getTaskColor } from "@/lib/task-helpers";

/** 根据背景色亮度自动选择黑/白文字色（YIQ 算法） */
function pickTextColor(hex: string): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#1f2937" : "#ffffff";
}

type TaskStatus = "todo" | "in_progress" | "done";

interface TaskTag {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  /** Numeric priority scale used by the local TaskCard: 1 = high, 2 = medium, 3 = low. */
  priority: 1 | 2 | 3;
  dueDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  isDaily: boolean;
  createdAt: Date;
  updatedAt: Date;
  projectId: string | null;
  project: string | null;
  isSop: boolean;
  parentId: string | null;
  /** Optional tag list — populated by callers that fetched `/api/tags` joined in. */
  tags?: TaskTag[];
  /** ISO datetime string for the next reminder. `null` means no reminder. */
  reminderAt?: string | null;
}

function formatTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function priorityRailColor(p: 1 | 2 | 3): string {
  if (p === 1) return COLORS.priority.high;
  if (p === 2) return COLORS.priority.medium;
  return COLORS.priority.low;
}

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onToggle?: () => void;
}

function TaskCardImpl({ task, onClick, onToggle }: TaskCardProps) {
  const colors = getTaskColor(task);
  const priorityColor = priorityRailColor(task.priority);
  const tags = task.tags ?? [];
  const reminderAt = task.reminderAt;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden animate-fade-in"
      style={{
        borderColor: colors.border,
        backgroundColor: task.status === "done" ? "var(--bg-muted)" : colors.bg,
        boxShadow: task.status === "done" ? "none" : "0 1px 3px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: priorityColor }}
      />

      <div className="p-3 pl-5">
        <div className="flex items-start justify-between gap-2">
          <h4
            className="font-medium text-sm flex-1 transition-colors"
            style={{
              textDecoration: task.status === "done" ? "line-through" : "none",
              color: task.status === "done" ? "var(--text-muted)" : colors.text,
            }}
          >
            {task.title}
          </h4>

          {onToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all hover:scale-110"
              style={{
                borderColor: task.status === "done" ? "var(--color-success)" : "var(--border-default)",
                backgroundColor:
                  task.status === "done" ? "var(--color-success)" : "transparent",
              }}
              aria-label={task.status === "done" ? "标记为未完成" : "标记为完成"}
            >
              {task.status === "done" && (
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24" stroke="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="white"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ backgroundColor: tag.color, color: pickTextColor(tag.color) }}
              >
                {tag.name}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{tags.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {task.project && (
            <span
              className="px-2 py-0.5 rounded-full bg-[var(--bg-muted)]"
              style={{ color: colors.text }}
            >
              {task.project}
            </span>
          )}

          {task.dueDate && (
            <span
              className="flex items-center gap-1"
              style={{
                color: task.status === "done" ? "var(--text-muted)" : colors.text + "CC",
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDueDate(task.dueDate)}
            </span>
          )}

          {/* Reminder chip — only renders when a reminder is set and not yet fired. */}
          {reminderAt && (
            <span
              className="flex items-center gap-1"
              style={{ color: task.status === "done" ? "var(--text-muted)" : COLORS.priority.high }}
              title={`提醒: ${new Date(reminderAt).toLocaleString("zh-CN")}`}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {formatTime(new Date(reminderAt))}
            </span>
          )}

          {task.completedAt && (
            <span className="flex items-center gap-1" style={{ color: "var(--color-success)" }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {formatTime(new Date(task.completedAt))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// React.memo — props are flat + referentially stable in the common
// case (the page-level view passes new closures only when it actually
// needs the card to re-render). The memo eliminates the bulk of the
// `tasks/page.tsx` re-render cost when the user toggles a single card.
export default memo(TaskCardImpl);
