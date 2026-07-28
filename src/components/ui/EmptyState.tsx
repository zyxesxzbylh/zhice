"use client";

/**
 * EmptyState — neutral callout for empty data sets.
 *
 * 由 foundation-contract 任务提供: this is the design-system version
 * of the legacy `src/components/EmptyState.tsx` page-level component.
 * The legacy component stays for back-compat with the (auth) pages
 * that import it directly; this one is the shared primitive.
 *
 * Variants:
 *  - `default` — gray icon + text, optional CTA
 *  - `compact` — smaller icon, used in sidebars / panels
 *
 * For full-page empty states prefer the existing page-level
 * `EmptyState` in `src/components/EmptyState.tsx` (it has project
 * icon set). For generic inline empty states use this one.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export type EmptyStateIcon = "tasks" | "projects" | "templates" | "search" | "inbox" | "tag";

const ICON_PATHS: Record<EmptyStateIcon, string> = {
  tasks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  projects:
    "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  templates:
    "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  inbox:
    "M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
};

export interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description?: ReactNode;
  /** Optional CTA button label. Render only when `action` is provided. */
  action?: ReactNode;
  variant?: "default" | "compact";
  className?: string;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isCompact = variant === "compact";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-fade-in",
        isCompact ? "p-6 gap-2" : "p-10 gap-3",
        "rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]",
        className,
      )}
      style={{ borderRadius: radius["2xl"] }}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--text-muted)]",
          isCompact ? "w-10 h-10" : "w-16 h-16",
        )}
      >
        <svg
          width={isCompact ? 18 : 28}
          height={isCompact ? 18 : 28}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={ICON_PATHS[icon]}
          />
        </svg>
      </div>
      <h3
        className={cn(
          "font-semibold text-[var(--text-secondary)]",
          isCompact ? "text-sm" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-[var(--text-muted)] max-w-sm",
            isCompact ? "text-xs" : "text-sm",
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
