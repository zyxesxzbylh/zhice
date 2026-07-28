"use client";

/**
 * Shared React hooks used across the app.
 *
 * 由 perf + ux 流共同构建: keeps the bundled hooks in a single
 * well-typed module so call sites have one canonical import.
 */

import { useEffect, useRef, useState } from "react";

/**
 * `useDebouncedValue` — returns `value` after it has stayed stable for
 * at least `delayMs` milliseconds. Useful for throttling search input.
 *
 * The hook defers the actual return value, so the component re-renders
 * once when the debounce settles rather than on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/**
 * `useDebouncedCallback` — returns a stable wrapper that delays calling
 * `callback` until `delayMs` of inactivity have passed.
 *
 * Used for resize/scroll handlers and similar firehose-style events
 * where the consumer only cares about the *last* invocation.
 */
export function useDebouncedCallback<TArgs extends unknown[], TResult>(
  callback: (...args: TArgs) => TResult,
  delayMs: number = 200,
): (...args: TArgs) => void {
  const cbRef = useRef(callback);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (...args: TArgs) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      cbRef.current(...args);
      timerRef.current = null;
    }, delayMs);
  };
}