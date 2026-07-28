/**
 * Legacy re-export layer.
 *
 * The actual design tokens live in `@/lib/theme/tokens.ts`. This file
 * preserves the old API surface (`COLORS`, `SPACING`, `BORDER_RADIUS`,
 * `SHADOWS`) so existing imports keep compiling.
 *
 * New code should import from `@/lib/theme` directly.
 */
export {
  colors,
  spacing,
  shadows,
  status,
  priority,
  sop,
  daily,
  pickProjectColor,
} from "./theme/index";

// Legacy UPPERCASE aliases.
export const SPACING = spacing;
export const SHADOWS = shadows;

import {
  colors,
  spacing,
  shadows,
  sop as sopToken,
  daily as dailyToken,
  priority as priorityToken,
} from "./theme/index";

/**
 * Legacy `COLORS` aggregate. Mirrors the original shape so that
 * `COLORS.primary[600]`, `COLORS.sop.bg`, `COLORS.daily.bg` etc. still work.
 */
export const COLORS = {
  primary: colors.coolGray,
  success: colors.accent.success,
  warning: colors.accent.warning,
  error: colors.accent.danger,
  info: colors.accent.info,
  sop: sopToken,
  daily: dailyToken,
  priority: {
    high: colors.accent.danger,
    medium: colors.accent.warning,
    low: colors.accent.success,
  },
} as const;

/**
 * Legacy `BORDER_RADIUS` — used by older components that imported it from
 * this file. Equivalent to the modern `radius` token set.
 */
export const BORDER_RADIUS = {
  sm: "6px",
  md: "8px",
  lg: "12px",
  xl: "16px",
} as const;
