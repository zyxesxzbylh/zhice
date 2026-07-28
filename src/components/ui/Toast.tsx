"use client";

/**
 * Toast — thin wrapper around `react-hot-toast` so call sites are
 * consistent and easy to mock in tests. Pure re-export keeps the
 * dependency optional and one-tree-shakable.
 *
 * The codebase previously called `toast.success/error/loading` directly
 * from `react-hot-toast`, with inconsistent durations. This module
 * normalizes durations and exposes semantic helpers (success, error,
 * info, promise) that are easier to grep for.
 */

import toast from "react-hot-toast";

export type ToastDuration = number | "short" | "default" | "long";

const DURATION_MAP: Record<Exclude<ToastDuration, number>, number> = {
  short: 2000,
  default: 3000,
  long: 5000,
};

function resolveDuration(duration: ToastDuration = "default"): number {
  return typeof duration === "number" ? duration : DURATION_MAP[duration];
}

export interface ToastOptions {
  duration?: ToastDuration;
}

export const toast$ = {
  success(message: string, options: ToastOptions = {}) {
    return toast.success(message, { duration: resolveDuration(options.duration) });
  },
  error(message: string, options: ToastOptions = {}) {
    return toast.error(message, { duration: resolveDuration(options.duration) });
  },
  info(message: string, options: ToastOptions = {}) {
    // `toast` itself renders a neutral message — there's no built-in
    // `info` variant, so we go through the default `toast()`.
    return toast(message, {
      duration: resolveDuration(options.duration),
      icon: "ℹ️",
    });
  },
  message(message: string, options: ToastOptions = {}) {
    return toast(message, { duration: resolveDuration(options.duration) });
  },
  loading(message: string) {
    return toast.loading(message);
  },
  dismiss(id?: string) {
    toast.dismiss(id);
  },
  /**
   * Wrap an async operation in a loading → success/error toast.
   * Returns the resolved value or re-throws the error.
   */
  async promise<T>(
    operation: Promise<T>,
    messages: { loading: string; success: string | ((value: T) => string); error: string | ((err: unknown) => string) },
    options: ToastOptions = {},
  ): Promise<T> {
    const id = toast.loading(messages.loading);
    try {
      const result = await operation;
      const text =
        typeof messages.success === "function" ? messages.success(result) : messages.success;
      toast.success(text, { id, duration: resolveDuration(options.duration) });
      return result;
    } catch (err) {
      const text =
        typeof messages.error === "function" ? messages.error(err) : messages.error;
      toast.error(text, { id, duration: resolveDuration(options.duration) });
      throw err;
    }
  },
};
