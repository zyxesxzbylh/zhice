"use client";

import { useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";

/* ─── 类型 ─── */

interface Tag {
  id: string;
  name: string;
  color: string; // hex
}

interface Props {
  tags: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  className?: string;
  compact?: boolean;
}

/* ─── 预设颜色 ─── */

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899",
];

/* ─── 组件 ─── */

export const TagManager = memo(function TagManager({
  tags,
  onTagsChange,
  className,
  compact = false,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState("");

  const addTag = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const exists = tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    const tag: Tag = {
      id: `tag_${Date.now()}`,
      name: trimmed,
      color: newColor,
    };
    onTagsChange?.([...tags, tag]);
    setNewName("");
  }, [newName, newColor, tags, onTagsChange]);

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
    setEditingColor(tag.color);
  };

  const saveEdit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) { cancelEdit(); return; }
    onTagsChange?.(
      tags.map((t) =>
        t.id === editingId ? { ...t, name: trimmed, color: editingColor } : t
      )
    );
    cancelEdit();
  }, [editingId, editingName, editingColor, tags, onTagsChange]);

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingColor("");
  };

  const removeTag = useCallback(
    (id: string) => {
      if (!window.confirm("确定要删除这个标签吗？关联任务上的标签不会消失，但将无法再分配此标签。")) return;
      onTagsChange?.(tags.filter((t) => t.id !== id));
    },
    [tags, onTagsChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTag();
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* 添加新标签 */}
      {!compact && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="新标签名称..."
            maxLength={12}
            className="flex-1 px-2.5 py-1.5 text-sm rounded-lg outline-none transition-colors"
            style={{
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          />
          <div className="relative flex items-center">
            <button
              onClick={() => {
                const curr = PRESET_COLORS.indexOf(newColor);
                const next = (curr + 1) % PRESET_COLORS.length;
                setNewColor(PRESET_COLORS[next]);
              }}
              className="w-8 h-8 rounded-lg border-2 shrink-0 transition-transform hover:scale-110"
              style={{ backgroundColor: newColor, borderColor: newColor }}
              title="点击切换颜色"
            />
          </div>
          <button
            onClick={addTag}
            disabled={!newName.trim()}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-40 shrink-0"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            添加
          </button>
        </div>
      )}

      {/* 颜色选择器行 — 紧凑模式 */}
      {compact && (
        <div className="flex items-center gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-125"
              style={{
                backgroundColor: c,
                borderColor: newColor === c ? 'var(--text-primary)' : 'transparent',
              }}
              title={c}
            />
          ))}
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入标签名..."
            className="flex-1 ml-1 px-2 py-1 text-xs rounded border outline-none"
            style={{
              borderColor: 'var(--border-strong)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            onClick={addTag}
            disabled={!newName.trim()}
            className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-40"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            +
          </button>
        </div>
      )}

      {/* 颜色快捷选项 */}
      {!compact && (
        <div className="flex gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setNewColor(c)}
              className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-125"
              style={{
                backgroundColor: c,
                borderColor: newColor === c ? 'var(--text-primary)' : 'transparent',
              }}
            />
          ))}
        </div>
      )}

      {/* 标签列表 */}
      <div className={cn("flex flex-wrap gap-2", compact && "mt-2")}>
        {tags.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--text-muted)' }}>暂无标签</p>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium group transition-colors"
              style={{ backgroundColor: `${tag.color}18`, color: tag.color }}
            >
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="w-16 bg-transparent border-none outline-none text-xs"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="text-[10px] opacity-60 hover:opacity-100">✓</button>
                  <button onClick={cancelEdit} className="text-[10px] opacity-60 hover:opacity-100">✕</button>
                </>
              ) : (
                <>
                  <span onDoubleClick={() => startEdit(tag)} className="cursor-default">
                    {tag.name}
                  </span>
                  <button
                    onClick={() => startEdit(tag)}
                    className="opacity-0 group-hover:opacity-50 transition-opacity"
                  >
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="opacity-0 group-hover:opacity-50 transition-opacity"
                  >
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});
