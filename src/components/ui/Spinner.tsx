"use client";

/**
 * Spinner — indeterminate loading indicator.
 *
 * Two flavors:
 *  - `<Spinner />` — bare spinning ring, inherits text color.
 *  - `<Spinner.Labeled />` — spinner + "Loading…" text.
 *
 * `size` controls the diameter in pixels (16/20/24/32). Default 20.
 */

import { cn } from "@/lib/utils";

export type SpinnerSize = "xs" | "sm" | "md" | "lg";

const sizeClass: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-5 h-5 border-2",
  lg: "w-8 h-8 border-[3px]",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label = "加载中" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block rounded-full border-current border-t-transparent animate-spin",
        sizeClass[size],
        className,
      )}
    />
  );
}

export interface LabeledSpinnerProps {
  text?: React.ReactNode;
  size?: SpinnerSize;
  className?: string;
}

export function LabeledSpinner({ text = "加载中…", size = "sm", className }: LabeledSpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[var(--text-muted)]", className)}>
      <Spinner size={size} />
      <span className="text-sm">{text}</span>
    </span>
  );
}
