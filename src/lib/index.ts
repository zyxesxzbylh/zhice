/**
 * Lib barrel — one-stop import for all shared library helpers.
 *
 *   import { cn, formatDueDate, useShortcut, status } from "@/lib";
 */

export * from "./utils";

export * from "./theme";

export * from "./tasks";

export {
  useKey,
  useKeys,
  useShortcut,
  useEscapeKey,
  useEnterKeyInScope,
  useArrowNavigation,
  useModifierLabel,
  matchesKey,
} from "@/hooks/useKeyboard";
export type {
  KeySpec,
  KeyEvent,
  KeyboardOptions,
  ArrowNavigationOptions,
} from "@/hooks/useKeyboard";
