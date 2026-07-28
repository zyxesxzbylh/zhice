"use client";

/**
 * Badge — small inline label with optional dot indicator.
 *
 * Use for status pills, priority dots, counts, etc. The "soft" variant
 * uses a translucent background; "solid" uses the configured color as
 * the background and white as the text.
 */

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: "soft" | "solid";
  withDot?: boolean;
  children?: ReactNode;
}

const toneClass: Record<BadgeTone, { soft: string; solid: string; dot: string }> = {
  neutral: {
    soft: "bg-[var(--bg-muted)] text-[var(--text-secondary)] border-[var(--border-default)]",
    solid: "bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)]",
    dot: "bg-[var(--text-muted)]",
  },
  info: {
    soft: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-info-border)]",
    solid: "bg-[var(--color-info)] text-[var(--text-inverse)] border-[var(--color-info)]",
    dot: "bg-[var(--color-info)]",
  },
  success: {
    soft: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]",
    solid: "bg-[var(--color-success)] text-[var(--text-inverse)] border-[var(--color-success)]",
    dot: "bg-[var(--color-success)]",
  },
  warning: {
    soft: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning-border)]",
    solid: "bg-[var(--color-warning)] text-[var(--text-inverse)] border-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
  },
  danger: {
    soft: "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger-border)]",
    solid: "bg-[var(--color-danger)] text-[var(--text-inverse)] border-[var(--color-danger)]",
    dot: "bg-[var(--color-danger)]",
  },
  muted: {
    soft: "bg-[var(--bg-root)] text-[var(--text-muted)] border-[var(--border-default)]",
    solid: "bg-[var(--text-muted)] text-[var(--text-inverse)] border-[var(--text-muted)]",
    dot: "bg-[var(--text-muted)]",
  },
};

export function Badge({
  tone = "neutral",
  variant = "soft",
  withDot = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  const toneStyles = toneClass[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border",
        variant === "soft" ? toneStyles.soft : toneStyles.solid,
        className,
      )}
      style={{ borderRadius: radius.full }}
      {...rest}
    >
      {withDot && (
        <span
          aria-hidden
          className={cn("w-1.5 h-1.5 rounded-full", toneStyles.dot)}
        />
      )}
      {children}
    </span>
  );
}
