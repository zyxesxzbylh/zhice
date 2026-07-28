/**
 * Keyboard hooks — small, well-tested wrappers around `addEventListener("keydown", …)`.
 *
 * Why a dedicated module:
 * - Multiple components (modal, search, command palette, kanban board)
 *   need the same shortcut plumbing. Hand-rolled `useEffect` + refactor
 *   has historically led to listener leaks and event-order bugs.
 * - These hooks share a single, consistent option shape so a future
 *   "shortcut registry" can be built on top without breaking call sites.
 *
 * Conventions:
 * - All hooks are SSR-safe. They register the listener on mount and
 *   remove it on unmount, returning a stable callback ref so passing
 *   inline arrow functions to deps does not re-bind on every render.
 * - `useShortcut` accepts an `enabled` flag for toggling without
 *   unmounting (e.g. when a modal is open).
 * - Modifier keys are matched via the `mod` token — "Cmd on macOS,
 *   Ctrl elsewhere" — to match the platform convention.
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { isBrowser } from "@/lib/utils";

/** A key spec. Plain keys (e.g. `"k"`, `"Enter"`, `"Escape"`, `"?"`)
 *  or combos with the `mod` token (`"mod+k"`, `"mod+shift+p"`). */
export type KeySpec = string;

/** Options shared by every keyboard hook. */
export interface KeyboardOptions {
  /** When false, the listener is not registered. Defaults to true. */
  enabled?: boolean;
  /** Don't fire when focus is inside an `<input>`/`<textarea>`/contenteditable. */
  ignoreInputs?: boolean;
  /** If provided, the listener is only attached while this element is the
   *  active element or contains it. Useful for scoping shortcuts to a
   *  particular panel. */
  scopeRef?: React.RefObject<HTMLElement | null>;
  /** Run inside `capture` phase. Defaults to false. */
  capture?: boolean;
  /** Prevent default after the handler runs. Defaults to true for
   *  shortcut-style hooks, false for raw `useKey`. */
  preventDefault?: boolean;
}

/** A keyboard event augmented with the resolved `mod` flag, so handlers
 *  don't have to peek at `e.metaKey || e.ctrlKey`. */
export interface KeyEvent extends KeyboardEvent {
  mod: boolean;
}

const isMac =
  isBrowser && typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/**
 * Normalize a key spec to a canonical string used internally.
 * - lowercase
 * - trim whitespace
 * - tokens separated by `+`
 * - `mod` resolves to `meta` on mac, `ctrl` elsewhere (at match time)
 */
function normalize(spec: KeySpec): string[] {
  return spec
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

function platformModName(): "meta" | "ctrl" {
  return isMac ? "meta" : "ctrl";
}

/**
 * Returns true if the event matches the spec. A spec token is satisfied
 * when:
 *   - the literal key name matches (case-insensitive), OR
 *   - the token is `mod` and either Meta or Ctrl is held (depending on platform)
 *   - the token is `cmd`/`meta`/`ctrl` and the matching modifier is held
 *   - the token is `shift`/`alt` and that modifier is held
 */
export function matchesKey(event: KeyboardEvent, spec: KeySpec): boolean {
  const tokens = normalize(spec);
  if (tokens.length === 0) return false;

  const modName = platformModName();
  const requiredMods: Record<string, boolean> = {
    mod: false,
    cmd: false,
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
  };

  let hasNonModifier = false;
  let keyName = "";

  for (const tok of tokens) {
    if (tok === "mod") {
      requiredMods.mod = true;
      continue;
    }
    if (tok === "cmd" || tok === "meta") {
      requiredMods.meta = true;
      continue;
    }
    if (tok === "ctrl" || tok === "control") {
      requiredMods.ctrl = true;
      continue;
    }
    if (tok === "shift") {
      requiredMods.shift = true;
      continue;
    }
    if (tok === "alt" || tok === "option") {
      requiredMods.alt = true;
      continue;
    }
    hasNonModifier = true;
    keyName = tok;
  }

  if (requiredMods.shift && !event.shiftKey) return false;
  if (!requiredMods.shift && event.shiftKey) return false;
  if (requiredMods.alt && !event.altKey) return false;
  if (!requiredMods.alt && event.altKey) return false;

  if (requiredMods.meta || requiredMods.cmd) {
    if (modName === "meta" ? !event.metaKey : !event.ctrlKey) return false;
  } else if (requiredMods.ctrl) {
    if (modName === "ctrl" ? !event.ctrlKey : !event.metaKey) return false;
  }

  if (requiredMods.mod) {
    if (modName === "meta" ? !event.metaKey : !event.ctrlKey) return false;
  } else {
    // For a non-mod spec, neither meta nor ctrl should be held.
    if (event.metaKey || event.ctrlKey) return false;
  }

  if (hasNonModifier) {
    const eventKey = event.key.toLowerCase();
    return eventKey === keyName;
  }

  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/* ------------------------------------------------------------------ *
 *  Core listener hook
 * ------------------------------------------------------------------ */

function useKeyListener(
  specs: KeySpec[],
  handler: (event: KeyboardEvent, spec: KeySpec) => void,
  options: KeyboardOptions = {},
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const {
    enabled = true,
    ignoreInputs = false,
    scopeRef,
    capture = false,
    preventDefault,
  } = options;

  useEffect(() => {
    if (!enabled || specs.length === 0 || !isBrowser) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (ignoreInputs && isEditableTarget(event.target)) return;
      if (scopeRef?.current) {
        if (!scopeRef.current.contains(event.target as Node)) return;
      }

      for (const spec of specs) {
        if (matchesKey(event, spec)) {
          if (preventDefault ?? isShortcut(spec)) {
            event.preventDefault();
            event.stopPropagation();
          }
          handlerRef.current(event, spec);
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture });
    return () => window.removeEventListener("keydown", onKeyDown, { capture });
  }, [specs.join("|"), enabled, ignoreInputs, capture, preventDefault, scopeRef]);
}

/** Heuristic: anything with `+` is considered a shortcut and gets
 *  preventDefault by default. Single keys like `"Escape"` do not. */
function isShortcut(spec: KeySpec): boolean {
  return spec.includes("+");
}

/* ------------------------------------------------------------------ *
 *  Public hooks
 * ------------------------------------------------------------------ */

/**
 * Listen for a single key/combo. Handler is the latest closure thanks
 * to a ref, so it stays stable across renders.
 *
 * @example
 *   useKey("Escape", () => closeModal());
 *   useKey("mod+k", () => openSearch());
 */
export function useKey(
  spec: KeySpec,
  handler: (event: KeyboardEvent) => void,
  options?: KeyboardOptions,
): void {
  useKeyListener([spec], (e) => handler(e), options);
}

/**
 * Listen for multiple key/combos. The handler receives the matched
 * spec so it can dispatch accordingly.
 *
 * @example
 *   useKeys(["mod+s", "mod+enter"], (e, spec) => save());
 */
export function useKeys(
  specs: KeySpec[],
  handler: (event: KeyboardEvent, spec: KeySpec) => void,
  options?: KeyboardOptions,
): void {
  useKeyListener(specs, handler, options);
}

/**
 * Register a global shortcut. Convenience wrapper that defaults
 * `preventDefault` to true (it is the right behavior for `mod+x` style
 * shortcuts) and `ignoreInputs` to true so a shortcut doesn't fire
 * while the user is typing in a search field.
 *
 * @example
 *   useShortcut("mod+k", () => setSearchOpen(true));
 */
export function useShortcut(
  spec: KeySpec,
  handler: (event: KeyboardEvent) => void,
  options: Omit<KeyboardOptions, "preventDefault"> & { preventDefault?: boolean } = {},
): void {
  useKeyListener([spec], (e) => handler(e), {
    ignoreInputs: true,
    preventDefault: true,
    ...options,
  });
}

/**
 * Listen for `Escape` regardless of focus context. Useful for closing
 * dropdowns/modals. Pass `enabled=false` to detach temporarily.
 *
 * @example
 *   useEscapeKey(() => setOpen(false), isOpen);
 */
export function useEscapeKey(
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true,
): void {
  useKey("Escape", handler, { enabled, ignoreInputs: false });
}

/**
 * Listen for `Enter` while focus is inside a specific ref. Use this
 * for "press Enter to submit" patterns that should not fire on a
 * global Enter.
 *
 * @example
 *   const ref = useRef<HTMLDivElement>(null);
 *   useEnterKeyInScope(ref, () => submit());
 */
export function useEnterKeyInScope(
  scopeRef: React.RefObject<HTMLElement | null>,
  handler: (event: KeyboardEvent) => void,
  enabled: boolean = true,
): void {
  useKey("Enter", handler, { enabled, scopeRef });
}

/**
 * Arrow-key navigation helper. Calls `onMove` with `"up" | "down" |
 * "left" | "right" | "home" | "end"`. The caller maintains the cursor
 * (active index) — the hook just translates key events to directions.
 *
 * @example
 *   useArrowNavigation({
 *     onMove: (dir) => moveCursor(dir),
 *   });
 */
export interface ArrowNavigationOptions {
  onMove: (direction: "up" | "down" | "left" | "right" | "home" | "end") => void;
  enabled?: boolean;
  scopeRef?: React.RefObject<HTMLElement | null>;
  /** Include horizontal arrows. Default true. */
  horizontal?: boolean;
  /** Include Home/End. Default true. */
  homeEnd?: boolean;
}

export function useArrowNavigation(options: ArrowNavigationOptions): void {
  const { onMove, enabled = true, scopeRef, horizontal = true, homeEnd = true } = options;

  const handlerRef = useRef(onMove);
  handlerRef.current = onMove;

  const wrapped = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowUp":
        handlerRef.current("up");
        return;
      case "ArrowDown":
        handlerRef.current("down");
        return;
      case "ArrowLeft":
        if (horizontal) handlerRef.current("left");
        return;
      case "ArrowRight":
        if (horizontal) handlerRef.current("right");
        return;
      case "Home":
        if (homeEnd) handlerRef.current("home");
        return;
      case "End":
        if (homeEnd) handlerRef.current("end");
        return;
    }
  }, [horizontal, homeEnd]);

  useKeyListener(
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", ...(homeEnd ? ["Home", "End"] : [])],
    wrapped,
    { enabled, scopeRef, preventDefault: true },
  );
}

/**
 * Returns a `mod` string suitable for display in shortcut hints
 * (e.g. "⌘K" on mac, "Ctrl+K" elsewhere). Useful for rendering
 * keyboard help UI.
 */
export function useModifierLabel(): { mod: string; alt: string; shift: string } {
  return isMac
    ? { mod: "⌘", alt: "⌥", shift: "⇧" }
    : { mod: "Ctrl", alt: "Alt", shift: "Shift" };
}
