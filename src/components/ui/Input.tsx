"use client";

/**
 * Input — text input with optional label, hint, and error message.
 *
 * Forwards a real `input` ref and accepts all native input props.
 * The wrapper div is a positioned container for the label, so the
 * caller can still drive width via `className` on the Input itself.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Class for the wrapper `<div>`. Use this (not `className`) when you
   *  need to size the label/hint layout. */
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, trailingIcon, wrapperClassName, className, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedById = hint || error ? `${inputId}-desc` : undefined;

  return (
    <div className={cn("w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
            {leadingIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedById}
          className={cn(
            "w-full bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "border transition-colors duration-150",
            "focus:outline-none focus:border-[var(--accent)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
            ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
            : "border-[var(--border-strong)] hover:border-[var(--border-strong)]",
            leadingIcon ? "pl-9 pr-3 py-2.5" : "px-3 py-2.5",
            trailingIcon ? "pr-9" : "",
            className,
          )}
          style={{ borderRadius: radius.md }}
          {...rest}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            {trailingIcon}
          </span>
        )}
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
