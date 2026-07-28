"use client";

/**
 * Textarea — multi-line input with optional label, hint, error.
 * Forwards a real `textarea` ref and accepts all native textarea props.
 */

import { forwardRef, type TextareaHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    hint,
    error,
    wrapperClassName,
    className,
    id,
    autoResize = false,
    onInput,
    rows = 4,
    ...rest
  },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        onInput={(event) => {
          if (autoResize) {
            const el = event.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }
          onInput?.(event);
        }}
        className={cn(
          "w-full bg-[var(--bg-surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-3 py-2.5",
          "border transition-colors duration-150",
          "focus:outline-none focus:border-[var(--accent)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          autoResize ? "resize-none overflow-hidden" : "resize-y",
          error
            ? "border-[var(--color-danger)] focus:border-[var(--color-danger)]"
            : "border-[var(--border-strong)] hover:border-[var(--border-strong)]",
          className,
        )}
        style={{ borderRadius: radius.md }}
        {...rest}
      />
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
