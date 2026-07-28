"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import SyncIndicator from "./SyncIndicator";

interface Notification {
  id: string;
  type: "sync" | "ai" | "task" | "reminder" | "update" | "system";
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  action?: string;
  meta?: any;
}

interface Props {
  className?: string;
}

const ICONS_BY_TYPE: Record<string, string> = {
  sync: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  ai: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  reminder: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  task: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  update: "M13 10V3L4 14h7v7l9-11h-7z",
  system: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
};

const TITLE_BY_TYPE: Record<string, string> = {
  sync: "同步",
  ai: "AI",
  task: "任务",
  reminder: "提醒",
  update: "更新",
  system: "系统",
};

export const NotificationBell = memo(function NotificationBell({ className }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [showSync, setShowSync] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* 模拟获取通知 */
  useEffect(() => {
    const stored = localStorage.getItem("flowsync_notifications");
    if (stored) {
      try { setNotifications(JSON.parse(stored)); } catch {}
    }
  }, []);

  const save = (items: Notification[]) => {
    setNotifications(items);
    localStorage.setItem("flowsync_notifications", JSON.stringify(items));
  };

  const markAllRead = useCallback(() => {
    save(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  const markRead = useCallback(
    (id: string) => {
      save(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [notifications]
  );

  const remove = useCallback(
    (id: string) => {
      save(notifications.filter((n) => n.id !== id));
    },
    [notifications]
  );

  /* 点击外部关闭 */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notification-panel]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
      >
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={ICONS_BY_TYPE.reminder} />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-danger)', color: 'var(--text-inverse)' }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          data-notification-panel
          className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-2xl border overflow-hidden z-50"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              通知 {unreadCount > 0 ? `(${unreadCount})` : ""}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSync(!showSync)} className="text-[11px] transition-colors"
                style={{ color: 'var(--text-muted)' }}>
                同步
              </button>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] transition-colors" style={{ color: 'var(--color-info)' }}>
                  全部已读
                </button>
              )}
            </div>
          </div>

          {/* 同步面板 */}
          {showSync && (
            <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <SyncIndicator />
            </div>
          )}

          {/* 列表 */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无通知
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notif={notif}
                  onMarkRead={markRead}
                  onRemove={remove}
                />
              ))
            )}
          </div>

          {/* 底部 */}
          <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <button onClick={() => save([])} className="text-[11px] transition-colors" style={{ color: 'var(--text-muted)' }}>
              清空所有通知
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

function NotificationItem({
  notif,
  onMarkRead,
  onRemove,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const icon = ICONS_BY_TYPE[notif.type] ?? ICONS_BY_TYPE.system;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 border-b transition-colors group"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: notif.read ? undefined : 'rgba(59, 130, 246, 0.04)',
      }}
      onClick={() => onMarkRead(notif.id)}
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--bg-muted)' }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-1 py-px rounded" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
            {TITLE_BY_TYPE[notif.type] ?? notif.type}
          </span>
          {!notif.read && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-info)' }} />
          )}
        </div>
        <p className="text-sm mt-0.5 font-medium truncate" style={{ color: 'var(--text-primary)' }}>{notif.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{notif.body}</p>
        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(notif.timestamp)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(notif.id); }}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN");
}

export default NotificationBell;
