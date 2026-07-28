"use client";

/**
 * Button — primary interactive primitive.
 *
 * Variants:
 *  - `primary`   (default)  Dark gray, white text. Use for the main CTA.
 *  - `secondary`             White bg, gray border, dark text. Cancel/secondary.
 *  - `ghost`                 Transparent bg, hover bg, dark text. Toolbar buttons.
 *  - `danger`                Red accent for destructive actions.
 *  - `link`                  Plain inline link styling.
 *
 * Sizes: `sm` (28px), `md` (36px), `lg` (44px). The defaults match the
 * spacing used throughout the app (see legacy inline `px-4 py-2` patterns).
 *
 * Forwards a real `button` ref and accepts all native button props, so
 * existing `onClick`/`disabled`/`type`/`aria-*` continue to work.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

const baseClass = cn(
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap",
  "transition-all duration-200 select-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
  "disabled:opacity-50 disabled:pointer-events-none",
);

const variantClass: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)]",
    "focus-visible:ring-[var(--accent)]",
  ),
  secondary: cn(
    "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] hover:bg-[var(--bg-root)] active:bg-[var(--bg-muted)]",
    "focus-visible:ring-[var(--accent-muted)]",
  ),
  ghost: cn(
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] active:bg-[var(--bg-muted-hover)]",
    "focus-visible:ring-[var(--accent-muted)]",
  ),
  danger: cn(
    "bg-[var(--color-danger)] text-[var(--text-inverse)] hover:opacity-90 active:opacity-80",
    "focus-visible:ring-[var(--color-danger)]",
  ),
  link: cn(
    "bg-transparent text-[var(--text-secondary)] underline-offset-2 hover:underline",
    "focus-visible:ring-[var(--accent-muted)] px-0 py-0",
  ),
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    disabled,
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        baseClass,
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        loading && "cursor-wait",
        className,
      )}
      style={variant === "link" ? undefined : { borderRadius: radius.md }}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden
          className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
});
