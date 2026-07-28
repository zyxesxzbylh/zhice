"use client";

/**
 * IconButton — square button intended for icons. Wraps a Button so the
 * same variant/size API applies, but the size affects width and height
 * equally and the default `aria-label` is required (the button has no
 * visible text).
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export type IconButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantClass: Record<IconButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)]",
  secondary: "bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-strong)] hover:bg-[var(--bg-root)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]",
  danger: "bg-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-[var(--text-inverse)]",
};

const sizeClass = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
} as const;

export type IconButtonSize = keyof typeof sizeClass;

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Required for a11y. The button has no visible text. */
  "aria-label": string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { variant = "ghost", size = "md", className, type = "button", children, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center shrink-0",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--accent-muted)]",
          "disabled:opacity-50 disabled:pointer-events-none",
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        style={{ borderRadius: radius.md }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
