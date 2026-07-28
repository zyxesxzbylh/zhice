"use client";

/**
 * Toggle — accessible on/off switch.
 *
 * Renders a hidden `<input type="checkbox">` styled as a sliding track.
 * The label, hint, and error slots make it a drop-in replacement for
 * the inline toggle patterns used in the settings page.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: ReactNode;
  description?: ReactNode;
  wrapperClassName?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, description, wrapperClassName, className, id, checked, disabled, ...rest },
  ref,
) {
  const autoId = useId();
  const toggleId = id ?? autoId;

  return (
    <label
      htmlFor={toggleId}
      className={cn(
        "flex items-start justify-between gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed",
        wrapperClassName,
      )}
    >
      {(label || description) && (
        <span className="min-w-0">
          {label && (
            <span className="block text-sm font-medium text-[var(--text-primary)]">{label}</span>
          )}
          {description && (
            <span className="block text-xs text-[var(--text-muted)] mt-0.5">{description}</span>
          )}
        </span>
      )}
      <span className="relative inline-block shrink-0">
        <input
          ref={ref}
          id={toggleId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden
          className={cn(
            "block w-10 h-6 bg-[var(--bg-muted-hover)] transition-colors duration-200",
            "peer-checked:bg-[var(--accent)]",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-[var(--accent-muted)]",
            "peer-disabled:opacity-50",
            className,
          )}
          style={{ borderRadius: radius.full }}
        />
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-surface)] shadow-md",
            "transition-transform duration-200",
            "peer-checked:translate-x-4",
            "pointer-events-none",
          )}
          style={{ borderRadius: radius.full }}
        />
      </span>
    </label>
  );
});
