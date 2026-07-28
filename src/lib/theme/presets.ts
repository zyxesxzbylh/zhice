/**
 * 主题预设系统
 *
 * 提供四套预设主题：极简 / 工业 / 智能 / 赛博
 * 每套主题定义完整的 CSS 自定义属性集合
 *
 * 使用方式：
 *   import { themes, ThemePreset } from "@/lib/theme/presets";
 *   const theme = themes.minimal;
 */

/* ── 类型定义 ── */

export type ThemeMode = "light" | "dark";

export interface ThemeVars {
  /* 基础底色 */
  "--bg-root": string;           // 页面根背景
  "--bg-surface": string;        // 卡片/面板背景
  "--bg-surface-hover": string;  // 卡片悬停
  "--bg-muted": string;          // 次级背景（按钮、标签页容器等）
  "--bg-muted-hover": string;    // 次级背景悬停
  "--bg-inverse": string;        // 反色背景（主按钮）

  /* 文字 */
  "--text-primary": string;      // 主文字
  "--text-secondary": string;    // 辅助文字
  "--text-muted": string;        // 禁用/占位文字
  "--text-inverse": string;      // 反色文字（深底白字）

  /* 边框 */
  "--border-default": string;    // 默认边框
  "--border-strong": string;     // 强调边框
  "--border-subtle": string;     // 弱边框

  /* 强调色 */
  "--accent": string;            // 主强调色
  "--accent-hover": string;      // 强调色悬停
  "--accent-muted": string;      // 强调色浅底
  "--accent-text": string;       // 强调色上的文字

  /* 功能色 */
  "--color-success": string;
  "--color-warning": string;
  "--color-danger": string;
  "--color-info": string;

  /* 阴影 */
  "--shadow-sm": string;
  "--shadow-md": string;
  "--shadow-lg": string;

  /* 圆角 */
  "--radius-sm": string;
  "--radius-md": string;
  "--radius-lg": string;
  "--radius-xl": string;

  /* 品牌标识 */
  "--brand-bg": string;
  "--brand-text": string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  vars: ThemeVars;
}

/* ── 预设主题 ── */

/** 极简白 — 暖白底 + 克制灰阶，留白充裕 */
const minimal: ThemePreset = {
  id: "minimal",
  name: "极简白",
  description: "暖白基调，克制灰阶，充裕留白",
  mode: "light",
  vars: {
    "--bg-root": "#fafaf8",
    "--bg-surface": "#ffffff",
    "--bg-surface-hover": "#f5f5f2",
    "--bg-muted": "#f0f0ed",
    "--bg-muted-hover": "#e8e8e4",
    "--bg-inverse": "#1a1a1a",

    "--text-primary": "#1a1a1a",
    "--text-secondary": "#6b6b65",
    "--text-muted": "#a0a09a",
    "--text-inverse": "#fafaf8",

    "--border-default": "#e8e8e4",
    "--border-strong": "#d4d4ce",
    "--border-subtle": "#f0f0ed",

    "--accent": "#3d3d3a",
    "--accent-hover": "#1a1a1a",
    "--accent-muted": "#f0f0ed",
    "--accent-text": "#ffffff",

    "--color-success": "#4a9e7b",
    "--color-warning": "#d4a24e",
    "--color-danger": "#d15b4c",
    "--color-info": "#5b8db8",

    "--shadow-sm": "0 1px 2px rgba(0,0,0,0.04)",
    "--shadow-md": "0 4px 12px rgba(0,0,0,0.06)",
    "--shadow-lg": "0 12px 32px rgba(0,0,0,0.08)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#1a1a1a",
    "--brand-text": "#fafaf8",
  },
};

/** 工业灰 — 混凝土 + 钢结构感，棱角分明 */
const industrial: ThemePreset = {
  id: "industrial",
  name: "工业灰",
  description: "混凝土质感，钢结构线条，棱角分明",
  mode: "light",
  vars: {
    "--bg-root": "#eceded",
    "--bg-surface": "#f4f4f3",
    "--bg-surface-hover": "#eaeaed",
    "--bg-muted": "#e2e2df",
    "--bg-muted-hover": "#d6d6d2",
    "--bg-inverse": "#2a2a2c",

    "--text-primary": "#1c1c1e",
    "--text-secondary": "#5c5c5e",
    "--text-muted": "#8e8e90",
    "--text-inverse": "#eceded",

    "--border-default": "#d1d1ce",
    "--border-strong": "#b0b0ac",
    "--border-subtle": "#e2e2df",

    "--accent": "#4a4a4c",
    "--accent-hover": "#2a2a2c",
    "--accent-muted": "#e2e2df",
    "--accent-text": "#f4f4f3",

    "--color-success": "#5c8a6e",
    "--color-warning": "#c49a4a",
    "--color-danger": "#c45a4a",
    "--color-info": "#5a7a9a",

    "--shadow-sm": "0 1px 1px rgba(0,0,0,0.06)",
    "--shadow-md": "0 2px 8px rgba(0,0,0,0.08)",
    "--shadow-lg": "0 8px 24px rgba(0,0,0,0.1)",

    "--radius-sm": "0.125rem",
    "--radius-md": "0.25rem",
    "--radius-lg": "0.375rem",
    "--radius-xl": "0.5rem",

    "--brand-bg": "#2a2a2c",
    "--brand-text": "#eceded",
  },
};

/** 智慧蓝 — 冷蓝灰底，科技感，数据驱动氛围 */
const smart: ThemePreset = {
  id: "smart",
  name: "智慧蓝",
  description: "冷蓝基调，科技质感，数据驱动",
  mode: "light",
  vars: {
    "--bg-root": "#f5f7fa",
    "--bg-surface": "#ffffff",
    "--bg-surface-hover": "#f0f3f8",
    "--bg-muted": "#ebeff5",
    "--bg-muted-hover": "#e0e5f0",
    "--bg-inverse": "#1e293b",

    "--text-primary": "#0f172a",
    "--text-secondary": "#475569",
    "--text-muted": "#94a3b8",
    "--text-inverse": "#f8fafc",

    "--border-default": "#e2e8f0",
    "--border-strong": "#cbd5e1",
    "--border-subtle": "#f1f5f9",

    "--accent": "#4f6ef7",
    "--accent-hover": "#3b54d4",
    "--accent-muted": "#eef2ff",
    "--accent-text": "#ffffff",

    "--color-success": "#10b981",
    "--color-warning": "#f59e0b",
    "--color-danger": "#ef4444",
    "--color-info": "#6366f1",

    "--shadow-sm": "0 1px 2px rgba(15,23,42,0.04)",
    "--shadow-md": "0 4px 6px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.04)",
    "--shadow-lg": "0 10px 15px rgba(15,23,42,0.08), 0 4px 6px rgba(15,23,42,0.04)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#4f6ef7",
    "--brand-text": "#ffffff",
  },
};

/** 暗夜赛博 — 深色底 + 青霓虹点缀，赛博朋克克制版 */
const cyber: ThemePreset = {
  id: "cyber",
  name: "暗夜赛博",
  description: "深暗基底，青霓虹点缀，克制赛博感",
  mode: "dark",
  vars: {
    "--bg-root": "#0b0f16",
    "--bg-surface": "#131a24",
    "--bg-surface-hover": "#1a2230",
    "--bg-muted": "#1a2230",
    "--bg-muted-hover": "#232d3d",
    "--bg-inverse": "#e2e8f0",

    "--text-primary": "#e2e8f0",
    "--text-secondary": "#94a3b8",
    "--text-muted": "#64748b",
    "--text-inverse": "#0b0f16",

    "--border-default": "#1e293b",
    "--border-strong": "#334155",
    "--border-subtle": "#1a2230",

    "--accent": "#22d3ee",
    "--accent-hover": "#67e8f9",
    "--accent-muted": "#0f2838",
    "--accent-text": "#0b0f16",

    "--color-success": "#34d399",
    "--color-warning": "#fbbf24",
    "--color-danger": "#f87171",
    "--color-info": "#818cf8",

    "--shadow-sm": "0 1px 2px rgba(0,0,0,0.3)",
    "--shadow-md": "0 4px 12px rgba(0,0,0,0.4)",
    "--shadow-lg": "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,211,238,0.1)",

    "--radius-sm": "0.25rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.75rem",

    "--brand-bg": "#22d3ee",
    "--brand-text": "#0b0f16",
  },
};

/** 雾霭紫 — 低饱和紫灰，柔和梦幻 */
const mist: ThemePreset = {
  id: "mist",
  name: "雾霭紫",
  description: "低饱和紫灰，柔和梦幻，安静治愈",
  mode: "light",
  vars: {
    "--bg-root": "#f7f5f9",
    "--bg-surface": "#fdfcfd",
    "--bg-surface-hover": "#f3f0f6",
    "--bg-muted": "#edeaf2",
    "--bg-muted-hover": "#e4dff0",
    "--bg-inverse": "#383347",

    "--text-primary": "#2d2640",
    "--text-secondary": "#6b6380",
    "--text-muted": "#9e96b0",
    "--text-inverse": "#f7f5f9",

    "--border-default": "#e4dff0",
    "--border-strong": "#cdc4de",
    "--border-subtle": "#edeaf2",

    "--accent": "#7c6baa",
    "--accent-hover": "#5e4f8a",
    "--accent-muted": "#edeaf2",
    "--accent-text": "#ffffff",

    "--color-success": "#5ea888",
    "--color-warning": "#c8a356",
    "--color-danger": "#d46e60",
    "--color-info": "#6b8fbf",

    "--shadow-sm": "0 1px 2px rgba(45,38,64,0.04)",
    "--shadow-md": "0 4px 12px rgba(45,38,64,0.06)",
    "--shadow-lg": "0 12px 32px rgba(45,38,64,0.08)",

    "--radius-sm": "0.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.875rem",
    "--radius-xl": "1.125rem",

    "--brand-bg": "#5e4f8a",
    "--brand-text": "#f7f5f9",
  },
};

/** 墨韵 — 古典水墨画风，纸黄底+浓墨字 */
const ink: ThemePreset = {
  id: "ink",
  name: "墨韵",
  description: "古典水墨画风，纸黄暖底配浓墨文字",
  mode: "light",
  vars: {
    "--bg-root": "#f5f0e8",
    "--bg-surface": "#faf7f0",
    "--bg-surface-hover": "#f0eade",
    "--bg-muted": "#ebe4d4",
    "--bg-muted-hover": "#e2d9c4",
    "--bg-inverse": "#2c2416",

    "--text-primary": "#2c2416",
    "--text-secondary": "#6b5e4a",
    "--text-muted": "#9e9078",
    "--text-inverse": "#f5f0e8",

    "--border-default": "#e2d9c4",
    "--border-strong": "#c4b898",
    "--border-subtle": "#ebe4d4",

    "--accent": "#5c3d2e",
    "--accent-hover": "#3d2518",
    "--accent-muted": "#ebe4d4",
    "--accent-text": "#faf7f0",

    "--color-success": "#5c8a6e",
    "--color-warning": "#c4944a",
    "--color-danger": "#c45a4a",
    "--color-info": "#5a7a9a",

    "--shadow-sm": "0 1px 2px rgba(44,36,22,0.05)",
    "--shadow-md": "0 4px 12px rgba(44,36,22,0.08)",
    "--shadow-lg": "0 12px 32px rgba(44,36,22,0.1)",

    "--radius-sm": "0.25rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",

    "--brand-bg": "#2c2416",
    "--brand-text": "#f5f0e8",
  },
};

/** 深海 — 深蓝黑底，沉浸专注 */
const ocean: ThemePreset = {
  id: "ocean",
  name: "深海",
  description: "深蓝黑底，沉浸专注，暗而不沉",
  mode: "dark",
  vars: {
    "--bg-root": "#0c1420",
    "--bg-surface": "#131d2e",
    "--bg-surface-hover": "#1a2740",
    "--bg-muted": "#1a2740",
    "--bg-muted-hover": "#243452",
    "--bg-inverse": "#e0e8f0",

    "--text-primary": "#dce4f0",
    "--text-secondary": "#8ea4c0",
    "--text-muted": "#5a7090",
    "--text-inverse": "#0c1420",

    "--border-default": "#1e3050",
    "--border-strong": "#304868",
    "--border-subtle": "#1a2740",

    "--accent": "#5b9cf5",
    "--accent-hover": "#80b8f8",
    "--accent-muted": "#152338",
    "--accent-text": "#0c1420",

    "--color-success": "#3ecf8e",
    "--color-warning": "#f0b840",
    "--color-danger": "#f06060",
    "--color-info": "#8098f8",

    "--shadow-sm": "0 1px 2px rgba(0,0,0,0.3)",
    "--shadow-md": "0 4px 12px rgba(0,0,0,0.4)",
    "--shadow-lg": "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(91,156,245,0.08)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#5b9cf5",
    "--brand-text": "#0c1420",
  },
};

/** 森林 — 自然绿调，清新沉稳 */
const forest: ThemePreset = {
  id: "forest",
  name: "森林",
  description: "自然绿调，清新沉稳，回归专注",
  mode: "light",
  vars: {
    "--bg-root": "#f4f7f2",
    "--bg-surface": "#fafbf8",
    "--bg-surface-hover": "#eef2ea",
    "--bg-muted": "#e7ece2",
    "--bg-muted-hover": "#dce4d4",
    "--bg-inverse": "#1c2618",

    "--text-primary": "#1c2618",
    "--text-secondary": "#546348",
    "--text-muted": "#8a9a7e",
    "--text-inverse": "#f4f7f2",

    "--border-default": "#dce4d4",
    "--border-strong": "#bcc8ae",
    "--border-subtle": "#e7ece2",

    "--accent": "#4a7c3f",
    "--accent-hover": "#365c2e",
    "--accent-muted": "#e7ece2",
    "--accent-text": "#fafbf8",

    "--color-success": "#4a8c3f",
    "--color-warning": "#c4943a",
    "--color-danger": "#c45a4a",
    "--color-info": "#4a7a9c",

    "--shadow-sm": "0 1px 2px rgba(28,38,24,0.04)",
    "--shadow-md": "0 4px 12px rgba(28,38,24,0.06)",
    "--shadow-lg": "0 12px 32px rgba(28,38,24,0.08)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#365c2e",
    "--brand-text": "#f4f7f2",
  },
};

/** 晨曦 — 温暖琥珀金，柔和舒适 */
const dawn: ThemePreset = {
  id: "dawn",
  name: "晨曦",
  description: "温暖琥珀金调，柔和舒适，如晨光",
  mode: "light",
  vars: {
    "--bg-root": "#fdf8f2",
    "--bg-surface": "#fffdfa",
    "--bg-surface-hover": "#faf2e4",
    "--bg-muted": "#f5ead4",
    "--bg-muted-hover": "#f0e0c0",
    "--bg-inverse": "#3d2e1a",

    "--text-primary": "#3d2e1a",
    "--text-secondary": "#7a6544",
    "--text-muted": "#b09a70",
    "--text-inverse": "#fdf8f2",

    "--border-default": "#f0e0c0",
    "--border-strong": "#dcc898",
    "--border-subtle": "#f5ead4",

    "--accent": "#b87333",
    "--accent-hover": "#8c5622",
    "--accent-muted": "#f5ead4",
    "--accent-text": "#fffdfa",

    "--color-success": "#5c8a5e",
    "--color-warning": "#d4a24e",
    "--color-danger": "#d15b4c",
    "--color-info": "#5b8db8",

    "--shadow-sm": "0 1px 2px rgba(61,46,26,0.04)",
    "--shadow-md": "0 4px 12px rgba(61,46,26,0.06)",
    "--shadow-lg": "0 12px 32px rgba(61,46,26,0.08)",

    "--radius-sm": "0.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.875rem",
    "--radius-xl": "1.125rem",

    "--brand-bg": "#8c5622",
    "--brand-text": "#fdf8f2",
  },
};

/** 禅意 — 日式枯山水，素雅静谧 */
const zen: ThemePreset = {
  id: "zen",
  name: "禅意",
  description: "日式枯山水，素雅静谧，极致留白",
  mode: "light",
  vars: {
    "--bg-root": "#fafaf7",
    "--bg-surface": "#fdfdfb",
    "--bg-surface-hover": "#f3f3ee",
    "--bg-muted": "#eeede6",
    "--bg-muted-hover": "#e6e4da",
    "--bg-inverse": "#2a2820",

    "--text-primary": "#2a2820",
    "--text-secondary": "#6e6b5e",
    "--text-muted": "#a09d90",
    "--text-inverse": "#fafaf7",

    "--border-default": "#e6e4da",
    "--border-strong": "#cecbb8",
    "--border-subtle": "#eeede6",

    "--accent": "#6b8a6e",
    "--accent-hover": "#4d6650",
    "--accent-muted": "#e6f0e2",
    "--accent-text": "#ffffff",

    "--color-success": "#6b8a6e",
    "--color-warning": "#c4a04a",
    "--color-danger": "#c45a4a",
    "--color-info": "#6b8098",

    "--shadow-sm": "0 1px 2px rgba(42,40,32,0.03)",
    "--shadow-md": "0 4px 12px rgba(42,40,32,0.05)",
    "--shadow-lg": "0 12px 32px rgba(42,40,32,0.06)",

    "--radius-sm": "0.25rem",
    "--radius-md": "0.375rem",
    "--radius-lg": "0.5rem",
    "--radius-xl": "0.625rem",

    "--brand-bg": "#2a2820",
    "--brand-text": "#fdfdfb",
  },
};

/** 琥珀暖 — 浓郁琥珀色，温暖深邃 */
const amber: ThemePreset = {
  id: "amber",
  name: "琥珀暖",
  description: "浓郁琥珀橘棕，温暖深邃，复古质感",
  mode: "light",
  vars: {
    "--bg-root": "#fdf7f0",
    "--bg-surface": "#fffcf8",
    "--bg-surface-hover": "#faf0e0",
    "--bg-muted": "#f5e8d0",
    "--bg-muted-hover": "#f0dcb8",
    "--bg-inverse": "#3a2010",

    "--text-primary": "#3a2010",
    "--text-secondary": "#7a5030",
    "--text-muted": "#b08060",
    "--text-inverse": "#fdf7f0",

    "--border-default": "#f0dcb8",
    "--border-strong": "#d8b890",
    "--border-subtle": "#f5e8d0",

    "--accent": "#c07030",
    "--accent-hover": "#905020",
    "--accent-muted": "#f5e8d0",
    "--accent-text": "#fffcf8",

    "--color-success": "#5c8a5e",
    "--color-warning": "#d4a040",
    "--color-danger": "#d05a4a",
    "--color-info": "#5b8ab0",

    "--shadow-sm": "0 1px 2px rgba(58,32,16,0.04)",
    "--shadow-md": "0 4px 12px rgba(58,32,16,0.06)",
    "--shadow-lg": "0 12px 32px rgba(58,32,16,0.08)",

    "--radius-sm": "0.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.875rem",
    "--radius-xl": "1.125rem",

    "--brand-bg": "#905020",
    "--brand-text": "#fdf7f0",
  },
};

/** 星河 — 深空暗底，紫蓝微光，灵感暗涌 */
const starry: ThemePreset = {
  id: "starry",
  name: "星河",
  description: "星河流转，深邃紫蓝，灵感暗涌",
  mode: "dark",
  vars: {
    "--bg-root": "#0d0f1a",
    "--bg-surface": "#141829",
    "--bg-surface-hover": "#1c2240",
    "--bg-muted": "#1c2240",
    "--bg-muted-hover": "#252d52",
    "--bg-inverse": "#e0dff0",

    "--text-primary": "#d8d6f0",
    "--text-secondary": "#8e8ab0",
    "--text-muted": "#5a5680",
    "--text-inverse": "#0d0f1a",

    "--border-default": "#252340",
    "--border-strong": "#3d3870",
    "--border-subtle": "#1c2040",

    "--accent": "#8b7cf0",
    "--accent-hover": "#a89ef8",
    "--accent-muted": "#1a1840",
    "--accent-text": "#0d0f1a",

    "--color-success": "#4adea0",
    "--color-warning": "#f0c040",
    "--color-danger": "#f06070",
    "--color-info": "#8098f8",

    "--shadow-sm": "0 1px 2px rgba(0,0,0,0.3)",
    "--shadow-md": "0 4px 12px rgba(0,0,0,0.4)",
    "--shadow-lg": "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,124,240,0.08)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#8b7cf0",
    "--brand-text": "#0d0f1a",
  },
};

/** 薄荷绿 — 清爽绿意，焕然一新 */
const mint: ThemePreset = {
  id: "mint",
  name: "薄荷绿",
  description: "薄荷清风，清爽绿意，焕然一新",
  mode: "light",
  vars: {
    "--bg-root": "#f5faf8",
    "--bg-surface": "#fdfefd",
    "--bg-surface-hover": "#edf6f2",
    "--bg-muted": "#e6f2ec",
    "--bg-muted-hover": "#d8ece2",
    "--bg-inverse": "#1a2a22",

    "--text-primary": "#1a2a22",
    "--text-secondary": "#4a6a5a",
    "--text-muted": "#809a8a",
    "--text-inverse": "#f5faf8",

    "--border-default": "#d8ece2",
    "--border-strong": "#b0d0ba",
    "--border-subtle": "#e6f2ec",

    "--accent": "#3db88b",
    "--accent-hover": "#2a9068",
    "--accent-muted": "#e6f2ec",
    "--accent-text": "#ffffff",

    "--color-success": "#3db88b",
    "--color-warning": "#d4a040",
    "--color-danger": "#d05a50",
    "--color-info": "#5b8ab8",

    "--shadow-sm": "0 1px 2px rgba(26,42,34,0.04)",
    "--shadow-md": "0 4px 12px rgba(26,42,34,0.06)",
    "--shadow-lg": "0 12px 32px rgba(26,42,34,0.08)",

    "--radius-sm": "0.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.875rem",
    "--radius-xl": "1.125rem",

    "--brand-bg": "#2a9068",
    "--brand-text": "#fdfefd",
  },
};

/** 月光灰 — 柔和月光，优雅灰调，静谧夜晚 */
const moonlit: ThemePreset = {
  id: "moonlit",
  name: "月光灰",
  description: "柔和月光，优雅灰调，静谧夜晚",
  mode: "dark",
  vars: {
    "--bg-root": "#1a1c1e",
    "--bg-surface": "#222528",
    "--bg-surface-hover": "#2a2e32",
    "--bg-muted": "#2a2e32",
    "--bg-muted-hover": "#353a40",
    "--bg-inverse": "#e8e8e6",

    "--text-primary": "#e0e0dc",
    "--text-secondary": "#909090",
    "--text-muted": "#606060",
    "--text-inverse": "#1a1c1e",

    "--border-default": "#353a40",
    "--border-strong": "#505860",
    "--border-subtle": "#2a2e32",

    "--accent": "#c0c0b8",
    "--accent-hover": "#d8d8d0",
    "--accent-muted": "#2a2a28",
    "--accent-text": "#1a1c1e",

    "--color-success": "#5ab890",
    "--color-warning": "#d4a850",
    "--color-danger": "#d46860",
    "--color-info": "#7098c0",

    "--shadow-sm": "0 1px 2px rgba(0,0,0,0.3)",
    "--shadow-md": "0 4px 12px rgba(0,0,0,0.4)",
    "--shadow-lg": "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(192,192,184,0.06)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#c0c0b8",
    "--brand-text": "#1a1c1e",
  },
};

/** 薰衣草 — 温柔紫调，甜美入梦 */
const lavender: ThemePreset = {
  id: "lavender",
  name: "薰衣草",
  description: "薰衣草海，温柔紫调，甜美入梦",
  mode: "light",
  vars: {
    "--bg-root": "#faf7fc",
    "--bg-surface": "#fefdfe",
    "--bg-surface-hover": "#f4eef8",
    "--bg-muted": "#efe6f5",
    "--bg-muted-hover": "#e6daf0",
    "--bg-inverse": "#382840",

    "--text-primary": "#382840",
    "--text-secondary": "#706080",
    "--text-muted": "#a090b0",
    "--text-inverse": "#faf7fc",

    "--border-default": "#e6daf0",
    "--border-strong": "#ceb8e0",
    "--border-subtle": "#efe6f5",

    "--accent": "#9b6ec0",
    "--accent-hover": "#7a4ea0",
    "--accent-muted": "#efe6f5",
    "--accent-text": "#ffffff",

    "--color-success": "#5ea888",
    "--color-warning": "#c8a050",
    "--color-danger": "#d46a60",
    "--color-info": "#6b8cc0",

    "--shadow-sm": "0 1px 2px rgba(56,40,64,0.04)",
    "--shadow-md": "0 4px 12px rgba(56,40,64,0.06)",
    "--shadow-lg": "0 12px 32px rgba(56,40,64,0.08)",

    "--radius-sm": "0.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.875rem",
    "--radius-xl": "1.125rem",

    "--brand-bg": "#7a4ea0",
    "--brand-text": "#fefdfe",
  },
};

/** 极光白 — 纯粹冰蓝，自然纯净 */
const arctic: ThemePreset = {
  id: "arctic",
  name: "极光白",
  description: "极光白雪，纯粹冰蓝，自然纯净",
  mode: "light",
  vars: {
    "--bg-root": "#f8fafd",
    "--bg-surface": "#ffffff",
    "--bg-surface-hover": "#f2f6fb",
    "--bg-muted": "#edf2f8",
    "--bg-muted-hover": "#e2eaf4",
    "--bg-inverse": "#1e2a3a",

    "--text-primary": "#1e2a3a",
    "--text-secondary": "#506070",
    "--text-muted": "#90a0b0",
    "--text-inverse": "#f8fafd",

    "--border-default": "#e2eaf4",
    "--border-strong": "#c0d0e0",
    "--border-subtle": "#edf2f8",

    "--accent": "#5090d0",
    "--accent-hover": "#3870b0",
    "--accent-muted": "#e8f0f8",
    "--accent-text": "#ffffff",

    "--color-success": "#5ab880",
    "--color-warning": "#d0a848",
    "--color-danger": "#d46060",
    "--color-info": "#6088c0",

    "--shadow-sm": "0 1px 2px rgba(30,42,58,0.04)",
    "--shadow-md": "0 4px 12px rgba(30,42,58,0.06)",
    "--shadow-lg": "0 12px 32px rgba(30,42,58,0.08)",

    "--radius-sm": "0.375rem",
    "--radius-md": "0.5rem",
    "--radius-lg": "0.75rem",
    "--radius-xl": "1rem",

    "--brand-bg": "#3870b0",
    "--brand-text": "#ffffff",
  },
};

/** 玫瑰金 — 温暖优雅，复古柔情 */
const rosegold: ThemePreset = {
  id: "rosegold",
  name: "玫瑰金",
  description: "玫瑰金调，温暖优雅，复古柔情",
  mode: "light",
  vars: {
    "--bg-root": "#fdf8f6",
    "--bg-surface": "#fffdfc",
    "--bg-surface-hover": "#faf2ee",
    "--bg-muted": "#f5eae4",
    "--bg-muted-hover": "#f0ded4",
    "--bg-inverse": "#3a2220",

    "--text-primary": "#3a2220",
    "--text-secondary": "#7a5048",
    "--text-muted": "#b08070",
    "--text-inverse": "#fdf8f6",

    "--border-default": "#f0ded4",
    "--border-strong": "#d8b8a8",
    "--border-subtle": "#f5eae4",

    "--accent": "#c87860",
    "--accent-hover": "#a05840",
    "--accent-muted": "#f5eae4",
    "--accent-text": "#ffffff",

    "--color-success": "#5ea870",
    "--color-warning": "#d0a048",
    "--color-danger": "#d46058",
    "--color-info": "#6b88b8",

    "--shadow-sm": "0 1px 2px rgba(58,34,32,0.04)",
    "--shadow-md": "0 4px 12px rgba(58,34,32,0.06)",
    "--shadow-lg": "0 12px 32px rgba(58,34,32,0.08)",

    "--radius-sm": "0.5rem",
    "--radius-md": "0.625rem",
    "--radius-lg": "0.875rem",
    "--radius-xl": "1.125rem",

    "--brand-bg": "#a05840",
    "--brand-text": "#fffdfc",
  },
};

/* ── 导出 ── */

export const themes: Record<string, ThemePreset> = {
  minimal,
  industrial,
  smart,
  cyber,
  mist,
  ink,
  ocean,
  forest,
  dawn,
  zen,
  amber,
  starry,
  mint,
  moonlit,
  lavender,
  arctic,
  rosegold,
};

export const themeList: ThemePreset[] = [
  minimal,
  industrial,
  smart,
  cyber,
  mist,
  ink,
  ocean,
  forest,
  dawn,
  zen,
  amber,
  starry,
  mint,
  moonlit,
  lavender,
  arctic,
  rosegold,
];

export function getThemeById(id: string): ThemePreset {
  return themes[id] ?? minimal;
}

/* ── 板块可见性默认值 ── */

export interface SectionVisibility {
  dashboardStats: boolean;
  dashboardGoals: boolean;
  dashboardCharts: boolean;
  tasksCreateTemplate: boolean;
  tasksAiSplit: boolean;
  tasksTodaySummary: boolean;
  careerGrowth: boolean;
  careerGoals: boolean;
  careerRetro: boolean;
  careerMethods: boolean;
  knowledgeBase: boolean;
}

export const defaultVisibility: SectionVisibility = {
  dashboardStats: true,
  dashboardGoals: true,
  dashboardCharts: true,
  tasksCreateTemplate: true,
  tasksAiSplit: true,
  tasksTodaySummary: true,
  careerGrowth: true,
  careerGoals: true,
  careerRetro: true,
  careerMethods: true,
  knowledgeBase: true,
};

/* ── 主题配置完整类型 ── */

export interface ThemeConfig {
  presetId: string;
  accentColor: string;          // 自定义强调色 (hex)
  useCustomAccent: boolean;     // 是否使用自定义强调色
  sectionVisibility: SectionVisibility;
}

export const defaultThemeConfig: ThemeConfig = {
  presetId: "minimal",
  accentColor: "#4f6ef7",
  useCustomAccent: false,
  sectionVisibility: defaultVisibility,
};
