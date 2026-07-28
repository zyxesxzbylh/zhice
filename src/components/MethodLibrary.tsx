"use client";

import { useEffect, useMemo, useState } from "react";
import { METHOD_LIBRARY, type WorkMethod } from "@/lib/methods/library";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";

/* ------------------------------------------------------------------ */
/*  Icon helpers (inline SVGs matching lucide names)                  */
/* ------------------------------------------------------------------ */

const ICONS: Record<string, React.ReactNode> = {
  BarChart3: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  Triangle: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 18H3L12 3z" />
    </svg>
  ),
  GitBranch: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0a3 3 0 11-6 0 3 3 0 016 0zm0 0a3 3 0 116 0 3 3 0 01-6 0zM6 21a3 3 0 116 0 3 3 0 01-6 0z" />
    </svg>
  ),
  Clock: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ListChecks: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  RefreshCw: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  FileText: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  Timer: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  LayoutGrid: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  Table: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25-4.5h17.25m-17.25-4.5h17.25M3.375 6h17.25M3.375 6v13.5m17.25-13.5v13.5" />
    </svg>
  ),
  Repeat: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
    </svg>
  ),
  Sunset: (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
};

const CATEGORY_ORDER: WorkMethod["category"][] = ["思维模型", "操作流程", "工具应用", "复盘迭代"];

const CATEGORY_COLORS: Record<WorkMethod["category"], { className: string; style: React.CSSProperties }> = {
  "思维模型": { className: "", style: { backgroundColor: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' } },
  "操作流程": { className: "", style: { backgroundColor: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' } },
  "工具应用": { className: "", style: { backgroundColor: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' } },
  "复盘迭代": { className: "", style: { backgroundColor: '#fffbeb', color: '#b45309', borderColor: '#fde68a' } },
};

const DIFFICULTY_TONE: Record<WorkMethod["difficulty"], "success" | "warning" | "danger"> = {
  "入门": "success",
  "进阶": "warning",
  "高级": "danger",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function MethodIcon({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
      {ICONS[name] ?? (
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </div>
  );
}

function FavoriteButton({
  methodId,
  favorites,
  onToggle,
}: {
  methodId: string;
  favorites: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isFav = favorites.has(methodId);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(methodId);
      }}
      className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-muted)]"
      aria-label={isFav ? "取消收藏" : "收藏"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={isFav ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        style={{ color: isFav ? 'var(--color-warning)' : 'var(--text-muted)' }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function MethodLibrary() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WorkMethod | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<WorkMethod["category"] | "全部">("全部");

  /* 从 localStorage 读取收藏 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("flowsync:method-favorites");
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        setFavorites(new Set(arr));
      }
    } catch {
      // ignore
    }
  }, []);

  /* 保存收藏到 localStorage */
  useEffect(() => {
    localStorage.setItem("flowsync:method-favorites", JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let list = METHOD_LIBRARY;
    if (activeCategory !== "全部") {
      list = list.filter((m) => m.category === activeCategory);
    }
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.applicableScenarios.some((s) => s.toLowerCase().includes(q)) ||
        m.description.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<WorkMethod["category"], WorkMethod[]>();
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter((m) => m.category === cat);
      if (items.length > 0) {
        map.set(cat, items);
      }
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* 搜索栏 */}
      <div className="relative max-w-md">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
          width="16"
          height="16"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-200"
          style={{
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
          placeholder="搜索方法名称、适用场景..."
        />
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategory("全部")}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: activeCategory === "全部" ? 'var(--accent)' : 'var(--bg-surface)',
            color: activeCategory === "全部" ? 'var(--text-inverse)' : 'var(--text-secondary)',
            borderColor: activeCategory === "全部" ? 'transparent' : 'var(--border-default)',
            borderWidth: activeCategory === "全部" ? '0' : '1px',
            borderStyle: 'solid',
          }}
        >
          全部
        </button>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === cat ? 'var(--accent)' : 'var(--bg-surface)',
              color: activeCategory === cat ? 'var(--text-inverse)' : 'var(--text-secondary)',
              borderColor: activeCategory === cat ? 'transparent' : 'var(--border-default)',
              borderWidth: activeCategory === cat ? '0' : '1px',
              borderStyle: 'solid',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 统计 */}
      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        <span>共 {METHOD_LIBRARY.length} 种工作方法</span>
        {favorites.size > 0 && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: '#d97706' }}>已收藏 {favorites.size} 个</span>
          </>
        )}
      </div>

      {/* 按分类分组的网格卡片 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <p>未找到匹配的工作方法</p>
          <p className="text-xs mt-1">尝试更换关键词搜索</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([category, methods]) => (
            <section key={category}>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border" style={CATEGORY_COLORS[category].style}>
                  {category}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{methods.length} 个方法</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {methods.map((method) => (
                  <Card
                    key={method.id}
                    interactive
                    className="group relative"
                    onClick={() => setSelected(method)}
                  >
                    <Card.Body className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <MethodIcon name={method.icon} />
                        <FavoriteButton
                          methodId={method.id}
                          favorites={favorites}
                          onToggle={toggleFavorite}
                        />
                      </div>

                      <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{method.name}</h3>
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{method.description}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={DIFFICULTY_TONE[method.difficulty]} variant="soft">
                          {method.difficulty}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {method.applicableScenarios.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="inline-block px-2 py-0.5 rounded-md text-xs border"
                            style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
                          >
                            {s}
                          </span>
                        ))}
                        {method.applicableScenarios.length > 2 && (
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs border" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}>
                            +{method.applicableScenarios.length - 2}
                          </span>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      {selected && (
        <MethodDetailModal
          method={selected}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          isFavorite={favorites.has(selected.id)}
          onToggleFavorite={() => toggleFavorite(selected.id)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail modal                                                      */
/* ------------------------------------------------------------------ */

function MethodDetailModal({
  method,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
}: {
  method: WorkMethod;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <MethodIcon name={method.icon} />
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{method.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge tone={DIFFICULTY_TONE[method.difficulty]} variant="soft">
                {method.difficulty}
              </Badge>
              <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium border" style={CATEGORY_COLORS[method.category].style}>
                {method.category}
              </span>
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            onClick={onToggleFavorite}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: isFavorite ? '#fffbeb' : 'var(--bg-muted)',
              color: isFavorite ? '#b45309' : 'var(--text-secondary)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
            {isFavorite ? "已收藏" : "收藏方法"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--text-inverse)',
            }}
          >
            关闭
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* 描述 */}
        <div>
          <h4 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>方法简介</h4>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{method.description}</p>
        </div>

        {/* 步骤 */}
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>操作步骤</h4>
          <ol className="space-y-2">
            {method.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-secondary)' }}>
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 适用场景 */}
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>适用场景</h4>
          <div className="flex flex-wrap gap-2">
            {method.applicableScenarios.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-lg text-xs border"
                style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* 关联SOP */}
        <div>
          <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>关联 SOP</h4>
          <div className="flex flex-wrap gap-2">
            {method.relatedSOPs.map((sop) => (
              <span
                key={sop}
                className="px-2.5 py-1 rounded-lg text-xs border"
                style={{ backgroundColor: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe' }}
              >
                {sop}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
