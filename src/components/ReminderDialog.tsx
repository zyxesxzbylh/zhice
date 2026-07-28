"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm
  minutesAfterEnabled: boolean;
  minutesAfterStart: number; // 任务开始后 N 分钟提醒
  weekdays: number[]; // 0=Sun..6=Sat
}

interface Props {
  taskId: string;
  taskTitle: string;
  initialSettings?: Partial<ReminderSettings>;
  onSave?: (settings: ReminderSettings) => void;
  onClose: () => void;
}

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  time: "09:00",
  minutesAfterEnabled: false,
  minutesAfterStart: 30,
  weekdays: [1, 2, 3, 4, 5],
};

export const ReminderDialog = memo(function ReminderDialog({
  taskId,
  taskTitle,
  initialSettings,
  onSave,
  onClose,
}: Props) {
  const [settings, setSettings] = useState<ReminderSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ReminderSettings>(
    key: K,
    value: ReminderSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWeekday = (day: number) => {
    setSettings((prev) => {
      const weekdays = prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day].sort();
      return { ...prev, weekdays };
    });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/reminder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("保存失败");
      onSave?.(settings);
      onClose();
    } catch {
      // 静默处理
    } finally {
      setSaving(false);
    }
  }, [taskId, settings, onSave, onClose]);

  return (
    <div className="p-5 space-y-5">
      {/* 任务标题 */}
      <div className="flex items-center gap-2">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{taskTitle}</p>
      </div>

      {/* 启用开关 */}
      <label className="flex items-center justify-between cursor-pointer">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>启用提醒</span>
        <button
          onClick={() => update("enabled", !settings.enabled)}
          className={cn(
            "relative w-9 h-5 rounded-full transition-colors",
          )}
          style={{
            backgroundColor: settings.enabled ? 'var(--color-success)' : 'var(--bg-muted-hover)',
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            style={{
              transform: settings.enabled ? "translateX(16px)" : "translateX(0)",
            }}
          />
        </button>
      </label>

      {settings.enabled && (
        <>
          {/* 时间 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>提醒时间</label>
            <input
              type="time"
              value={settings.time}
              onChange={(e) => update("time", e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-colors"
              style={{
                borderColor: 'var(--border-strong)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* 工作日 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>重复</label>
            <div className="flex gap-1">
              {WEEKDAYS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleWeekday(i)}
                  className="w-8 h-8 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: settings.weekdays.includes(i) ? 'var(--accent)' : 'var(--bg-muted)',
                    color: settings.weekdays.includes(i) ? 'var(--text-inverse)' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 开始后 N 分钟提醒 */}
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>开始后提醒</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={settings.minutesAfterStart}
                onChange={(e) => update("minutesAfterStart", Number(e.target.value))}
                disabled={!settings.minutesAfterEnabled}
                className="w-14 rounded px-2 py-1 text-xs border text-center outline-none disabled:opacity-30"
                style={{
                  borderColor: 'var(--border-strong)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>分钟</span>
              <button
                onClick={() => update("minutesAfterEnabled", !settings.minutesAfterEnabled)}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors",
                )}
                style={{
                  backgroundColor: settings.minutesAfterEnabled ? 'var(--color-success)' : 'var(--bg-muted-hover)',
                }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{
                    transform: settings.minutesAfterEnabled ? "translateX(16px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
          </label>
        </>
      )}

      {/* 按钮 */}
      <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm border transition-colors"
          style={{
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
});
