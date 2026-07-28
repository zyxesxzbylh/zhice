"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

/* ── 类型定义 ── */

interface NavChild {
  id: string;
  label: string;
  href: string; // 含 query 参数的目标 URL
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  children?: NavChild[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

/* ── 导航数据结构 ── */

const navGroups: NavGroup[] = [
  {
    title: "",
    items: [
      { id: "dashboard", label: "工作台", href: "/dashboard", icon: "home" },
    ],
  },
  {
    title: "功能模块",
    items: [
      {
        id: "tasks",
        label: "任务管理",
        href: "/tasks",
        icon: "tasks",
        children: [
          { id: "tasks-all", label: "全部任务", href: "/tasks" },
          { id: "tasks-projects", label: "项目列表", href: "/projects" },
          { id: "tasks-project-new", label: "新建项目", href: "/projects/new" },
          { id: "tasks-template-new", label: "新建模板", href: "/templates/new" },
        ],
      },
      {
        id: "knowledge",
        label: "知识库",
        href: "/knowledge",
        icon: "book",
      },
      {
        id: "career",
        label: "职业成长",
        href: "/career",
        icon: "growth",
      },
    ],
  },
  {
    title: "系统",
    items: [
      { id: "settings", label: "设置", href: "/settings", icon: "settings" },
    ],
  },
];

/* ── 图标 SVG 路径 ── */

const iconPaths: Record<string, string> = {
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  projects: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  tasks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  growth: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  book: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
};

/* ── 工具函数 ── */

/** 判断 href（可能含 ?query）是否匹配当前 pathname + search */
function isHrefActive(href: string, pathname: string, search: string): boolean {
  const [hrefPath, hrefQuery] = href.split("?");
  // pathname 精确匹配
  if (hrefPath !== pathname) return false;
  // 如果 href 有 query 参数，需要 search 也匹配
  if (hrefQuery) {
    const currentParams = new URLSearchParams(search);
    const targetParams = new URLSearchParams(hrefQuery);
    for (const [key, value] of targetParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
  }
  return true;
}

/** 判断 item 的路径前缀是否匹配（用于展开项高亮，如 /projects/new 匹配 projects 项） */
function isPathPrefixActive(basePath: string, pathname: string): boolean {
  // 精确匹配或子路径匹配（如 /projects 匹配 /projects/new, /projects/123）
  if (pathname === basePath) return true;
  if (pathname.startsWith(basePath + "/")) return true;
  return false;
}

/* ── 版本号 ── */

const APP_VERSION = "0.5.0";

/* ── Props ── */

interface SidebarNavProps {
  className?: string;
}

/* ── 内部组件（使用 useSearchParams） ── */

function SidebarNavInner({ className }: SidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [mounted, setMounted] = useState(false);
  const [dateStr, setDateStr] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  // 展开状态：记录每个父级 item.id 是否展开
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDateStr(new Date().toLocaleDateString("zh-CN"));
    const checkWidth = () => setCollapsed(window.innerWidth < 1280);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // 自动展开包含当前活跃子项的父级
  useEffect(() => {
    if (collapsed) return;
    const next: Record<string, boolean> = {};
    for (const group of navGroups) {
      for (const item of group.items) {
        if (item.children) {
          const hasActiveChild = item.children.some((c) =>
            isHrefActive(c.href, pathname, search)
          );
          next[item.id] = hasActiveChild;
        }
      }
    }
    setExpanded((prev) => {
      const merged = { ...prev };
      for (const key of Object.keys(next)) {
        if (next[key]) merged[key] = true;
      }
      return merged;
    });
  }, [pathname, search, collapsed]);

  function toggleExpanded(itemId: string) {
    setExpanded((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  }

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } ${className || ""}`}
      style={{
        backgroundColor: "var(--bg-surface)",
        borderRight: "1px solid var(--border-default)",
      }}
    >
      <div className={collapsed ? "p-3" : "p-6"}>
        {/* Brand */}
        <div
          className={`flex items-center justify-between mb-8 animate-fade-in ${
            collapsed ? "flex-col gap-2" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:scale-105 transition-transform duration-200 shrink-0"
              style={{ backgroundColor: "var(--brand-bg)" }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--brand-text)" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                执策
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-[var(--bg-muted)] transition-colors"
              title={collapsed ? "展开侧边栏" : "折叠侧边栏"}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: "var(--text-muted)" }}
              >
                {collapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                )}
              </svg>
            </button>
            {!collapsed && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  color: "var(--text-muted)",
                  backgroundColor: "var(--bg-muted)",
                  borderColor: "var(--border-subtle)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }}
              >
                v{APP_VERSION}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          {navGroups.map((group, groupIndex) => (
            <div
              key={group.title}
              className="animate-slide-in-left"
              style={{ animationDelay: `${groupIndex * 50}ms` }}
            >
              {/* 分组标题 */}
              {!collapsed && group.title && (
                <div className="pt-4 pb-2 px-4">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {group.title}
                  </p>
                </div>
              )}
              {collapsed && group.title && groupIndex > 0 && <div className="pt-2" />}

              {group.items.map((item, itemIndex) => {
                const hasChildren = !!item.children?.length;
                const isExpanded = expanded[item.id] ?? false;

                // 当前项是否活跃
                const selfActive = isHrefActive(item.href, pathname, search);
                // 子项是否活跃
                const childActive = hasChildren
                  ? item.children!.some((c) => isHrefActive(c.href, pathname, search))
                  : false;
                // 路径前缀活跃（如 /projects/new 匹配 projects）
                const prefixActive =
                  !selfActive && !childActive ? isPathPrefixActive(item.href, pathname) : false;

                const itemActive = selfActive || childActive || prefixActive;

                return (
                  <div key={item.id} className="animate-fade-in"
                    style={{ animationDelay: `${groupIndex * 50 + itemIndex * 30}ms` }}>
                    {/* 父级导航行 */}
                    <div
                      className={`group flex items-center rounded-lg transition-all duration-150 ${
                        collapsed ? "justify-center px-2" : "px-4"
                      } ${!itemActive ? "hover:bg-[var(--bg-surface-hover)]" : ""}`}
                      style={
                        itemActive
                          ? { backgroundColor: "var(--accent-muted)", color: "var(--text-primary)" }
                          : { color: "var(--text-secondary)" }
                      }
                      data-tour={`nav-${item.id}`}
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 py-2.5 flex-1 min-w-0 text-sm font-medium ${
                          itemActive ? "border-l-2 -ml-4 pl-4" : "border-l-2 border-transparent"
                        }`}
                        style={itemActive ? { borderColor: "var(--accent)" } : undefined}
                        title={collapsed ? item.label : undefined}
                      >
                        <svg
                          width="18" height="18" fill="none" viewBox="0 0 24 24"
                          stroke="currentColor"
                          className="shrink-0"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[item.icon]} />
                        </svg>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                      {/* 展开/折叠按钮（仅当有子项且未折叠时显示） */}
                      {hasChildren && !collapsed && (
                        <button
                          onClick={(e) => { e.preventDefault(); toggleExpanded(item.id); }}
                          className="p-1 rounded hover:bg-[var(--bg-muted-hover)] transition-colors shrink-0"
                        >
                          <svg
                            width="12" height="12" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor"
                            className={`transition-transform duration-200 ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                            style={{ color: "var(--text-muted)" }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* 子导航项 — 使用 max-height + opacity 实现平滑展开/折叠 */}
                    {hasChildren && !collapsed && (
                      <div
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{
                          maxHeight: isExpanded ? "320px" : "0",
                          opacity: isExpanded ? 1 : 0,
                          marginTop: isExpanded ? "2px" : "0",
                          marginBottom: isExpanded ? "2px" : "0",
                        }}
                      >
                        <div
                          className="ml-8 space-y-0.5 border-l pl-3"
                          style={{ borderColor: "var(--border-subtle)" }}
                        >
                        {item.children!.map((child) => {
                          const childActive = isHrefActive(child.href, pathname, search);
                          return (
                            <Link
                              key={child.id}
                              href={child.href}
                              className={`block py-1.5 px-3 text-xs rounded-md transition-colors ${
                                childActive ? "font-medium" : ""
                              }`}
                              style={
                                childActive
                                  ? { color: "var(--text-primary)", backgroundColor: "var(--accent-muted)" }
                                  : { color: "var(--text-secondary)" }
                              }
                            >
                              {child.label}
                            </Link>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom utility bar */}
      <div
        className={`mt-auto ${collapsed ? "p-2" : "p-4"}`}
        style={{
          borderTop: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-muted)",
        }}
      >
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between mb-3"}`}>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {!collapsed && <span>搜索</span>}
          </button>
          <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
          <NotificationBell />
        </div>
        {!collapsed && (
          <div
            className="flex items-center justify-between text-[11px]"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: "var(--text-muted)" }}
              >
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {mounted ? dateStr : ""}
            </span>
            <span className="font-mono">v{APP_VERSION}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ── 导出组件（Suspense 包裹以兼容 useSearchParams） ── */

export default function SidebarNav(props: SidebarNavProps) {
  return (
    <Suspense fallback={null}>
      <SidebarNavInner {...props} />
    </Suspense>
  );
}
