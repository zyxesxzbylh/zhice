/**
 * Task helpers — pure functions for working with Task objects.
 *
 * Many components (TaskCard, NotificationBell, TaskContext, etc.) had
 * copies of the same formatters, priority converters, and color pickers.
 * This module consolidates them so behavior stays consistent and tests
 * can target a single import.
 *
 * Conventions:
 * - All helpers are pure. No React, no `Date.now()` reads — pass dates in
 *   so unit tests can pin time.
 * - `Task` here is a structural type that matches the Prisma `Task` row
 *   after JSON serialization (dates become strings, enums stay strings).
 *   This keeps the helpers usable in both server and client components.
 */

import {
  getStatusColor,
  getPriorityColor,
  pickProjectColor,
  type StatusToken,
  type PriorityToken,
} from "@/lib/theme";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

/** UI-level 1..3 priority. Some components (TaskCard, TaskContext) use this
 *  shorter scale; the API uses the four-value enum. The converters below
 *  keep the two in sync. */
export type NumericPriority = 1 | 2 | 3;

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "待开始",
  in_progress: "进行中",
  done: "已完成",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

/**
 * Stable iteration order for status/priority. Useful for column rendering
 * (kanban) and filter dropdowns.
 */
export const STATUS_ORDER: readonly TaskStatus[] = ["todo", "in_progress", "done"] as const;
export const PRIORITY_ORDER: readonly TaskPriority[] = ["urgent", "high", "medium", "low"] as const;

/* ------------------------------------------------------------------ *
 *  Conversion helpers
 * ------------------------------------------------------------------ */

export function priorityToNumber(p: TaskPriority): NumericPriority {
  switch (p) {
    case "urgent":
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
  }
}

export function numberToPriority(n: NumericPriority): TaskPriority {
  switch (n) {
    case 1:
      return "high";
    case 2:
      return "medium";
    case 3:
      return "low";
  }
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "todo" || value === "in_progress" || value === "done";
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    value === "low" || value === "medium" || value === "high" || value === "urgent"
  );
}

/* ------------------------------------------------------------------ *
 *  Date formatting
 * ------------------------------------------------------------------ */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function isDateLike(value: string | Date | null | undefined): value is string | Date {
  return value !== null && value !== undefined;
}

/**
 * Parse a date input. Accepts ISO strings, millisecond timestamps, or
 * `Date` objects. Returns `null` for nullish/empty inputs.
 */
export function toDate(value: string | Date | null | undefined): Date | null {
  if (!isDateLike(value)) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    if (value.trim() === "") return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format a due date. If the time-of-day is non-zero, prints
 * `YYYY/M/D HH:mm`; otherwise prints the date only. Matches the
 * legacy in-component implementation byte-for-byte.
 */
export function formatDueDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  if (d.getHours() || d.getMinutes()) {
    const h = pad2(d.getHours());
    const m = pad2(d.getMinutes());
    return `${y}/${mo}/${day} ${h}:${m}`;
  }
  return `${y}/${mo}/${day}`;
}

/** Format a time-of-day as `HH:mm`. */
export function formatTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Compact "x minutes/hours/days ago" string used by the notification
 * bell. Reference time defaults to `new Date()` but can be injected for
 * deterministic tests.
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  now: Date = new Date(),
): string {
  const d = toDate(value);
  if (!d) return "";
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return formatDueDate(d);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(diff / 86_400_000);
  if (days < 7) return `${days}天前`;
  return d.toLocaleDateString("zh-CN");
}

/* ------------------------------------------------------------------ *
 *  Task queries
 * ------------------------------------------------------------------ */

/**
 * A task is overdue when its due date is in the past and the task is
 * not yet completed. A null/undefined due date is never overdue.
 */
export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.status === "done") return false;
  const d = toDate(task.dueDate);
  if (!d) return false;
  return d.getTime() < now.getTime();
}

/**
 * A task is "due soon" when its due date is within `windowMs` (default
 * 24h) and it is not yet completed. Useful for notification badges.
 */
export function isDueSoon(
  task: Task,
  windowMs: number = 24 * 60 * 60 * 1000,
  now: Date = new Date(),
): boolean {
  if (task.status === "done") return false;
  const d = toDate(task.dueDate);
  if (!d) return false;
  const diff = d.getTime() - now.getTime();
  return diff >= 0 && diff <= windowMs;
}

export function isCompleted(task: Task): boolean {
  return task.status === "done";
}

export function isInProgress(task: Task): boolean {
  return task.status === "in_progress";
}

/* ------------------------------------------------------------------ *
 *  Sort / group / progress
 * ------------------------------------------------------------------ */

/**
 * Sort tasks in the order most useful for a "today" list:
 * 1. Overdue, then due-soon, then undated, then future (asc).
 * 2. Within the same bucket: higher priority first, then earlier due.
 */
export function sortTasksForToday(tasks: readonly Task[], now: Date = new Date()): Task[] {
  const bucket = (t: Task): number => {
    if (isOverdue(t, now)) return 0;
    if (isDueSoon(t, Number.POSITIVE_INFINITY, now)) return 1;
    const d = toDate(t.dueDate);
    if (!d) return 2;
    return 3;
  };
  return [...tasks].sort((a, b) => {
    const ba = bucket(a);
    const bb = bucket(b);
    if (ba !== bb) return ba - bb;
    const pa = PRIORITY_ORDER.indexOf(a.priority);
    const pb = PRIORITY_ORDER.indexOf(b.priority);
    if (pa !== pb) return pa - pb;
    const da = toDate(a.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
    const db = toDate(b.dueDate)?.getTime() ?? Number.POSITIVE_INFINITY;
    return da - db;
  });
}

/**
 * Group tasks by status. Always emits every status key, even if empty,
 * so column renderers don't need to special-case missing buckets.
 */
export function groupTasksByStatus(tasks: readonly Task[]): Record<TaskStatus, Task[]> {
  const out: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const t of tasks) {
    if (isTaskStatus(t.status)) out[t.status].push(t);
  }
  return out;
}

/**
 * Project progress as a 0..1 ratio. Returns 0 for an empty list.
 */
export function calculateProgress(tasks: readonly Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(isCompleted).length;
  return done / tasks.length;
}

/* ------------------------------------------------------------------ *
 *  Visual mapping
 * ------------------------------------------------------------------ */

export interface StatusVisual {
  bg: string;
  border: string;
  text: string;
}

export interface PriorityVisual extends StatusVisual {
  dot: string;
}

export function taskStatusVisual(status: string | null | undefined): StatusVisual {
  return getStatusColor(status);
}

export function taskPriorityVisual(priority: string | null | undefined): PriorityVisual {
  return getPriorityColor(priority) as PriorityVisual;
}

/**
 * Pick the chrome color for a task. SOP/daily tasks get their own accent;
 * everything else falls through to the project hash. Returns a triple
 * compatible with `style={{ backgroundColor, borderColor, color }}`.
 */
export function taskChromeColor(task: { isSop?: boolean; project?: string | null }): StatusVisual {
  if (task.isSop) {
    return { bg: "#4b5563", border: "#6b7280", text: "#ffffff" };
  }
  const color = pickProjectColor(task.project ?? null);
  return { bg: color, border: color, text: "#ffffff" };
}

/* ------------------------------------------------------------------ *
 *  Normalization (used by TaskContext)
 * ------------------------------------------------------------------ */

export interface NormalizedTask extends Task {
  isDaily: boolean;
  project: string | null;
  isSop: boolean;
  parentId: string | null;
}

/**
 * Normalize a row from the `/api/tasks` endpoint into the shape used by
 * client components. Tolerates missing/extra fields so older API
 * versions keep working.
 */
export function normalizeTask(input: Record<string, unknown>): NormalizedTask | null {
  const id = typeof input.id === "string" ? input.id : null;
  const title = typeof input.title === "string" ? input.title : null;
  if (!id || !title) return null;

  const statusValue: TaskStatus = isTaskStatus(input.status) ? input.status : "todo";
  const priorityValue: TaskPriority = isTaskPriority(input.priority) ? input.priority : "medium";

  const projectField = input.project;
  const projectName =
    typeof projectField === "string"
      ? projectField
      : projectField &&
          typeof projectField === "object" &&
          "name" in projectField &&
          typeof (projectField as { name: unknown }).name === "string"
        ? (projectField as { name: string }).name
        : null;

  const due = toDate(typeof input.dueDate === "string" ? input.dueDate : null);
  const created = toDate(typeof input.createdAt === "string" ? input.createdAt : null) ?? new Date();
  const updated = toDate(typeof input.updatedAt === "string" ? input.updatedAt : null) ?? created;

  return {
    id,
    projectId: typeof input.projectId === "string" ? input.projectId : "",
    parentTaskId:
      typeof input.parentTaskId === "string" || input.parentTaskId === null
        ? (input.parentTaskId as string | null)
        : null,
    title,
    description: typeof input.description === "string" ? input.description : null,
    status: statusValue,
    priority: priorityValue,
    dueDate: due ? due.toISOString() : null,
    startTime: typeof input.startTime === "string" ? input.startTime : null,
    endTime: typeof input.endTime === "string" ? input.endTime : null,
    completedAt: typeof input.completedAt === "string" ? input.completedAt : null,
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
    isDaily: false,
    project: projectName,
    isSop: Boolean(input.isSop),
    parentId:
      typeof input.parentTaskId === "string" || input.parentTaskId === null
        ? (input.parentTaskId as string | null)
        : null,
  };
}
