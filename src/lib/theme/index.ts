/**
 * Theme barrel — re-exports every token plus small lookup helpers.
 *
 * Usage:
 *   import { colors, status, priority, getStatusColor } from "@/lib/theme";
 *
 * Anything that used to live in the legacy `src/lib/theme.ts` or
 * `src/lib/colors.ts` should import from here instead. The legacy
 * files now re-export from this module so nothing breaks.
 */

export * from "./tokens";

import { status, priority, type StatusToken, type PriorityToken } from "./tokens";

/**
 * Resolve a status token to its `(bg, border, text)` triple.
 * Falls back to `todo` if the input is an unknown string — the runtime
 * data path is allowed to send unexpected values (legacy API, old DB rows).
 */
export function getStatusColor(token: string | null | undefined) {
  if (token && token in status) {
    return status[token as StatusToken];
  }
  return status.todo;
}

/**
 * Resolve a priority token to its `(bg, border, text, dot)` tuple.
 */
export function getPriorityColor(token: string | null | undefined) {
  if (token && token in priority) {
    return priority[token as PriorityToken];
  }
  return priority.medium;
}

/**
 * Pick a stable monochrome color from a hash. Used by `TaskCard` and
 * `TaskContext` to give each project a deterministic accent without
 * storing a color in the database.
 */
const PROJECT_HASH_COLORS = [
  "#374151",
  "#4b5563",
  "#6b7280",
  "#52525b",
  "#57534e",
  "#44403c",
] as const;

export function pickProjectColor(seed: string | null | undefined): string {
  if (!seed) return "#6b7280";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % PROJECT_HASH_COLORS.length;
  return PROJECT_HASH_COLORS[idx];
}
