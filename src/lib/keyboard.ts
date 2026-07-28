"use client";

/**
 * `keyboard` — global shortcut plumbing with a scope stack.
 *
 * 由 foundation-contract 任务提供:
 *  - `useShortcut(key, handler, options?)` — register a global keydown
 *    listener. The key spec is human-readable (e.g. `"mod+k"`, `"?"`,
 *    `"Escape"`, `"mod+shift+p"`).
 *  - `useShortcutScope(name)` — track a named scope for nested
 *    modal/dialog priority. The topmost scope in the stack wins.
 *
 * Built-in shortcuts (always registered, opt out via `enabled: false`):
 *  - `mod+k` (Cmd/Ctrl+K) → dispatches the `flowsync:command-palette-open`
 *    CustomEvent on `window`.
 *  - `?` (Shift+/) → dispatches `flowsync:shortcuts-help-open` on
 *    `window`, unless focus is in `<input>`/`<textarea>`/contenteditable.
 *
 * Conventions:
 *  - All hooks are SSR-safe — they check `typeof window` before touching
 *    the DOM and return early during server render.
 *  - The scope stack is module-level (not React state) so the keydown
 *    listener can read it without re-binding on every render.
 *  - Handlers are stored in a ref so passing a fresh closure to
 *    `useShortcut` doesn't tear down the listener each render.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 *  Constants
 * ------------------------------------------------------------------ */

/** Cmd/Ctrl+K — open the command palette. */
export const SHORTCUT_COMMAND_PALETTE = "mod+k";
/** `?` (Shift+/) — open the keyboard shortcut help. */
export const SHORTCUT_HELP = "?";

/** Custom event names. Listeners can attach with `addEventListener`. */
export const EVENT_COMMAND_PALETTE_OPEN = "flowsync:command-palette-open";
export const EVENT_SHORTCUTS_HELP_OPEN = "flowsync:shortcuts-help-open";

/* ------------------------------------------------------------------ *
 *  Scope stack (module-level)
 * ------------------------------------------------------------------ */

const scopeStack: string[] = [];

/** Return the topmost active scope, or `null` if none. */
export function peekActiveScope(): string | null {
  return scopeStack.length > 0 ? scopeStack[scopeStack.length - 1] : null;
}

/* ------------------------------------------------------------------ *
 *  Types
 * ------------------------------------------------------------------ */

export interface UseShortcutOptions {
  /** Restrict this shortcut to a named scope. The shortcut only fires
   *  if either no scope is active or the active scope equals this one. */
  scope?: string;
  /** Prevent the browser's default action. Defaults to `true` for
   *  shortcut-style keys (with a `+`), `false` otherwise. */
  preventDefault?: boolean;
  /** When false, the listener is detached. Defaults to `true`. */
  enabled?: boolean;
}

export interface ShortcutScopeHandle {
  /** True when this scope is the topmost one on the stack. */
  active: boolean;
  /** Toggle this scope's presence on the stack. Pass `true` to push,
   *  `false` to pop. The hook is re-rendered when the value flips. */
  push: (value: boolean) => void;
}

/* ------------------------------------------------------------------ *
 *  SSR safety + key matching
 * ------------------------------------------------------------------ */

const isBrowser = typeof window !== "undefined";

const isMac =
  isBrowser && typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function normalize(spec: string): string[] {
  return spec
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

function looksLikeShortcut(spec: string): boolean {
  return spec.includes("+");
}

/**
 * Match a `KeyboardEvent` against a key spec.
 *  - Token `mod` resolves to `meta` on macOS, `ctrl` elsewhere.
 *  - Tokens `cmd`/`meta` match Meta; `ctrl`/`control` match Ctrl.
 *  - Tokens `shift`/`alt`/`option` match the corresponding modifier.
 *  - A non-modifier token must match `event.key` case-insensitively.
 *  - For a non-mod spec (no `+`), neither Meta nor Ctrl may be held.
 */
export function matchesKey(event: KeyboardEvent, spec: string): boolean {
  const tokens = normalize(spec);
  if (tokens.length === 0) return false;
  const modName: "meta" | "ctrl" = isMac ? "meta" : "ctrl";

  const required: { mod: boolean; meta: boolean; ctrl: boolean; shift: boolean; alt: boolean } = {
    mod: false,
    meta: false,
    ctrl: false,
    shift: false,
    alt: false,
  };
  let hasNonMod = false;
  let keyName = "";

  for (const tok of tokens) {
    if (tok === "mod") required.mod = true;
    else if (tok === "cmd" || tok === "meta") required.meta = true;
    else if (tok === "ctrl" || tok === "control") required.ctrl = true;
    else if (tok === "shift") required.shift = true;
    else if (tok === "alt" || tok === "option") required.alt = true;
    else {
      hasNonMod = true;
      keyName = tok;
    }
  }

  if (required.shift !== event.shiftKey) return false;
  if (required.alt !== event.altKey) return false;
  if (required.meta || required.ctrl) {
    if (modName === "meta" ? !event.metaKey : !event.ctrlKey) return false;
  }
  if (required.mod) {
    if (modName === "meta" ? !event.metaKey : !event.ctrlKey) return false;
  } else {
    if (event.metaKey || event.ctrlKey) return false;
  }
  if (hasNonMod) {
    return event.key.toLowerCase() === keyName;
  }
  return true;
}

/* ------------------------------------------------------------------ *
 *  Built-in shortcuts — always on, never blockable.
 *  These dispatch CustomEvents that pages / providers can listen to.
 * ------------------------------------------------------------------ */

function dispatchWindowEvent(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

function useBuiltInShortcuts(): void {
  useEffect(() => {
    if (!isBrowser) return;

    const onKeyDown = (event: KeyboardEvent) => {
      // ? — shortcuts help. Skip when typing in an input/textarea.
      if (
        matchesKey(event, SHORTCUT_HELP) &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        dispatchWindowEvent(EVENT_SHORTCUTS_HELP_OPEN);
        return;
      }
      // mod+k — command palette. Doesn't fire while typing.
      if (
        matchesKey(event, SHORTCUT_COMMAND_PALETTE) &&
        !isEditableTarget(event.target)
      ) {
        event.preventDefault();
        dispatchWindowEvent(EVENT_COMMAND_PALETTE_OPEN);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

/* ------------------------------------------------------------------ *
 *  Public hooks
 * ------------------------------------------------------------------ */

/**
 * Register a global keydown listener.
 *
 * The handler is stored in a ref so passing a fresh closure does not
 * re-bind the listener. The listener is only active when `enabled` is
 * true (default) AND we are in a browser.
 *
 * @example
 *   useShortcut("mod+k", () => setSearchOpen(true));
 *   useShortcut("?", () => setHelpOpen(true), { scope: "task-detail" });
 */
export function useShortcut(
  key: string,
  handler: (e: KeyboardEvent) => void,
  options: UseShortcutOptions = {},
): void {
  // Install built-ins on first use — idem­potent across many call sites.
  useBuiltInShortcuts();

  const { scope, enabled = true, preventDefault } = options;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  // Stable key string for effect deps.
  const keyDeps = key;

  useEffect(() => {
    if (!enabled || !isBrowser) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!matchesKey(event, keyDeps)) return;
      // Scope filter: if a scope is active, only fire handlers in that scope.
      const active = peekActiveScope();
      if (scope && active && active !== scope) return;
      if (preventDefault ?? looksLikeShortcut(keyDeps)) {
        event.preventDefault();
      }
      handlerRef.current(event);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyDeps, scope, enabled, preventDefault]);
}

/**
 * Track a named scope on the module-level stack. The hook returns
 *  - `active`: `true` while this scope is the topmost one
 *  - `push`:   a setter to push/pop the scope
 *
 * Typical use inside a modal/dialog:
 *
 * ```tsx
 * function MyModal({ open, onClose }) {
 *   const { push } = useShortcutScope("my-modal");
 *   useEffect(() => {
 *     if (!open) return;
 *     push(true);
 *     return () => push(false);
 *   }, [open, push]);
 *   // ...
 * }
 * ```
 */
export function useShortcutScope(scope: string): ShortcutScopeHandle {
  const [active, setActive] = useState<boolean>(
    () => scopeStack.length > 0 && scopeStack[scopeStack.length - 1] === scope,
  );

  const push = useCallback(
    (value: boolean) => {
      if (value) {
        if (!scopeStack.includes(scope)) scopeStack.push(scope);
        setActive(scopeStack[scopeStack.length - 1] === scope);
      } else {
        const idx = scopeStack.lastIndexOf(scope);
        if (idx >= 0) scopeStack.splice(idx, 1);
        setActive(scopeStack.length > 0 && scopeStack[scopeStack.length - 1] === scope);
      }
    },
    [scope],
  );

  return { active, push };
}
