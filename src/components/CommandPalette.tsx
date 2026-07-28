"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/* ── 类型 ── */

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string[];
  section: "navigate" | "action" | "task" | "view";
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/* ── 常量 ── */

const PLACEHOLDER = "输入指令...";

/* ── 主组件 ── */

export const CommandPalette = memo(function CommandPalette({
  isOpen,
  onClose,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  /* 定义所有指令 */
  const allCommands: CommandItem[] = [
    /* 导航 */
    {
      id: "nav-hub",
      label: "回到工作台",
      shortcut: ["G", "H"],
      section: "navigate",
      action: () => router.push("/"),
    },
    {
      id: "nav-projects",
      label: "查看项目列表",
      shortcut: ["G", "P"],
      section: "navigate",
      action: () => router.push("/projects"),
    },
    {
      id: "nav-board",
      label: "查看看板",
      shortcut: ["G", "B"],
      section: "navigate",
      action: () => router.push("/board"),
    },
    {
      id: "nav-calendar",
      label: "查看日历",
      shortcut: ["G", "C"],
      section: "navigate",
      action: () => router.push("/calendar"),
    },
    {
      id: "nav-settings",
      label: "打开设置",
      shortcut: ["G", "S"],
      section: "navigate",
      action: () => router.push("/settings"),
    },
    /* 操作 */
    {
      id: "act-new-project",
      label: "新建项目",
      shortcut: ["Ctrl", "Shift", "P"],
      section: "action",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:quick-create-project"));
      },
    },
    {
      id: "act-new-task",
      label: "快速创建任务",
      shortcut: ["Ctrl", "N"],
      section: "action",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:quick-create-task"));
      },
    },
    {
      id: "act-retro",
      label: "写今日复盘",
      shortcut: ["Ctrl", "R"],
      section: "action",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:open-retrospective"));
      },
    },
    {
      id: "act-sync",
      label: "同步数据",
      shortcut: ["Ctrl", "S"],
      section: "action",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:trigger-sync"));
      },
    },
    /* 视图 */
    {
      id: "view-dark",
      label: "切换深色模式",
      shortcut: ["Ctrl", "D"],
      section: "view",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:toggle-theme"));
      },
    },
    {
      id: "view-fullscreen",
      label: "切换全屏",
      shortcut: ["F11"],
      section: "view",
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      },
    },
    {
      id: "view-sidebar",
      label: "切换侧栏",
      shortcut: ["Ctrl", "B"],
      section: "view",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:toggle-sidebar"));
      },
    },
    /* 任务 */
    {
      id: "task-split",
      label: "拆分当前任务",
      shortcut: ["Ctrl", "Shift", "T"],
      section: "task",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:split-task"));
      },
    },
    {
      id: "task-priority",
      label: "优先级评估",
      shortcut: ["Ctrl", "Shift", "R"],
      section: "task",
      action: () => {
        document.dispatchEvent(new CustomEvent("flowsync:priority-guide"));
      },
    },
  ];

  /* 过滤 */
  const filtered = query.trim()
    ? allCommands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  /* 按分组整理 */
  type GroupedMap = Map<string, CommandItem[]>;
  const grouped: GroupedMap = new Map();
  for (const cmd of filtered) {
    const list = grouped.get(cmd.section) ?? [];
    list.push(cmd);
    grouped.set(cmd.section, list);
  }

  const sectionLabels: Record<string, string> = {
    navigate: "导航",
    action: "操作",
    task: "任务",
    view: "视图",
  };

  const flatFiltered = filtered;

  /* 键盘事件处理 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatFiltered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        flatFiltered[selectedIndex]?.action();
        onClose();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatFiltered, selectedIndex, onClose]
  );

  /* 滚动到选中项 */
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  /* 打开时自动 focus 输入框 & 重置 */
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  /* 全局快捷键 Ctrl+K 由父组件处理，此处只负责展示 */

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center pt-[15vh] bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        {/* 搜索框 */}
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
            placeholder={PLACEHOLDER}
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--text-muted)]"
            style={{ color: 'var(--text-primary)' }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            ESC
          </kbd>
        </div>

        {/* 列表 */}
        <div ref={listRef} className="max-h-60 overflow-y-auto p-1" role="listbox">
          {flatFiltered.length === 0 && (
            <div className="px-3 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              没有匹配的指令
            </div>
          )}

          {Array.from(grouped.entries()).map(([section, cmds]) => (
            <div key={section}>
              <div className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {(sectionLabels as any)[section] ?? section}
              </div>
              {cmds.map((cmd) => {
                const globalIndex = flatFiltered.indexOf(cmd);
                const isSelected = globalIndex === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors group"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-muted)' : 'transparent',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {cmd.shortcut.map((key, i) => (
                          <kbd
                            key={i}
                            className="text-[10px] px-1 py-0.5 rounded font-mono"
                            style={{ backgroundColor: isSelected ? 'var(--bg-muted-hover)' : 'var(--bg-muted)', color: 'var(--text-muted)' }}
                          >
                            {key}
                          </kbd>
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="px-3 py-1.5 border-t text-[11px] flex items-center gap-3" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <span>↑↓ 导航</span>
          <span>↵ 选择</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  );
});

export default CommandPalette;
