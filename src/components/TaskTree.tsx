"use client";

import { useState, useCallback, createContext, useContext, memo } from "react";
import { cn } from "@/lib/utils";

/* ─── 类型定义 ─── */

export interface TaskNode {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  children?: TaskNode[];
  projectId?: string;
  expanded?: boolean;
  tag?: string;
  notesCount?: number;
}

/* ─── Context：共享状态避免逐层传递 ─── */

interface TreeContextValue {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onCheck: (id: string) => void;
}

const TreeCtx = createContext<TreeContextValue>({
  selectedId: null,
  onSelect: () => {},
  onToggle: () => {},
  onCheck: () => {},
});

/* ─── Props ─── */

interface TaskTreeProps {
  nodes: TaskNode[];
  selectedId?: string | null;
  onNodeSelect?: (id: string) => void;
  onNodeCheck?: (id: string) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

/* ─── 优先级颜色映射 ─── */

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-info)",
  low: "var(--color-success)",
};

/* ─── TaskTree 根组件 ─── */

export const TaskTree = memo(function TaskTree({
  nodes,
  selectedId: extSelectedId,
  onNodeSelect,
  onNodeCheck,
  className,
  emptyMessage = "没有任务",
  loading = false,
}: TaskTreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 用 Map 存储展开状态，O(1) 读写
  const [expandedMap, setExpandedMap] = useState<Map<string, boolean>>(new Map());

  const _selectedId = extSelectedId !== undefined ? extSelectedId : selectedId;

  const onSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      onNodeSelect?.(id);
    },
    [onNodeSelect]
  );

  const onToggle = useCallback(
    (id: string) => {
      setExpandedMap((prev) => {
        const next = new Map(prev);
        next.set(id, !prev.get(id));
        return next;
      });
    },
    []
  );

  const onCheck = useCallback(
    (id: string) => {
      onNodeCheck?.(id);
    },
    [onNodeCheck]
  );

  const ctx: TreeContextValue = { selectedId: _selectedId, onSelect, onToggle, onCheck };

  // Loading
  if (loading) {
    return <TaskTreeLoading />;
  }

  // Empty
  if (nodes.length === 0) {
    return <TaskTreeEmpty message={emptyMessage} />;
  }

  return (
    <TreeCtx.Provider value={ctx}>
      <div className={cn("space-y-0.5", className)}>
        {nodes.map((node) => (
          <TreeNodeRenderer key={node.id} node={node} depth={0} expandedMap={expandedMap} />
        ))}
      </div>
    </TreeCtx.Provider>
  );
});

/* ─── Loading 骨架屏 ─── */

function TaskTreeLoading() {
  return (
    <div className="space-y-2 px-3 py-2">
      {[48, 64, 52, 44].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-4 h-4 rounded animate-pulse" style={{ backgroundColor: 'var(--bg-muted)' }} />
          <div className="h-3 rounded animate-pulse" style={{ width: w, backgroundColor: 'var(--bg-muted)' }} />
        </div>
      ))}
    </div>
  );
}

/* ─── 空态 ─── */

function TaskTreeEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: 'var(--bg-muted)' }}>
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

/* ─── 单个节点渲染器（递归） ─── */

interface TreeNodeRendererProps {
  node: TaskNode;
  depth: number;
  expandedMap: Map<string, boolean>;
}

const TreeNodeRenderer = memo(function TreeNodeRenderer({
  node,
  depth,
  expandedMap,
}: TreeNodeRendererProps) {
  const { selectedId, onSelect, onToggle, onCheck } = useContext(TreeCtx);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedMap.get(node.id) ?? node.expanded ?? false;

  const handleToggle = useCallback(() => {
    onToggle(node.id);
  }, [node.id, onToggle]);

  const handleSelect = useCallback(() => {
    onSelect(node.id);
  }, [node.id, onSelect]);

  const handleCheck = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCheck(node.id);
    },
    [node.id, onCheck]
  );

  const priorityColor = PRIORITY_COLORS[node.priority] || "var(--text-muted)";
  const label = depth % 2 === 0 ? node.id.slice(0, 2) : node.title[0];

  return (
    <div>
      {/* 当前节点行 */}
      <button
        type="button"
        onClick={handleSelect}
        className="w-full text-left px-2 py-1.5 flex items-center gap-2 group rounded-md transition-colors text-sm min-h-[32px] relative"
        style={{
          paddingLeft: `calc(0.5rem + ${depth * 16}px)`,
          backgroundColor: isSelected ? 'var(--bg-muted)' : 'transparent',
          color: 'var(--text-secondary)',
        }}
      >
        {/* 占位图标：无子节点时作为缩进占位，有子节点时可折叠展开 */}
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:opacity-80"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ color: 'var(--text-muted)', transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 120ms" }}
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
        ) : (
          <span className="flex-shrink-0 w-4" />
        )}

        {/* 自定义小标签 (project/group 名缩写) */}
        {depth === 0 && (
          <div className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-muted)' }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        )}

        {/* 文本 */}
        <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{node.title}</span>

        {/* 右侧状态 */}
        <span className="flex-shrink-0 flex items-center gap-1">
          {/* 优先级色点 */}
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: priorityColor }} />

          {/* 状态 checkbox */}
          <span
            onClick={handleCheck}
            className="flex-shrink-0 w-3.5 h-3.5 rounded-full border cursor-pointer"
            style={{
              borderColor: node.status === "done" ? "var(--color-success)" : 'var(--border-strong)',
              backgroundColor: node.status === "done" ? "var(--color-success)" : "transparent",
            }}
          >
            {node.status === "done" && (
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" className="m-auto">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        </span>
      </button>

      {/* 递归子节点 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeRenderer key={child.id} node={child} depth={depth + 1} expandedMap={expandedMap} />
          ))}
        </div>
      )}
    </div>
  );
});

export default TaskTree;
