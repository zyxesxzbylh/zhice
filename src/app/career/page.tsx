"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import { RetrospectiveForm, type RetroType } from "@/components/RetrospectiveForm";
import { GrowthDashboard } from "@/components/GrowthDashboard";
import MethodLibrary from "@/components/MethodLibrary";
import { PeriodGoals } from "@/components/PeriodGoals";
import { cn } from "@/lib/utils";

function CareerPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get("tab") as "dashboard" | "retro" | "methods" | "goals") || "dashboard";
  const [tab, setTab] = useState<"dashboard" | "retro" | "methods" | "goals">(initialTab);
  const today = new Date().toISOString().split("T")[0];
  const [retroType, setRetroType] = useState<RetroType>("daily");

  // URL 参数变化时同步 tab 状态
  useEffect(() => {
    const tabParam = searchParams.get("tab") as "dashboard" | "retro" | "methods" | "goals";
    if (tabParam && tabParam !== tab) {
      setTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function handleTabChange(newTab: "dashboard" | "retro" | "methods" | "goals") {
    setTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.replace(`/career?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <SidebarNav />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <header className="mb-6">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>职业成长</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>追踪成长轨迹，驱动职场进化</p>
          </header>

          {/* Tab 切换 */}
          <div className="flex gap-1 mb-6 rounded-xl p-1 w-full sm:max-w-sm overflow-x-auto" style={{ backgroundColor: 'var(--bg-muted)' }}>
            {([
              { key: "dashboard", label: "成长仪表盘" },
              { key: "goals", label: "下阶段目标" },
              { key: "retro", label: "工作复盘" },
              { key: "methods", label: "工作方法库" },
            ] as const).map((t) => (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                  tab === t.key ? "shadow-sm" : ""
                )}
                style={
                  tab === t.key
                    ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }
                    : { color: 'var(--text-muted)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 内容区 */}
          {tab === "dashboard" && (
            <div className="max-w-4xl">
              <GrowthDashboard />
            </div>
          )}
          {tab === "goals" && (
            <div>
              <div className="mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>下阶段目标</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>管理并按时间区域追踪你的阶段性目标</p>
              </div>
              <PeriodGoals />
            </div>
          )}
          {tab === "retro" && (
            <div className="max-w-2xl" data-tour="career-retro">
              {/* 周期选择器 */}
              <div className="flex items-center gap-1 mb-6 rounded-xl p-1" style={{ backgroundColor: 'var(--bg-muted)' }}>
                {(["daily", "weekly", "monthly", "quarterly", "yearly"] as RetroType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setRetroType(t)}
                    className={cn(
                      "flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      retroType === t ? "shadow-sm" : ""
                    )}
                    style={
                      retroType === t
                        ? { backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }
                        : { color: 'var(--text-muted)' }
                    }
                  >
                    {{ daily: "日", weekly: "周", monthly: "月", quarterly: "季", yearly: "年" }[t]}
                  </button>
                ))}
              </div>
              <RetrospectiveForm type={retroType} date={today} key={`${retroType}-${today}`} />
            </div>
          )}
          {tab === "methods" && (
            <div className="max-w-6xl">
              <div className="mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>工作方法库</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>系统化的工作方法、SOP 和最佳实践</p>
              </div>
              <MethodLibrary />
            </div>
          )}
        </main>
        <MobileNav activeItem="career" />
      </div>
    </div>
  );
}

export default function CareerPage() {
  return (
    <Suspense fallback={
      <div className="flex h-dvh items-center justify-center" style={{ backgroundColor: 'var(--bg-root)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>加载中...</p>
      </div>
    }>
      <CareerPageInner />
    </Suspense>
  );
}
