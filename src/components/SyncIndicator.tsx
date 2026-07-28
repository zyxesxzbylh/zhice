"use client";

import { useState, useEffect, memo } from "react";

interface SyncState {
  syncing: boolean;
  lastSync: number | null;
  pendingCount: number;
  error?: string;
}

export default function SyncIndicator({ className }: { className?: string }) {
  const [state, setState] = useState<SyncState>({
    syncing: false,
    lastSync: null,
    pendingCount: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem("flowsync_sync_state");
    if (stored) {
      try { setState(JSON.parse(stored)); } catch {}
    }
  }, []);

  const { syncing, lastSync, pendingCount, error } = state;

  const lastSyncText = lastSync
    ? new Date(lastSync).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    : "从未同步";

  return (
    <div className={`flex items-center gap-2 text-xs ${className || ""}`}>
      {syncing ? (
        <>
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--color-info)' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>同步中...</span>
        </>
      ) : error ? (
        <>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-danger)' }} />
          <span style={{ color: 'var(--color-danger)' }}>{error}</span>
        </>
      ) : (
        <>
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: pendingCount > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}
          />
          <span style={{ color: 'var(--text-muted)' }}>
            {pendingCount > 0 ? `${pendingCount} 项待同步` : `已同步 · ${lastSyncText}`}
          </span>
        </>
      )}
    </div>
  );
}
