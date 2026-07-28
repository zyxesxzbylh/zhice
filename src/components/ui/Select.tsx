"use client";

/**
 * Select — styled native `<select>`.
 *
 * The native element is intentionally preserved (rather than a custom
 * popover) because:
 *  - mobile OS pickers come for free
 *  - keyboard navigation / a11y is built in
 *  - the rest of the design system still benefits from a uniform look
 */

import { forwardRef, type SelectHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
  /** Render children directly when you need to use `<option>` grouping. */
  children?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    options,
    placeholder,
    wrapperClassName,
    className,
    id,
    children,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const describedById = hint || error ? `${selectId}-desc` : undefined;

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "w-full appearance-none bg-[var(--bg-surface)] text-sm text-[var(--text-primary)]",
            "pl-3 pr-9 py-2.5 border transition-colors duration-150",
            "focus:outline-none focus:border-[var(--accent)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
            ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
            : "border-[var(--border-strong)] hover:border-[var(--border-strong)]",
            className,
          )}
          style={{ borderRadius: radius.md }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
      {(hint || error) && (
        <p
          id={describedById}
          className={cn(
            "mt-1.5 text-xs",
            error ? "text-[var(--color-danger)]" : "text-[var(--text-muted)]",
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});
