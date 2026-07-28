"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type ThemePreset,
  type ThemeConfig,
  type SectionVisibility,
  getThemeById,
  themeList,
  defaultThemeConfig,
  defaultVisibility,
} from "@/lib/theme/presets";

/* ── 工具函数 ── */

const STORAGE_KEY = "flowsync-theme-config";

function loadConfig(): ThemeConfig {
  if (typeof window === "undefined") return defaultThemeConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultThemeConfig;
    const parsed = JSON.parse(raw);
    return {
      presetId: parsed.presetId ?? defaultThemeConfig.presetId,
      accentColor: parsed.accentColor ?? defaultThemeConfig.accentColor,
      useCustomAccent:
        parsed.useCustomAccent ?? defaultThemeConfig.useCustomAccent,
      sectionVisibility: {
        ...defaultVisibility,
        ...(parsed.sectionVisibility ?? {}),
      },
    };
  } catch {
    return defaultThemeConfig;
  }
}

function saveConfig(config: ThemeConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function applyVars(preset: ThemePreset, customAccent?: string) {
  const root = document.documentElement;
  const vars = preset.vars;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value as string);
  }
  // 如果启用自定义强调色，覆盖强调色相关变量
  if (customAccent) {
    root.style.setProperty("--accent", customAccent);
    // 自动生成 hover 和 muted 变体
    root.style.setProperty("--accent-hover", darken(customAccent, 0.12));
    root.style.setProperty("--accent-muted", customAccent + "18");
  }
  // 设置 color-scheme
  root.style.setProperty("color-scheme", preset.mode);
}

/** 简易 hex 深色化 */
function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) - Math.round(255 * amount)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) - Math.round(255 * amount)));
  const b = Math.max(0, Math.min(255, (num & 0xff) - Math.round(255 * amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/* ── Context ── */

interface ThemeContextValue {
  config: ThemeConfig;
  preset: ThemePreset;
  themeList: ThemePreset[];
  setPreset: (presetId: string) => void;
  setAccentColor: (color: string) => void;
  resetAccent: () => void;
  setSectionVisibility: (patch: Partial<SectionVisibility>) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultThemeConfig);
  const [mounted, setMounted] = useState(false);

  // 初始化：从 localStorage 加载
  useEffect(() => {
    const saved = loadConfig();
    setConfig(saved);
    const preset = getThemeById(saved.presetId);
    const accent = saved.useCustomAccent ? saved.accentColor : undefined;
    applyVars(preset, accent);
    setMounted(true);
  }, []);

  // 切换预设主题
  const setPreset = useCallback((presetId: string) => {
    const preset = getThemeById(presetId);
    setConfig((prev) => {
      const next: ThemeConfig = { ...prev, presetId, useCustomAccent: false };
      saveConfig(next);
      applyVars(preset);
      return next;
    });
  }, []);

  // 自定义强调色
  const setAccentColor = useCallback((color: string) => {
    setConfig((prev) => {
      const next: ThemeConfig = { ...prev, accentColor: color, useCustomAccent: true };
      saveConfig(next);
      const preset = getThemeById(next.presetId);
      applyVars(preset, color);
      return next;
    });
  }, []);

  // 恢复预设强调色
  const resetAccent = useCallback(() => {
    setConfig((prev) => {
      const next: ThemeConfig = { ...prev, useCustomAccent: false };
      saveConfig(next);
      const preset = getThemeById(next.presetId);
      applyVars(preset);
      return next;
    });
  }, []);

  // 板块可见性
  const setSectionVisibility = useCallback((patch: Partial<SectionVisibility>) => {
    setConfig((prev) => {
      const next: ThemeConfig = {
        ...prev,
        sectionVisibility: { ...prev.sectionVisibility, ...patch },
      };
      saveConfig(next);
      return next;
    });
  }, []);

  const preset = getThemeById(config.presetId);

  // 避免 SSR hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider
        value={{
          config: defaultThemeConfig,
          preset: getThemeById("minimal"),
          themeList,
          setPreset,
          setAccentColor,
          resetAccent,
          setSectionVisibility,
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        config,
        preset,
        themeList,
        setPreset,
        setAccentColor,
        resetAccent,
        setSectionVisibility,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { ThemeContext };
