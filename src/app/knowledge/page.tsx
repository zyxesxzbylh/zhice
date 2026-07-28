"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import MobileNav from "@/components/MobileNav";
import FeishuDocsSection from "@/components/FeishuDocsSection";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  category: string;
  date: string;
  tags: string[];
}

interface SearchResponse {
  results: SearchResultItem[];
}

const CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "method", label: "工作方法" },
  { id: "sop", label: "SOP" },
  { id: "insight", label: "洞察" },
  { id: "decision", label: "决策" },
  { id: "retrospective", label: "复盘" },
];

const CATEGORY_COLORS: Record<string, string> = {
  method: "bg-[var(--accent)] text-[var(--text-inverse)]",
  sop: "bg-[var(--accent)] text-[var(--text-inverse)]",
  insight: "bg-[var(--accent)] text-[var(--text-inverse)]",
  decision: "bg-[var(--accent)] text-[var(--text-inverse)]",
  retrospective: "bg-[var(--bg-muted-hover)] text-[var(--text-primary)]",
  task: "bg-[var(--bg-muted-hover)] text-[var(--text-secondary)]",
  project: "bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border-default)]",
  pdf: "bg-[var(--bg-muted)] text-[var(--color-warning)] border border-[var(--border-default)]",
};

const CATEGORY_LABELS: Record<string, string> = {
  method: "工作方法",
  sop: "SOP",
  insight: "洞察",
  decision: "决策",
  retrospective: "复盘",
  task: "任务",
  project: "项目",
  pdf: "PDF资料",
};

export default function KnowledgePage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(!!initialQ);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [taskList, setTaskList] = useState<Array<{ id: string; title: string }>>([]);

  // 文件上传相关
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; title: string; sourceType: string; fileUrl: string; fileSize: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED_FORMATS = ".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp,.svg";

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTaskList(data.map((t: any) => ({ id: t.id, title: t.title })));
        }
      })
      .catch(() => {});
  }, []);

  const performSearch = useCallback(
    async (q: string, category: string, taskId?: string) => {
      if (!q.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      try {
        const url = new URL("/api/knowledge/search", window.location.origin);
        url.searchParams.set("q", q.trim());
        if (category !== "all") url.searchParams.set("category", category);
        if (taskId) url.searchParams.set("taskId", taskId);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (e) {
        console.error("搜索失败:", e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialQ) {
      performSearch(initialQ, activeCategory, selectedTaskId || undefined);
    }
  }, [initialQ]);

  const handleSearch = useCallback(() => {
    performSearch(query, activeCategory, selectedTaskId || undefined);
  }, [query, activeCategory, selectedTaskId, performSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    if (query.trim()) {
      performSearch(query, catId, selectedTaskId || undefined);
    }
  };

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (query.trim()) {
      performSearch(query, activeCategory, taskId || undefined);
    }
  };

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const results: typeof uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/knowledge/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          results.push(data.entry);
          toast.success(`${file.name} 上传成功`);
        } else {
          const err = await res.json();
          toast.error(`${file.name}: ${err.error}`);
        }
      } catch {
        toast.error(`${file.name} 上传失败`);
      }
    }

    setUploadedFiles((prev) => [...results, ...prev]);
    setUploading(false);

    // 重置 input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function triggerFileUpload() {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      <SidebarNav />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 flex items-center justify-between px-4 md:px-6 shrink-0" style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>知识库</h1>
            <p className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              搜索工作方法、SOP、洞察和决策记录
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* 搜索框 */}
            <div className="mb-6" data-tour="knowledge-search">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  width="20"
                  height="20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-xl pl-12 pr-24 py-3.5 text-sm outline-none focus:ring-2 transition-all duration-200 shadow-sm"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                  placeholder="搜索知识库..."
                />
                <button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      搜索中
                    </span>
                  ) : (
                    "搜索"
                  )}
                </button>
              </div>
            </div>

            {/* 按任务筛选 */}
            {taskList.length > 0 && (
              <div className="mb-4">
                <select
                  value={selectedTaskId}
                  onChange={(e) => handleTaskChange(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2 text-sm outline-none focus:ring-2 transition-all duration-200 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%221.5%22%3E%3Cpath%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat pr-10"
                  style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
                >
                  <option value="">全部任务</option>
                  {taskList.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 文件上传区域 */}
            <div className="mb-4 p-4 border-2 border-dashed rounded-xl transition-colors" style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-surface)' }} data-tour="knowledge-upload">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={SUPPORTED_FORMATS}
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>添加文件到知识库</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      支持 PDF、Word、Excel、PPT、TXT、Markdown、CSV、图片等格式（最大 10MB）
                    </p>
                  </div>
                </div>
                <button
                  onClick={triggerFileUpload}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      上传中
                    </>
                  ) : (
                    "选择文件"
                  )}
                </button>
              </div>

              {/* 已上传文件列表 */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>最近上传</p>
                  <div className="space-y-1.5">
                    {uploadedFiles.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                            {f.sourceType}
                          </span>
                          <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{f.title}</span>
                        </div>
                        <span className="text-xs flex-shrink-0 ml-2" style={{ color: 'var(--text-muted)' }}>{f.fileSize}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 飞书文档 */}
            <div className="mb-6" data-tour="knowledge-feishu">
              <FeishuDocsSection mode="knowledge" />
            </div>

            {/* 分类标签 */}
            <div className="flex flex-wrap gap-2 mb-6" data-tour="knowledge-filters">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    activeCategory === cat.id ? "shadow-sm" : ""
                  )}
                  style={
                    activeCategory === cat.id
                      ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                      : { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 空状态 */}
            {!hasSearched && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  知识库正在建设中
                </h3>
                <p className="text-sm max-w-sm" style={{ color: 'var(--text-muted)' }}>
                  完成复盘和任务后，洞察将自动汇聚于此
                </p>
              </div>
            )}

            {/* 搜索结果 */}
            {hasSearched && (
              <div className="space-y-4">
                {/* 统计 */}
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {results.length > 0
                      ? `找到 ${results.length} 条结果`
                      : loading
                      ? "搜索中..."
                      : "未找到相关结果"}
                  </p>
                </div>

                {results.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-muted)' }}>
                      <svg
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      换个关键词试试，或检查知识库中是否有相关内容
                    </p>
                  </div>
                )}

                {/* 结果列表 */}
                <div className="space-y-3">
                  {results.map((item) => (
                    <ResultCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <MobileNav activeItem="knowledge" />
      </main>
    </div>
  );
}

function ResultCard({ item }: { item: SearchResultItem }) {
  const catLabel = CATEGORY_LABELS[item.category] || item.category;
  const catColor = CATEGORY_COLORS[item.category] || "bg-[var(--bg-muted)] text-[var(--text-secondary)]";

  return (
    <div className="group rounded-xl p-4 transition-all duration-200" style={{ border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-surface)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {item.title}
          </h4>
          {item.excerpt && (
            <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {item.excerpt}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <span
          className={cn(
            "text-[11px] font-medium px-2 py-0.5 rounded",
            catColor
          )}
        >
          {catLabel}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.source}</span>
        {item.date && (
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
            {new Date(item.date).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {item.tags.map((tag) => (
            <Badge key={tag} tone="neutral" variant="soft" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
