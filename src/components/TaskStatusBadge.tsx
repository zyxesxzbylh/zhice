"use client";

import { memo } from "react";

type TaskStatus = "todo" | "in_progress" | "done";

const STATUS_CONFIG = {
  todo: { label: "待开始", bg: "var(--bg-muted)", text: "var(--text-muted)", border: "var(--border-default)" },
  in_progress: { label: "进行中", bg: "var(--color-info-bg)", text: "var(--color-info)", border: "var(--color-info-border)" },
  done: { label: "已完成", bg: "var(--color-success-bg)", text: "var(--color-success)", border: "var(--color-success-border)" },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
}

export default function TaskStatusBadge({ status }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span 
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-200"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      {status === 'in_progress' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
