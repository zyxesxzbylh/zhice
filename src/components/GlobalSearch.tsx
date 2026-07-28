"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ── 类型 ── */

interface SearchResult {
  id: string;
  title: string;
  type: "task" | "project" | "note" | "retro" | "label";
  subtitle?: string;
  path: string;
  status?: string;
  projectId?: string;
  projectName?: string;
  priority?: string;
  highlight?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/* ── 图标映射 ── */
const typeIcons: Record<string, string> = {
  task: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  project: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  note: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  retro: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 3 0 01-2-2z",
  label: "M7 7h.01M7 3h5c.512 0 1.023.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
};

const typeColors: Record<string, string> = {
  task: "#6366f1",
  project: "#0891b2",
  note: "#d97706",
  retro: "#059669",
  label: "#8b5cf6",
};

/* ── GlobalSearch 主组件 ── */

export const GlobalSearch = memo(function GlobalSearch({
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  /* 加载最近搜索 */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("flowsync_recent_searches");
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch {}
  }, []);

  /* 搜索 */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  /* 打开时 focus */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* 导航到结果 */
  const navigateTo = useCallback(
    (result: SearchResult) => {
      if (result.path) {
        router.push(result.path);
      }
      /* 保存到最近搜索 */
      const q = query.trim();
      if (q) {
        const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem("flowsync_recent_searches", JSON.stringify(updated));
      }
      onClose();
    },
    [query, recentSearches, router, onClose]
  );

  /* 键盘 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const total = query.trim() ? results.length : recentSearches.length;
          return Math.min(prev + 1, total - 1);
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim() && results[selectedIndex]) {
          navigateTo(results[selectedIndex]);
        } else if (!query.trim() && recentSearches[selectedIndex]) {
          setQuery(recentSearches[selectedIndex]);
          setSelectedIndex(0);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [query, results, recentSearches, selectedIndex, navigateTo, onClose]
  );

  /* 清除最近搜索 */
  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("flowsync_recent_searches");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[12vh] bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        {/* 搜索输入框 */}
        <div className="flex items-center gap-2 px-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索任务、项目、笔记..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)' }}
          />
          {loading && (
            <div className="w-4 h-4 animate-spin rounded-full border-2" style={{ borderColor: 'var(--bg-muted-hover)', borderTopColor: 'var(--accent)' }} />
          )}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>ESC</kbd>
        </div>

        {/* 结果区 */}
        <div className="max-h-72 overflow-y-auto">
          {/* 有搜索词 → 显示结果 */}
          {query.trim() ? (
            results.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {loading ? "搜索中..." : "没有找到结果"}
              </div>
            ) : (
              results.map((item, i) => (
                <SearchResultRow
                  key={item.id}
                  item={item}
                  isSelected={i === selectedIndex}
                  query={query}
                  onSelect={() => navigateTo(item)}
                  onHover={() => setSelectedIndex(i)}
                />
              ))
            )
          ) : (
            /* 无搜索词 → 最近搜索 */
            <div>
              {recentSearches.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>最近搜索</span>
                    <button onClick={clearRecent} className="text-[11px] transition-colors" style={{ color: 'var(--text-muted)' }}>
                      清除
                    </button>
                  </div>
                  {recentSearches.map((s, i) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors"
                      style={{
                        backgroundColor: i === selectedIndex ? 'var(--bg-muted)' : 'transparent',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {s}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* 底部快捷键 */}
        <div className="px-3 py-1.5 border-t text-[11px] flex items-center gap-3"
          style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <span>↑↓ 导航</span>
          <span>↵ 打开</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
});

/* 结果行 */
const SearchResultRow = memo(function SearchResultRow({
  item,
  isSelected,
  query,
  onSelect,
  onHover,
}: {
  item: SearchResult;
  isSelected: boolean;
  query: string;
  onSelect: () => void;
  onHover: () => void;
}) {
  const color = typeColors[item.type] || "var(--text-muted)";
  const icon = typeIcons[item.type] ?? typeIcons.task;

  /* 高亮匹配文字 */
  const highlightText = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded px-0.5" style={{ backgroundColor: 'var(--color-highlight-bg)', color: 'var(--text-primary)' }}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={onHover}
      className="w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors"
      style={{ backgroundColor: isSelected ? 'var(--bg-muted)' : 'transparent' }}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={color}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
          {highlightText(item.title)}
        </div>
        {item.subtitle && (
          <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {item.subtitle}
          </div>
        )}
      </div>
      <div className="text-[10px] px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: `${color}12`, color }}>
        {item.type}
      </div>
    </button>
  );
});

export default GlobalSearch;
