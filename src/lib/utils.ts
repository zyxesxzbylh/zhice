/**
 * Generic utility helpers shared across the app.
 *
 * `cn` is a tiny, dependency-free classnames combiner:
 * - trims whitespace
 * - drops falsy values (false, null, undefined, 0, "")
 * - de-duplicates tokens
 * - merges Tailwind-friendly class strings
 *
 * It deliberately does NOT do conflict resolution (e.g. `p-2 p-4`).
 * For that, use Tailwind's official `clsx` + `tailwind-merge`. We keep this
 * minimal so the foundation has zero new runtime dependencies.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

export function cn(...inputs: ClassValue[]): string {
  const tokens: string[] = [];

  const push = (value: ClassValue) => {
    if (!value) return;
    if (typeof value === "string" || typeof value === "number") {
      const trimmed = String(value).trim();
      if (trimmed) tokens.push(trimmed);
      return;
    }
    if (Array.isArray(value)) {
      for (const v of value) push(v);
      return;
    }
    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) tokens.push(key);
      }
    }
  };

  for (const input of inputs) push(input);

  // De-duplicate while preserving first-occurrence order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.join(" ");
}

/**
 * Safe no-op for SSR environments where `window`/`document` are absent.
 * Use this in module-level initializers that should not crash during
 * Next.js server-side rendering.
 */
export const isBrowser = typeof window !== "undefined";

/**
 * Format a string-safe non-empty check.
 */
export function nonEmpty(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Tiny debounce helper. Returns a function that delays invocation until
 * `wait` ms have passed since the last call. Cancels the prior timer
 * automatically. Useful for search input and resize handlers.
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait: number,
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: TArgs) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
