"use client";

import { useTheme } from "@/contexts/ThemeContext";
import type { SectionVisibility } from "@/lib/theme/presets";

/* ── 预定义强调色候选 ── */
const ACCENT_PRESETS = [
  "#3d3d3a", // 石墨黑
  "#4f6ef7", // 智慧蓝
  "#6366f1", // 靛青
  "#8b5cf6", // 紫罗兰
  "#06b6d4", // 青色
  "#22d3ee", // 霓虹青
  "#10b981", // 翠绿
  "#f59e0b", // 琥珀
  "#ef4444", // 赤红
  "#ec4899", // 品红
];

/* ── 板块可见性列表 ── */
interface SectionItem {
  key: keyof SectionVisibility;
  label: string;
  group: string;
}

const SECTION_ITEMS: SectionItem[] = [
  { key: "dashboardStats", label: "统计卡片", group: "工作台" },
  { key: "dashboardGoals", label: "目标卡片", group: "工作台" },
  { key: "dashboardCharts", label: "数据图表", group: "工作台" },
  { key: "tasksCreateTemplate", label: "新建模板入口", group: "任务管理" },
  { key: "tasksAiSplit", label: "AI 拆分入口", group: "任务管理" },
  { key: "tasksTodaySummary", label: "今日总结入口", group: "任务管理" },
  { key: "careerGrowth", label: "成长仪表盘", group: "职业成长" },
  { key: "careerGoals", label: "下阶段目标", group: "职业成长" },
  { key: "careerRetro", label: "工作复盘", group: "职业成长" },
  { key: "careerMethods", label: "工作方法库", group: "职业成长" },
  { key: "knowledgeBase", label: "知识库", group: "知识库" },
];

/* ── 组件 ── */

export default function ThemeSettings() {
  const {
    config,
    preset,
    themeList,
    setPreset,
    setAccentColor,
    resetAccent,
    setSectionVisibility,
  } = useTheme();

  // 按分组整理板块
  const groupedSections = SECTION_ITEMS.reduce(
    (acc, item) => {
      if (!acc[item.group]) acc[item.group] = [];
      acc[item.group].push(item);
      return acc;
    },
    {} as Record<string, SectionItem[]>,
  );

  return (
    <div className="space-y-6">
      {/* ── 主题预设 ── */}
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          主题预设
        </h2>
        <p
          className="text-sm mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          选择一套视觉风格，所有页面即时生效
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {themeList.map((t) => {
            const isActive = t.id === config.presetId && !config.useCustomAccent;
            return (
              <button
                key={t.id}
                onClick={() => setPreset(t.id)}
                className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left"
                style={{
                  backgroundColor: isActive
                    ? "var(--accent-muted)"
                    : "var(--bg-surface-hover)",
                  borderColor: isActive
                    ? "var(--accent)"
                    : "var(--border-default)",
                }}
              >
                {/* 主题色预览条 */}
                <div className="flex gap-1 w-full">
                  <div
                    className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: t.vars["--bg-root"] }}
                  />
                  <div
                    className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: t.vars["--bg-surface"] }}
                  />
                  <div
                    className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: t.vars["--accent"] }}
                  />
                  <div
                    className="h-3 flex-1 rounded-sm"
                    style={{ backgroundColor: t.vars["--text-primary"] }}
                  />
                </div>
                <div className="w-full">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {t.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t.description}
                  </p>
                </div>
                {isActive && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="var(--accent-text)"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 强调色自定义 ── */}
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          强调色
        </h2>
        <p
          className="text-sm mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          自定义界面的强调色，用于按钮、链接和选中状态
        </p>
        <div className="flex flex-wrap gap-2.5 mb-4">
          {ACCENT_PRESETS.map((color) => {
            const isActive =
              config.useCustomAccent && config.accentColor === color;
            return (
              <button
                key={color}
                onClick={() => setAccentColor(color)}
                className="w-8 h-8 rounded-lg border-2 transition-all duration-150 hover:scale-110"
                style={{
                  backgroundColor: color,
                  borderColor: isActive
                    ? "var(--text-primary)"
                    : "transparent",
                  boxShadow: isActive
                    ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${color}`
                    : "none",
                }}
                title={color}
              />
            );
          })}
        </div>
        {config.useCustomAccent && (
          <button
            onClick={resetAccent}
            className="text-xs transition-colors hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            恢复预设强调色
          </button>
        )}
      </div>

      {/* ── 板块可见性 ── */}
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h2
          className="text-lg font-semibold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          板块显示
        </h2>
        <p
          className="text-sm mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          自由开关各功能模块的显示，打造专属工作空间
        </p>
        <div className="space-y-5">
          {Object.entries(groupedSections).map(([group, items]) => (
            <div key={group}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {group}
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.label}
                    </span>
                    <button
                      onClick={() =>
                        setSectionVisibility({
                          [item.key]:
                            !config.sectionVisibility[item.key],
                        })
                      }
                      className="relative w-11 h-6 rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor: config.sectionVisibility[item.key]
                          ? "var(--accent)"
                          : "var(--bg-muted-hover)",
                      }}
                    >
                      <div
                        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                        style={{
                          left: config.sectionVisibility[item.key]
                            ? "calc(100% - 1.375rem)"
                            : "0.125rem",
                        }}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
