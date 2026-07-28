"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface ShortcutGroup {
  group: string;
  items: { keys: string[]; description: string }[];
}

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  className?: string;
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    group: "通用",
    items: [
      { keys: ["Ctrl", "K"], description: "打开指令面板" },
      { keys: ["Ctrl", "F"], description: "全局搜索" },
      { keys: ["Ctrl", "N"], description: "快速创建任务" },
      { keys: ["Ctrl", "Shift", "P"], description: "新建项目" },
      { keys: ["Ctrl", "R"], description: "写今日复盘" },
      { keys: ["Ctrl", "S"], description: "同步数据" },
      { keys: ["Ctrl", "D"], description: "切换深色模式" },
      { keys: ["Ctrl", "B"], description: "切换侧栏" },
    ],
  },
  {
    group: "任务操作",
    items: [
      { keys: ["Ctrl", "Shift", "T"], description: "拆分当前任务" },
      { keys: ["Ctrl", "Shift", "R"], description: "优先级评估" },
      { keys: ["Enter"], description: "编辑当前任务" },
      { keys: ["Space"], description: "勾选/取消勾选" },
      { keys: ["Delete"], description: "删除选中的任务" },
    ],
  },
  {
    group: "导航",
    items: [
      { keys: ["G", "H"], description: "回到工作台" },
      { keys: ["G", "P"], description: "查看项目列表" },
      { keys: ["G", "B"], description: "查看看板" },
      { keys: ["G", "C"], description: "查看日历" },
      { keys: ["G", "S"], description: "打开设置" },
    ],
  },
];

export const KeyboardShortcutsHelp = memo(function KeyboardShortcutsHelp({
  open,
  onClose,
  className,
}: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-xl shadow-2xl border overflow-hidden",
          className
        )}
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>键盘快捷键</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md transition-colors hover:bg-[var(--bg-muted)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-3 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h3 className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                {group.group}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.keys.join("+") + item.description}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span style={{ color: 'var(--text-secondary)' }}>{item.description}</span>
                    <span className="flex items-center gap-1">
                      {item.keys.map((key, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
                            style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                            {key}
                          </kbd>
                          {ki < item.keys.length - 1 && (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+</span>
                          )}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="px-5 py-3 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
});

export default KeyboardShortcutsHelp;
