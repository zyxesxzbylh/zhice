"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CareerPath = "expert" | "management";

interface CareerPathSelectorProps {
  initialPath?: CareerPath | null;
  onSelect?: (path: CareerPath) => void;
  className?: string;
}

interface PathInfo {
  key: CareerPath;
  label: string;
  subtitle: string;
  icon: string;
  features: {
    core: string;
    focus: string;
    satisfaction: string;
    support: string;
  };
}

const PATH_DATA: PathInfo[] = [
  {
    key: "expert",
    label: "专家路线",
    subtitle: "深耕专业领域，成为行业顶尖人才",
    icon: "expert",
    features: {
      core: "技术深度突破、方法论创新、行业标准制定",
      focus: "解决复杂技术难题，持续深钻单领域",
      satisfaction: "技术突破带来的成就感，同行认可",
      support: "技术培训预算、专利奖励、技术峰会参与",
    },
  },
  {
    key: "management",
    label: "管理路线",
    subtitle: "带领团队成长，放大组织效能",
    icon: "management",
    features: {
      core: "团队搭建与培养、资源协调、战略决策",
      focus: "提升团队产出，协调多维度目标",
      satisfaction: "团队成长带来的成就感，组织影响",
      support: "管理培训、领导力教练、跨部门轮岗机会",
    },
  },
];

export function CareerPathSelector({
  initialPath,
  onSelect,
  className,
}: CareerPathSelectorProps) {
  const [selected, setSelected] = useState<CareerPath | null>(initialPath || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialPath);

  const handleSelect = async (path: CareerPath) => {
    if (saving) return;
    setSelected(path);
    setSaving(true);

    try {
      const now = new Date();
      // 述职基准日期：30天后
      const reviewDate = new Date(now);
      reviewDate.setDate(reviewDate.getDate() + 30);
      const reviewBaseDate = reviewDate.toISOString().split("T")[0];

      const res = await fetch("/api/career/path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerPath: path, reviewBaseDate }),
      });

      if (res.ok) {
        setSaved(true);
        onSelect?.(path);
      }
    } catch (e) {
      console.error("保存职业路线失败:", e);
    } finally {
      setSaving(false);
    }
  };

  const features = [
    { label: "核心产出", key: "core" as const },
    { label: "工作重心", key: "focus" as const },
    { label: "成就感来源", key: "satisfaction" as const },
    { label: "执策支持", key: "support" as const },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>选择职业路线</h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          选择一条路线，执策将据此调整能力评估和成长建议
        </p>
      </div>

      {/* 对比卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PATH_DATA.map((info) => {
          const isSelected = selected === info.key;
          const isRecommended = info.key === "expert";

          return (
            <button
              key={info.key}
              onClick={() => handleSelect(info.key)}
              disabled={saving}
              className={cn(
                "text-left rounded-xl border-2 p-4 transition-all duration-200",
                "hover:shadow-md disabled:opacity-60",
                isSelected
                  ? info.key === "expert"
                    ? "border-[var(--color-expert)]"
                    : "border-[var(--color-management)]"
                  : "hover:bg-[var(--bg-muted-hover)]"
              )}
              style={{
                backgroundColor: isSelected
                  ? info.key === "expert"
                    ? 'var(--color-expert-bg)'
                    : 'var(--color-management-bg)'
                  : 'var(--bg-surface)',
                borderColor: isSelected
                  ? info.key === "expert"
                    ? 'var(--color-expert)'
                    : 'var(--color-management)'
                  : 'var(--border-subtle)',
              }}
            >
              {/* 头部 */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-lg",
                        isSelected ? "" : "grayscale"
                      )}
                    >
                      {info.key === "expert" ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--color-expert)]">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[var(--color-management)]">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{info.label}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{info.subtitle}</p>
                </div>
                {isSelected && (
                  <span
                    className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: info.key === "expert" ? 'var(--color-expert-bg)' : 'var(--color-management-bg)',
                      color: info.key === "expert" ? 'var(--color-expert)' : 'var(--color-management)',
                    }}
                  >
                    已选择
                  </span>
                )}
              </div>

              {/* 特性对比 */}
              <div className="space-y-2">
                {features.map((f) => (
                  <div key={f.key} className="flex gap-2">
                    <span className="text-xs w-16 flex-shrink-0 pt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {f.label}
                    </span>
                    <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {info.features[f.key]}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* 保存状态提示 */}
      {saved && selected && (
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--color-success-bg)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: 'var(--color-success)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs" style={{ color: 'var(--color-success-text)' }}>
            已选择「{selected === "expert" ? "专家路线" : "管理路线"}」，成长建议已更新
          </span>
        </div>
      )}

      {saving && (
        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>保存中...</p>
      )}
    </div>
  );
}
