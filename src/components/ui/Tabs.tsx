"use client";

/**
 * Tabs — minimal tab list.
 *
 * The selected tab is identified by `value`. Each `<Tabs.Tab>` has its
 * own `value` and the children are rendered when its value matches.
 * Tabs are rendered as buttons so they participate in keyboard nav
 * (Left/Right arrows move focus).
 *
 * Arrow-key support is provided by `useArrowNavigation` from
 * `@/hooks/useKeyboard`. The TabPanel is rendered only for the
 * currently active tab to keep DOM size small.
 */

import {
  useState,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
  Children,
  isValidElement,
  cloneElement,
} from "react";
import { cn } from "@/lib/utils";
import { radius } from "@/lib/theme";
import { useArrowNavigation } from "@/hooks/useKeyboard";

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const current = isControlled ? controlledValue : internalValue;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  // Collect tab metadata from children for arrow navigation.
  const tabValues: string[] = [];
  let tabContent: ReactNode = null;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === TabsList) {
      const items: string[] = [];
      Children.forEach((child as { props: { children: ReactNode } }).props.children, (tab) => {
        if (isValidElement(tab) && (tab as { type?: unknown }).type === Tab) {
          const v = (tab as { props: { value: string } }).props.value;
          items.push(v);
        }
      });
      tabValues.push(...items);
    } else if (child.type === TabPanel) {
      const v = (child as { props: { value: string } }).props.value;
      if (v === current) tabContent = (child as { props: { children: ReactNode } }).props.children;
    }
  });

  useArrowNavigation({
    onMove: (dir) => {
      if (!tabValues.length) return;
      const idx = tabValues.indexOf(current);
      if (idx === -1) return;
      let nextIdx = idx;
      if (dir === "left" || dir === "up") {
        nextIdx = (idx - 1 + tabValues.length) % tabValues.length;
      } else if (dir === "right" || dir === "down") {
        nextIdx = (idx + 1) % tabValues.length;
      } else if (dir === "home") {
        nextIdx = 0;
      } else if (dir === "end") {
        nextIdx = tabValues.length - 1;
      }
      setValue(tabValues[nextIdx]);
    },
    enabled: tabValues.length > 0,
    horizontal: true,
  });

  return (
    <div className={cn("w-full", className)}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        if (child.type === TabsList) {
          return cloneElement(child as React.ReactElement<{
            currentValue: string;
            onSelect: (value: string) => void;
          }>, { currentValue: current, onSelect: setValue });
        }
        if (child.type === TabPanel) {
          const v = (child as { props: { value: string } }).props.value;
          if (v !== current) return null;
          return child;
        }
        return child;
      })}
      {tabContent}
    </div>
  );
}

export interface TabsListProps {
  className?: string;
  children: ReactNode;
  currentValue?: string;
  onSelect?: (value: string) => void;
}

export function TabsList({ className, children, currentValue, onSelect }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-[var(--bg-muted)] border border-[var(--border-default)]",
        className,
      )}
      style={{ borderRadius: radius.md }}
    >
      {Children.map(children, (child) => {
        if (!isValidElement(child) || child.type !== Tab) return child;
        return cloneElement(child as React.ReactElement<{
          currentValue?: string;
          onSelect?: (value: string) => void;
        }>, { currentValue, onSelect });
      })}
    </div>
  );
}

export interface TabProps {
  value: string;
  disabled?: boolean;
  currentValue?: string;
  onSelect?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tab({ value, disabled, currentValue, onSelect, children, className }: TabProps) {
  const isActive = currentValue === value;
  const handleClick = () => {
    if (!disabled) onSelect?.(value);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "px-4 py-1.5 text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[var(--accent-muted)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isActive
          ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm"
          : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        className,
      )}
      style={{ borderRadius: "0.375rem" }}
    >
      {children}
    </button>
  );
}

export interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ children, className }: TabPanelProps) {
  return (
    <div role="tabpanel" className={cn("mt-4", className)}>
      {children}
    </div>
  );
}

Tabs.List = TabsList;
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;
