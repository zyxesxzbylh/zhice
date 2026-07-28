"use client";

/**
 * PriorityPicker — segmented control for the 4-step priority scale.
 *
 * The picker accepts a `value` and `onChange` and renders four chips,
 * one per priority level. Each chip uses the `priority` color tokens
 * from `@/lib/theme/tokens` for visual consistency.
 *
 * Use it in forms, in TaskDetailModal, or in BatchActions.
 */

import { useId } from "react";
import { priority } from "@/lib/theme/tokens";

export type PriorityValue = keyof typeof priority;

interface PriorityPickerProps {
  value: PriorityValue;
  onChange: (value: PriorityValue) => void;
  /** When true, render only the priority chips without the surrounding label/wrapper. */
  compact?: boolean;
  disabled?: boolean;
  /** Optional id used by external `<label>` association. */
  id?: string;
}

const ORDER: PriorityValue[] = ["urgent", "high", "medium", "low"];

const LABELS: Record<PriorityValue, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

export default function PriorityPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
  id,
}: PriorityPickerProps) {
  const reactId = useId();
  const groupId = id || `priority-${reactId}`;

  return (
    <div
      role="radiogroup"
      aria-label="优先级"
      id={groupId}
      className={
        compact
          ? "inline-flex items-center gap-1"
          : "flex items-center gap-2"
      }
    >
      {ORDER.map((key) => {
        const swatch = priority[key];
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={disabled}
            onClick={() => onChange(key)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isActive ? swatch.bg : "transparent",
              borderColor: isActive ? swatch.border : "var(--border-strong)",
              color: isActive ? swatch.text : "var(--text-secondary)",
            }}
          >
            <span
              aria-hidden
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: swatch.dot }}
            />
            {LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}