/**
 * `task-helpers` — shared task-related utilities used by both the
 * monolithic `src/app/tasks/page.tsx` and individual cards/lists
 * (`TaskCard`, `TaskTree`, etc.).
 *
 * 由 foundation-contract 任务迁移 (2026-06-08): these helpers used to
 * live as private functions inside the page-level component, which
 * meant every card, tree, and modal had its own near-identical copy.
 * This module is the single source of truth.
 *
 * Conventions:
 *  - The exported `Task` interface is a *structural subset* — the
 *    local `Task` types in `tasks/page.tsx` and `TaskCard.tsx` are
 *    assignable to it, so call sites keep their own fuller types.
 *  - The helpers are pure. No React, no `Date.now()` reads.
 *  - Function names match the original in-component names exactly so
 *    existing call sites don't have to change.
 */

/* ------------------------------------------------------------------ *
 *  Color constants — kept here so `getTaskColor` and
 *  `hashStringToColor` agree on the same swatch set.
 * ------------------------------------------------------------------ */

const PROJECT_COLORS = ["#374151", "#4b5563", "#6b7280", "#52525b", "#57534e", "#44403c"] as const;
const SOP_COLOR = "#4b5563";
const CHILD_OPACITY = "CC";

/* ------------------------------------------------------------------ *
 *  Task shape (structural subset)
 * ------------------------------------------------------------------ */

/**
 * Minimum fields required by the helpers in this file. The local
 * `Task` types in `tasks/page.tsx`, `TaskCard.tsx`, etc. are all
 * assignable to this (TypeScript is structural).
 */
export interface Task {
  isSop: boolean;
  project: string | null;
}

/* ------------------------------------------------------------------ *
 *  Time / date helpers (由 foundation-contract 任务迁移)
 * ------------------------------------------------------------------ */

/**
 * Convert a `HH:mm` time string to a fractional hour count. Returns
 * `0` for null/empty input.
 */
export function timeToHours(timeStr: string | null): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  return h + m / 60;
}

/**
 * Format a `Date` as `YYYY/M/D` or `YYYY/M/D HH:mm` (when the time
 * component is non-zero). Matches the legacy in-component behavior
 * byte-for-byte.
 */
export function formatDueDate(d: Date | null | undefined): string {
  if (!d) return "";
  const y = d.getFullYear();
  const mo = d.getMonth() + 1;
  const day = d.getDate();
  if (d.getHours() || d.getMinutes()) {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${mo}/${day} ${h}:${m}`;
  }
  return `${y}/${mo}/${day}`;
}

/**
 * Stable, deterministic color from a string. Hashes the input and
 * picks one of `PROJECT_COLORS` so the same project name always
 * renders the same accent. Returns a neutral gray for empty input.
 */
export function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length];
}

/**
 * Locale-free date key (`YYYY-MM-DD`) suitable for use as a Map key
 * when bucketing tasks by day.
 */
export function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ *
 *  Color resolver (由 foundation-contract 任务迁移)
 * ------------------------------------------------------------------ */

export interface TaskColor {
  bg: string;
  border: string;
  text: string;
}

/**
 * Resolve a task's chrome color.
 *  - SOP tasks get the dedicated `SOP_COLOR` (cool-gray on near-white text).
 *  - Children of a project (`parentColor` provided) get a softer
 *    gray so the project accent stays distinct on the parent card.
 *  - Top-level tasks fall through to the project-hash color.
 */
export function getTaskColor(task: Task, parentColor?: string): TaskColor {
  if (task.isSop) {
    return { bg: "#4b5563", border: "#6b7280", text: "#f9fafb" };
  }
  if (parentColor) {
    return { bg: "#d1d5db", border: "#9ca3af", text: "#374151" };
  }
  const color = task.project ? hashStringToColor(task.project) : "#6b7280";
  return { bg: color, border: color, text: "#ffffff" };
}

/* ------------------------------------------------------------------ *
 *  Internal constants — re-exported for callers that need the raw
 *  swatch list (e.g. tests) or the SOP color constant.
 * ------------------------------------------------------------------ */

export const TASK_HELPER_PROJECT_COLORS = PROJECT_COLORS;
export const TASK_HELPER_SOP_COLOR = SOP_COLOR;
export const TASK_HELPER_CHILD_OPACITY = CHILD_OPACITY;
