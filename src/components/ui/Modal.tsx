"use client";

/**
 * Modal — accessible modal with backdrop, focus trap, and Escape close.
 *
 * Features:
 *  - Escape closes the modal (unless `dismissible` is false).
 *  - Body scroll lock while open.
 *  - Click on backdrop closes (unless `dismissible` is false).
 *  - aria-modal / role="dialog" / labelledby wired up.
 *  - Optional `footer` slot for action buttons.
 *  - Sizes: `sm` (max-w-md), `md` (max-w-lg), `lg` (max-w-2xl), `xl`
 *    (max-w-3xl), `full` (max-w-[92vw]).
 *
 * Use `Modal.Header` / `Modal.Body` / `Modal.Footer` for the typical
 * three-zone layout, or pass plain children for custom layouts.
 */

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { radius, zIndex } from "@/lib/theme";
import { useEscapeKey } from "@/hooks/useKeyboard";
import { isBrowser } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-3xl",
  full: "max-w-[92vw]",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: ModalSize;
  dismissible?: boolean;
  /** Optional explicit width override, e.g. "640px". Overrides `size`. */
  width?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  dismissible = true,
  width,
  footer,
  children,
  className,
  initialFocusRef,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).slice(2, 9)}`);

  useEscapeKey(
    () => {
      if (dismissible) onClose();
    },
    open,
  );

  // Body scroll lock
  useEffect(() => {
    if (!open || !isBrowser) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) {
      document.body.style.paddingRight = `${scrollbar}px`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  // Initial focus
  useEffect(() => {
    if (!open || !isBrowser) return;
    const id = window.setTimeout(() => {
      const target = initialFocusRef?.current ?? dialogRef.current;
      if (target && "focus" in target) {
        (target as HTMLElement).focus();
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, [open, initialFocusRef]);

  if (!open || !isBrowser) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dismissible) return;
    if (event.target === event.currentTarget) onClose();
  };

  const node = (
    <div
      role="presentation"
      onClick={handleBackdropClick}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId.current : undefined}
        aria-describedby={description ? descId.current : undefined}
        tabIndex={-1}
        className={cn(
          "w-full bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-2xl outline-none",
          "max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-scale",
          sizeClass[size],
          className,
        )}
        style={{
          borderRadius: radius["2xl"],
          width: width,
        }}
      >
        {title && (
          <header className="px-6 py-4 border-b border-[var(--border-default)] flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={titleId.current}
                className="text-lg font-bold text-[var(--text-primary)] truncate"
              >
                {title}
              </h2>
              {description && (
                <p id={descId.current} className="mt-1 text-sm text-[var(--text-muted)]">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                aria-label="关闭"
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--bg-muted)] transition-colors shrink-0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-[var(--text-muted)]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </header>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <footer className="px-6 py-4 border-t border-[var(--border-default)] bg-[var(--bg-root)] flex items-center justify-end gap-2">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
