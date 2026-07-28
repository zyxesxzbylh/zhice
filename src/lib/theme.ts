/**
 * Legacy re-export layer.
 *
 * The actual design tokens live in `@/lib/theme/tokens.ts` and are
 * re-exported by `@/lib/theme/index.ts`. This file is kept for backward
 * compatibility with existing imports like:
 *
 *   import { THEME, ANIMATION, SPACING, RADIUS, SHADOWS, BREAKPOINTS, Z_INDEX } from "@/lib/theme";
 *
 * It also surfaces the foundation additions (motion, tagPalette, colored
 * priority) and keeps the original UPPERCASE legacy aliases so neither
 * old nor new call sites break.
 *
 * New code should prefer the lowercase canonical names
 * (`colors`, `radius`, `zIndex`, `priority`, …) imported from
 * `@/lib/theme` directly. The UPPERCASE forms exist for source
 * compatibility only.
 */

// ---- Modern lowercase re-exports from the consolidated token module ----
export {
  colors,
  status,
  sop,
  daily,
  projectColors,
  tagColors,
  animation,
  spacing,
  radius,
  shadows,
  breakpoints,
  zIndex,
  getStatusColor,
  getPriorityColor,
  pickProjectColor,
  // Type exports
  type StatusToken,
  type PriorityToken,
  type AccentColor,
  type MonochromeStep,
} from "./theme/index";

import {
  colors,
  status,
  sop,
  daily,
  projectColors,
  tagColors,
  spacing,
  radius,
  shadows,
  breakpoints,
  zIndex,
  animation,
  // Keep the monochrome priority from tokens; the colored version
  // (with `accent`/`bg`/`border`/`text`) is added locally below.
} from "./theme/index";

/* ------------------------------------------------------------------ *
 *  `priority` — colored four-step scale (foundation addition).
 *  Each entry pairs a soft surface (`bg`, `border`, `text`) with a
 *  stronger `accent` color used for the dot indicator / left rail.
 *  The palette stays restrained — grayscale dominant with
 *  red/orange/green/blue accents — to honor the 黑白灰 + 一点状态色 brand.
 * ------------------------------------------------------------------ */
export const priority = {
  urgent: { bg: "#fee2e2", border: "#fca5a5", text: "#7f1d1d", accent: "#ef4444" },
  high: { bg: "#ffedd5", border: "#fdba74", text: "#9a3412", accent: "#f97316" },
  medium: { bg: "#fef9c3", border: "#fde047", text: "#854d0e", accent: "#eab308" },
  low: { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af", accent: "#3b82f6" },
} as const;

/**
 * Monochrome priority scale (foundation addition). Same shape as the
 * original `priority` token: `(bg, border, text, dot)`. Useful for
 * surfaces that need a non-color priority cue, like the dashboard
 * overview rail.
 */
export const priorityMono = {
  low: { bg: "#f5f5f5", border: "#e0e0e0", text: "#9e9e9e", dot: "#bdbdbd" },
  medium: { bg: "#e0e0e0", border: "#bdbdbd", text: "#616161", dot: "#757575" },
  high: { bg: "#bdbdbd", border: "#9e9e9e", text: "#424242", dot: "#616161" },
  urgent: { bg: "#616161", border: "#424242", text: "#ffffff", dot: "#212121" },
} as const;

/* ------------------------------------------------------------------ *
 *  `motion` — duration + easing tokens (foundation addition).
 *  Use these for any new transition. The legacy `animation` (with
 *  `normal`/`slow` keys) is still exported below for back-compat.
 * ------------------------------------------------------------------ */
export const motion = {
  duration: {
    fast: 120,
    base: 200,
    slow: 320,
  },
  easing: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const;

/* ------------------------------------------------------------------ *
 *  `tagPalette` — eight dark-background tag swatches (foundation addition).
 *  Each entry is `(bg, text)` where `text` is white. The product uses
 *  these for chip-style "dark mode" tags; the lighter `tagColors`
 *  remains for the softer inline style.
 * ------------------------------------------------------------------ */
export const tagPalette: readonly { bg: string; text: string }[] = [
  { bg: "#1f2937", text: "#ffffff" },
  { bg: "#374151", text: "#ffffff" },
  { bg: "#4b5563", text: "#ffffff" },
  { bg: "#52525b", text: "#ffffff" },
  { bg: "#57534e", text: "#ffffff" },
  { bg: "#44403c", text: "#ffffff" },
  { bg: "#0f172a", text: "#ffffff" },
  { bg: "#1e293b", text: "#ffffff" },
] as const;

/* ------------------------------------------------------------------ *
 *  Legacy UPPERCASE aliases — keep source-compatible with the
 *  original `src/lib/theme.ts` exports.
 * ------------------------------------------------------------------ */
export const ANIMATION = animation;
export const SPACING = spacing;
export const RADIUS = radius;
export const SHADOWS = shadows;
export const BREAKPOINTS = breakpoints;
export const Z_INDEX = zIndex;

/**
 * The legacy `THEME` aggregate object. Kept as a single export so any
 * component still using `THEME.colors.coolGray[600]` keeps working.
 *
 * `THEME.priority` is the new colored scale; the monochrome version
 * is on `THEME.priorityMono` for any consumer that needs the
 * dot-based shape.
 */
export const THEME = {
  colors: {
    primary: colors.coolGray,
    gray: colors.monochrome,
    coolGray: colors.coolGray,
    slate: colors.slate,
    silver: colors.silver,
    success: colors.monochrome,
    warning: colors.monochrome,
    danger: colors.monochrome,
    black: colors.palette.black,
    white: colors.palette.white,
  },
  priority,
  priorityMono,
  status,
  sop,
  daily,
  projectColors,
  tagColors,
} as const;
