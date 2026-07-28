"use client";

import { useState } from "react";

interface EnhancedStatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: "projects" | "tasks" | "completed" | "in_progress" | "overdue" | "time" | "streak" | "productivity";
  trend?: {
    value: number;
    positive: boolean;
    label?: string;
  };
  color: "black" | "dark" | "gray" | "light" | "white";
  onClick?: () => void;
  className?: string;
}

const iconMap = {
  projects: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  tasks: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  completed: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  in_progress: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  overdue: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  time: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  streak: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  productivity: (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

// 黑白灰配色方案
const colorMap = {
  black: {
    bg: "bg-[var(--accent)]",
    border: "border-[var(--accent)]",
    iconBg: "bg-[var(--accent)]",
    text: "text-[var(--text-inverse)]",
    subtext: "text-[var(--text-muted)]",
    trendUp: "text-[var(--color-success)]",
    trendDown: "text-[var(--color-danger)]",
  },
  dark: {
    bg: "bg-[var(--bg-inverse)]",
    border: "border-[var(--border-strong)]",
    iconBg: "bg-[var(--accent)]",
    text: "text-[var(--text-inverse)]",
    subtext: "text-[var(--text-muted)]",
    trendUp: "text-[var(--color-success)]",
    trendDown: "text-[var(--color-danger)]",
  },
  gray: {
    bg: "bg-[var(--bg-muted)]",
    border: "border-[var(--border-default)]",
    iconBg: "bg-[var(--accent)]",
    text: "text-[var(--text-primary)]",
    subtext: "text-[var(--text-muted)]",
    trendUp: "text-[var(--color-success)]",
    trendDown: "text-[var(--color-danger)]",
  },
  light: {
    bg: "bg-[var(--bg-root)]",
    border: "border-[var(--border-default)]",
    iconBg: "bg-[var(--text-muted)]",
    text: "text-[var(--text-primary)]",
    subtext: "text-[var(--text-muted)]",
    trendUp: "text-[var(--color-success)]",
    trendDown: "text-[var(--color-danger)]",
  },
  white: {
    bg: "bg-[var(--bg-surface)]",
    border: "border-[var(--border-default)]",
    iconBg: "bg-[var(--accent)]",
    text: "text-[var(--text-primary)]",
    subtext: "text-[var(--text-muted)]",
    trendUp: "text-[var(--color-success)]",
    trendDown: "text-[var(--color-danger)]",
  },
};

export default function EnhancedStatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color,
  onClick,
  className = "",
}: EnhancedStatsCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const colors = colorMap[color];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden rounded-xl border p-4 transition-all duration-300
        ${colors.bg} ${colors.border}
        ${onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""}
        ${className}
      `}
    >
      {/* 背景装饰 */}
      <div
        className={`
          absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 transition-transform duration-500
          ${color === "black" || color === "dark" ? "bg-[var(--text-inverse)]" : "bg-[var(--bg-inverse)]"}
          ${isHovered ? "scale-150" : "scale-100"}
        `}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${colors.subtext}`}>{title}</p>
          <p className={`mt-1 text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && (
            <p className={`mt-0.5 text-xs ${colors.subtext} truncate`}>{subtitle}</p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                className={trend.positive ? colors.trendUp : colors.trendDown}
              >
                {trend.positive ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V7H7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l9.2 9.2M17 7v10H7" />
                )}
              </svg>
              <span className={`text-xs font-medium ${trend.positive ? colors.trendUp : colors.trendDown}`}>
                {trend.positive ? "+" : "-"}{trend.value}%
              </span>
              {trend.label && (
                <span className={`text-xs ${colors.subtext}`}>{trend.label}</span>
              )}
            </div>
          )}
        </div>

        <div
          className={`
            flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white
            ${colors.iconBg} shadow-sm
            transition-transform duration-300
            ${isHovered ? "scale-110" : ""}
          `}
        >
          {iconMap[icon]}
        </div>
      </div>

      {/* 底部进度条装饰 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--bg-muted-hover)]">
        <div
          className={`
            h-full ${colors.iconBg} transition-all duration-700 ease-out
            ${isHovered ? "w-full" : "w-0"}
          `}
        />
      </div>
    </div>
  );
}
