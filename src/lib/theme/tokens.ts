/**
 * Theme tokens — the single source of truth for design values.
 *
 * Why this file exists:
 * - The codebase previously had `src/lib/theme.ts` and `src/lib/colors.ts`
 *   with overlapping definitions (SPACING, SHADOWS) and inconsistent color
 *   scales (coolGray vs gray vs slate). This module consolidates them.
 * - All UI components, task helpers, and keyboard-driven visuals should
 *   import from `@/lib/theme` (or the barrels in `@/lib` / `@/components/ui`),
 *   never from the legacy `theme.ts` / `colors.ts` files.
 * - Tailwind class names in this codebase use a monochrome palette (see
 *   `src/app/globals.css`). These tokens are kept in sync with those CSS
 *   variables so the same color works in both inline-style and Tailwind contexts.
 *
 * Conventions:
 * - Everything is `as const` so consumers can derive literal types.
 * - Numeric scales (e.g. `gray.50`..`gray.900`) follow the standard Tailwind
 *   step values (50,100,200,...,900) so a 1:1 mapping to Tailwind classes
 *   stays trivial.
 * - Semantic names (`status`, `priority`, `sop`, `daily`) describe the role,
 *   not the hue. Changing the brand color is a single-file edit.
 */

const palette = {
  white: "#ffffff",
  black: "#000000",
} as const;

const monochrome = {
  50: "#fafafa",
  100: "#f5f5f5",
  200: "#eeeeee",
  300: "#e0e0e0",
  400: "#bdbdbd",
  500: "#9e9e9e",
  600: "#757575",
  700: "#616161",
  800: "#424242",
  900: "#212121",
} as const;

const coolGray = {
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  400: "#9ca3af",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  800: "#1f2937",
  900: "#111827",
} as const;

const slate = {
  50: "#f8fafc",
  100: "#f1f5f9",
  200: "#e2e8f0",
  300: "#cbd5e1",
  400: "#94a3b8",
  500: "#64748b",
  600: "#475569",
  700: "#334155",
  800: "#1e293b",
  900: "#0f172a",
} as const;

/**
 * Silver accent — used for hover/active accents in the chrome and
 * for the project color swatch presets.
 */
const silver = {
  lightest: "#E9F1FC",
  lighter: "#DADEE0",
  light: "#C8CFD6",
  DEFAULT: "#A6B2BA",
  dark: "#8DBECC",
  darker: "#65768E",
  darkest: "#5B6770",
} as const;

/**
 * Functional accent colors. The app is mostly monochrome, but a few UI
 * affordances (toast, badge, danger) still need conventional colors.
 * Kept minimal to honor the 黑白灰 brand.
 */
const accent = {
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
} as const;

export const colors = {
  palette,
  monochrome,
  coolGray,
  slate,
  silver,
  accent,
} as const;

/**
 * Status colors used by TaskStatusBadge, kanban columns, and filter chips.
 * Each value triple (bg / border / text) is picked for AA contrast on white.
 */
export const status = {
  todo: { bg: "#fafafa", border: "#e5e5e5", text: "#9e9e9e" },
  in_progress: { bg: "#f5f5f5", border: "#d4d4d4", text: "#525252" },
  done: { bg: "#e5e5e5", border: "#a3a3a3", text: "#262626" },
} as const;

/**
 * Priority colors. Mirrors the legacy theme.ts semantic palette
 * (low → monochrome 100, urgent → near-black).
 */
export const priority = {
  low: { bg: "#f5f5f5", border: "#e0e0e0", text: "#9e9e9e", dot: "#bdbdbd" },
  medium: { bg: "#e0e0e0", border: "#bdbdbd", text: "#616161", dot: "#757575" },
  high: { bg: "#bdbdbd", border: "#9e9e9e", text: "#424242", dot: "#616161" },
  urgent: { bg: "#616161", border: "#424242", text: "#ffffff", dot: "#212121" },
} as const;

/**
 * SOP vs daily work accents. Daily uses indigo to make the card stand out
 * from the otherwise monochrome chrome.
 */
export const sop = { bg: "#4b5563", border: "#6b7280", text: "#ffffff" } as const;
export const daily = { bg: "#6366f1", border: "#818cf8", text: "#ffffff" } as const;

/**
 * Project color swatches (used by the project create form).
 * Twelve monochrome shades, hand-picked for visual distinction at small sizes.
 */
export const projectColors: readonly string[] = [
  "#212121",
  "#424242",
  "#616161",
  "#757575",
  "#9e9e9e",
  "#bdbdbd",
  "#e0e0e0",
  "#f5f5f5",
  "#000000",
  "#525252",
  "#737373",
  "#a3a3a3",
] as const;

/**
 * Tag color presets. Each preset gives a `(bg, text)` pair tuned for
 * readability — use the dark-bg presets for chip-style tags.
 */
export const tagColors: readonly { bg: string; text: string }[] = [
  { bg: "#f5f5f5", text: "#424242" },
  { bg: "#e0e0e0", text: "#616161" },
  { bg: "#d4d4d4", text: "#525252" },
  { bg: "#a3a3a3", text: "#ffffff" },
  { bg: "#737373", text: "#ffffff" },
  { bg: "#525252", text: "#ffffff" },
  { bg: "#404040", text: "#ffffff" },
  { bg: "#262626", text: "#ffffff" },
  { bg: "#171717", text: "#ffffff" },
] as const;

/**
 * Animation duration & easing. Always use these instead of raw `150`/`200`
 * so motion stays consistent across the app.
 */
export const animation = {
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
  },
  easing: {
    default: [0.4, 0, 0.2, 1] as const,
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
    smooth: [0.25, 0.1, 0.25, 1] as const,
  },
} as const;

/**
 * Spacing scale. Values are in `rem` (matches Tailwind's `p-1`=0.25rem etc.).
 * Use these for inline styles that need to follow the design system.
 */
export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
} as const;

export const radius = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  full: "9999px",
} as const;

/**
 * Box shadows. The 0..0.08 alpha values match the legacy `theme.ts` shadow
 * values (slightly softer than Tailwind defaults).
 */
export const shadows = {
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06)",
  xl: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.06)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.15)",
  inner: "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

export type StatusToken = keyof typeof status;
export type PriorityToken = keyof typeof priority;
export type AccentColor = keyof typeof accent;
export type MonochromeStep = keyof typeof monochrome;
