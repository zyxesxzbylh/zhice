"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
  color: string; // hex
}

interface Props {
  tags: Tag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export const TagFilter = memo(function TagFilter({
  tags,
  selectedTagIds,
  onTagToggle,
  onClearAll,
  className,
}: Props) {
  if (tags.length === 0) return null;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => onTagToggle(tag.id)}
            className="px-2 py-0.5 rounded-full text-xs font-medium transition-all border"
            style={{
              backgroundColor: isSelected ? `${tag.color}20` : 'transparent',
              borderColor: isSelected ? tag.color : 'var(--border-default)',
              color: isSelected ? tag.color : 'var(--text-muted)',
            }}
          >
            {tag.name}
          </button>
        );
      })}
      {selectedTagIds.length > 0 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-xs px-1.5 py-0.5 rounded transition-colors hover:bg-[var(--bg-muted)]"
          style={{ color: 'var(--text-muted)' }}
        >
          清除筛选
        </button>
      )}
    </div>
  );
});
