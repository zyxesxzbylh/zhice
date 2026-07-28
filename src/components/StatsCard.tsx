"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: { direction: "up" | "down" | "flat"; value: string };
  className?: string;
  onClick?: () => void;
}

export const StatsCard = memo(function StatsCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  className,
  onClick,
}: StatsCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? "var(--color-success)"
      : trend?.direction === "down"
      ? "var(--color-danger)"
      : 'var(--text-muted)';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-xl border transition-colors",
        onClick && "cursor-pointer hover:border-[var(--border-strong)]",
        className
      )}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
        {icon && <span className="shrink-0 ml-2 opacity-60">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}
        </span>
        {subtitle && (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
        </span>
        )}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={trendColor}
            className={cn(trend.direction === "down" && "rotate-180")}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-[11px] font-medium" style={{ color: trendColor }}>
            {trend.value}
          </span>
        </div>
      )}
    </button>
  );
});
