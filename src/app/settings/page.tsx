"use client";

import { Suspense, useState } from "react";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import ThemeSettings from "@/components/settings/ThemeSettings";
import { cn } from "@/lib/utils";
import { useGuidedTour, type TourStep } from "@/components/GuidedTour";

/* ── 引导步骤定义 ── */

const ALL_TOUR_STEPS: TourStep[] = [
  // 侧边栏导航
  { id: 1, title: "侧边导航栏", description: "通过左侧导航栏可以在工作台、任务管理、知识库、职业成长等功能模块之间快速切换。点击「任务管理」旁边的箭头可以展开子菜单。", selector: '[data-tour="nav-tasks"]', page: "/tasks", placement: "right", icon: "🧭" },
  // 工作台
  { id: 2, title: "工作台概览", description: "工作台是你的管理中心，这里展示项目统计、任务进度、风险预警等关键信息。顶部可以快速查看待办数量。", selector: '[data-tour="page-dashboard"]', page: "/dashboard", placement: "bottom", icon: "🏠" },
  { id: 3, title: "项目进度统计", description: "以卡片形式展示各项目进度。点击项目可进入详情页，查看任务列表和甘特图。", selector: '[data-tour="dashboard-projects"]', page: "/dashboard", placement: "top", icon: "📊" },
  { id: 4, title: "避坑预警", description: "系统会自动检测超期任务、阻塞任务等风险，在这里集中展示并提供处理建议。点击条目可快速跳转到对应任务。", selector: '[data-tour="dashboard-warnings"]', page: "/dashboard", placement: "top", icon: "⚠️" },
  { id: 5, title: "生成本周报告", description: "点击此按钮可一键生成本周工作报告，汇总本周完成的任务、进行中的工作和遇到的问题。", selector: '[data-tour="dashboard-report-btn"]', page: "/dashboard", placement: "bottom", icon: "📈" },

  // 任务管理
  { id: 6, title: "任务列表视图", description: "默认以列表形式展示所有任务，支持按优先级、截止日期排序。每张任务卡片显示标题、状态、优先级和关联项目。", selector: '[data-tour="tasks-list"]', page: "/tasks", placement: "bottom", icon: "✅" },
  { id: 7, title: "多视图切换", description: "除了列表视图，还支持看板视图（按状态分列）和甘特图视图（时间线展示）。点击这里的标签可在视图间切换。", selector: '[data-tour="tasks-view-switcher"]', page: "/tasks", placement: "bottom", icon: "🔄" },
  { id: 8, title: "创建任务", description: "点击此处可以快速创建新任务。填写任务名称、选择所属项目、设置优先级和截止日期后即可添加。", selector: '[data-tour="tasks-create-btn"]', page: "/tasks", placement: "left", icon: "➕" },

  // 知识库
  { id: 9, title: "知识库搜索", description: "在搜索框中输入关键词，可以搜索所有知识条目，包括SOP文档、工作方法、洞察笔记和飞书文档。", selector: '[data-tour="knowledge-search"]', page: "/knowledge", placement: "bottom", icon: "🔍" },
  { id: 10, title: "知识库筛选", description: "通过分类标签可以快速筛选知识条目。支持按类型（SOP/方法/洞察/参考/复盘）或按标签过滤。", selector: '[data-tour="knowledge-filters"]', page: "/knowledge", placement: "bottom", icon: "🏷️" },
  { id: 11, title: "上传文件", description: "支持上传 PDF、Word、Excel 等文件到知识库。上传后会自动提取文本内容，方便搜索和关联。", selector: '[data-tour="knowledge-upload"]', page: "/knowledge", placement: "bottom", icon: "📎" },
  { id: 12, title: "飞书文档管理", description: "在这里可以创建飞书文档、表格和智能表格。也支持粘贴外部飞书链接导入保存。所有文件可在知识库中搜索和关联。", selector: '[data-tour="knowledge-feishu"]', page: "/knowledge", placement: "top", icon: "📄" },

  // 职业成长
  { id: 13, title: "每日复盘", description: "回顾每天的工作，记录完成的任务、遇到的问题和经验教训。持续的复盘有助于职业成长和技能提升。", selector: '[data-tour="career-retro"]', page: "/career", placement: "bottom", icon: "📝" },

  // 设置
  { id: 14, title: "主题定制", description: "17套预设主题可供选择，也可以自定义配色。所有的颜色调整会实时预览，满意后保存即可。", selector: '[data-tour="settings-theme"]', placement: "center", icon: "🎨" },
  { id: 15, title: "引导完成", description: "恭喜！你已经了解了 FlowSync 的核心功能。随时可以在设置页面重新启动引导。祝你使用愉快！", selector: '[data-tour="settings-guide-card"]', placement: "center", icon: "🎉" },
];

const CATEGORY_STEPS: Record<string, { title: string; steps: TourStep[] }> = {
  core: {
    title: "核心功能",
    steps: ALL_TOUR_STEPS.filter((s) => [1, 2, 3, 4, 5, 6, 7, 8].includes(s.id)),
  },
  knowledge: {
    title: "知识库",
    steps: ALL_TOUR_STEPS.filter((s) => [9, 10, 11, 12].includes(s.id)),
  },
  growth: {
    title: "职业成长",
    steps: ALL_TOUR_STEPS.filter((s) => [13].includes(s.id)),
  },
  personal: {
    title: "个性化",
    steps: ALL_TOUR_STEPS.filter((s) => [14, 15].includes(s.id)),
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  core: "核心功能",
  growth: "职业成长",
  knowledge: "知识库",
  personal: "个性化",
};

const CATEGORY_COLORS: Record<string, string> = {
  core: "var(--accent)",
  growth: "var(--color-success)",
  knowledge: "var(--color-info)",
  personal: "var(--color-warning)",
};

export default function SettingsPage() {
  const { startTour } = useGuidedTour();

  const handleStartTour = (category?: string) => {
    const steps = category ? CATEGORY_STEPS[category].steps : ALL_TOUR_STEPS;
    startTour(steps);
  };

  return (
    <Suspense fallback={null}>
      <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "var(--bg-root)", color: "var(--text-primary)" }}>
        <SidebarNav />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header
            className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0 border-b"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-default)",
            }}
          >
            <h1
              className="text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              设置
            </h1>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* 功能引导 */}
              <div
                className="rounded-xl border p-6"
                data-tour="settings-guide-card"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2
                      className="text-lg font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      功能引导
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      交互式引导将高亮界面元素，带你逐项了解功能
                    </p>
                  </div>
                </div>

                {/* 完整引导按钮 —— 突出显示 */}
                <button
                  onClick={() => handleStartTour()}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] mb-5 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                    boxShadow: "0 2px 12px rgba(59, 130, 246, 0.25)",
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  开始完整引导 ({ALL_TOUR_STEPS.length} 步)
                </button>

                {/* 分类快速引导 */}
                <p className="text-xs font-medium mb-3" style={{ color: "var(--text-secondary)" }}>
                  或者选择特定模块开始引导：
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CATEGORY_STEPS).map(([key, { title, steps }]) => (
                    <button
                      key={key}
                      onClick={() => handleStartTour(key)}
                      className="flex items-center justify-between p-3 rounded-lg text-left transition-colors hover:brightness-95"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[key]}12`,
                        border: `1px solid ${CATEGORY_COLORS[key]}30`,
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {steps.length} 个引导步骤
                        </p>
                      </div>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: CATEGORY_COLORS[key] }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* 提示 */}
                <div
                  className="mt-4 p-3 rounded-lg flex items-start gap-2"
                  style={{
                    backgroundColor: "var(--bg-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span className="text-sm flex-shrink-0 mt-px">💡</span>
                  <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    <p className="font-medium mb-0.5">操作提示</p>
                    <ul className="space-y-0.5" style={{ color: "var(--text-muted)" }}>
                      <li>按 <kbd className="px-1 py-px rounded text-[10px]" style={{ backgroundColor: "var(--bg-root)", border: "1px solid var(--border-default)" }}>Esc</kbd> 可随时退出引导</li>
                      <li>按 <kbd className="px-1 py-px rounded text-[10px]" style={{ backgroundColor: "var(--bg-root)", border: "1px solid var(--border-default)" }}>→</kbd> / <kbd className="px-1 py-px rounded text-[10px]" style={{ backgroundColor: "var(--bg-root)", border: "1px solid var(--border-default)" }}>←</kbd> 键前进/后退</li>
                      <li>引导会在不同页面间自动跳转，高亮对应功能区域</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 主题定制 */}
              <div data-tour="settings-theme">
                <ThemeSettings />
              </div>

              {/* 关于 */}
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
                  关于
                </h2>
                <div className="space-y-2 text-sm">
                  <p style={{ color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>版本：</span>
                    1.0.0
                  </p>
                  <p style={{ color: "var(--text-primary)" }}>
                    <span style={{ color: "var(--text-muted)" }}>产品名称：</span>
                    FlowSync
                  </p>
                  <p
                    className="mt-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    FlowSync 是一款集任务管理、知识库、职业成长和AI连接层于一体的个人工作与成长管理软件，帮助您更好地组织工作流程、沉淀知识、追踪职业成长。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <MobileNav activeItem="settings" />
        </main>
      </div>
    </Suspense>
  );
}
