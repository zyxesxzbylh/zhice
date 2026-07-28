"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface FeishuFile {
  id: string;
  fileName: string;
  fileType: "doc" | "sheet" | "bitable";
  feishuUrl: string;
  feishuToken: string | null;
  sourceType: "created" | "linked";
  knowledgeEntryId: string | null;
  isArchived: boolean;
  metadata: Record<string, any>;
  createdAt: string;
}

interface FeishuConfig {
  id: string;
  appId?: string;
  syncEnabled: boolean;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  doc: "📄",
  sheet: "📊",
  bitable: "🗂️",
};

const FILE_TYPE_LABELS: Record<string, string> = {
  doc: "文档",
  sheet: "表格",
  bitable: "多维表格",
};

interface Props {
  mode?: "dashboard" | "knowledge";
  maxItems?: number;
}

export default function FeishuDocsSection({ mode = "dashboard", maxItems = 5 }: Props) {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [files, setFiles] = useState<FeishuFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState<"doc" | "sheet" | "bitable">("doc");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linking, setLinking] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [configRes, filesRes] = await Promise.all([
        fetch("/api/feishu/config"),
        fetch("/api/feishu/files"),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (filesRes.ok) setFiles(await filesRes.json());
    } catch (err) {
      console.error("加载飞书数据失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = async () => {
    if (!newFileName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/feishu/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: newFileName.trim(), fileType: newFileType }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`飞书${FILE_TYPE_LABELS[newFileType]}创建成功`);
        setNewFileName("");
        setShowCreateForm(false);
        loadData();
        if (data.feishuUrl) {
          window.open(data.feishuUrl, "_blank");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || "创建失败");
      }
    } catch {
      toast.error("创建失败，请检查飞书配置");
    } finally {
      setCreating(false);
    }
  };

  const handleImportLink = async () => {
    if (!linkUrl.trim()) return;
    setLinking(true);
    try {
      const res = await fetch("/api/feishu/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: linkUrl.trim(),
          title: linkTitle.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("飞书链接已导入");
        setLinkUrl("");
        setLinkTitle("");
        setShowLinkForm(false);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "导入失败");
      }
    } catch {
      toast.error("导入失败，请检查网络");
    } finally {
      setLinking(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("确定删除该飞书文件记录吗？飞书端文件不会被删除。")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/feishu/files?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("已删除");
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "删除失败");
      }
    } catch {
      toast.error("删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  const displayFiles = mode === "dashboard" ? files.slice(0, maxItems) : files;

  if (loading) {
    return (
      <div
        className="rounded-xl p-4 animate-pulse"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="h-5 w-24 rounded mb-3" style={{ backgroundColor: "var(--bg-muted)" }} />
        <div className="space-y-2">
          <div className="h-8 rounded" style={{ backgroundColor: "var(--bg-muted)" }} />
          <div className="h-8 rounded" style={{ backgroundColor: "var(--bg-muted)" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
      }}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "var(--accent)" }}>
            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="currentColor" fillOpacity="0.2"/>
            <path d="M14 2V8H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            飞书文档
          </h3>
          {files.length > 0 && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ({files.length})
            </span>
          )}
        </div>

        {config?.appId && (
          <div className="flex items-center gap-1.5">
            {/* 导入链接按钮 */}
            <button
              onClick={() => {
                setShowLinkForm(!showLinkForm);
                setShowCreateForm(false);
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{
                backgroundColor: "var(--bg-muted)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-default)",
              }}
            >
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              导入链接
            </button>
            {/* 新建按钮 */}
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setShowLinkForm(false);
              }}
              disabled={creating}
              className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              {creating ? (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              )}
              新建
            </button>
          </div>
        )}
      </div>

      {/* 未配置提示 */}
      {!config?.appId ? (
        <div className="py-4">
          <div
            className="p-3 rounded-lg text-center mb-3"
            style={{
              backgroundColor: "var(--bg-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>
              连接飞书后可创建文档、表格和智能表格
            </p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              需要 App ID 和 App Secret
            </p>
          </div>
          <ConfigForm onSaved={loadData} />
        </div>
      ) : (
        <>
          {/* 创建表单 */}
          {showCreateForm && (
            <div
              className="mb-3 p-3 rounded-lg space-y-2"
              style={{
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <input
                type="text"
                placeholder="输入文件名称..."
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                className="w-full px-3 py-1.5 rounded-md text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex items-center gap-1.5">
                {(["doc", "sheet", "bitable"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewFileType(type)}
                    className={cn(
                      "flex-1 px-2 py-1 rounded-md text-xs transition-colors"
                    )}
                    style={{
                      backgroundColor: newFileType === type ? "var(--accent)" : "var(--bg-surface)",
                      color: newFileType === type ? "var(--accent-text)" : "var(--text-secondary)",
                      border: `1px solid ${newFileType === type ? "var(--accent)" : "var(--border-default)"}`,
                    }}
                  >
                    {FILE_TYPE_ICONS[type]} {FILE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreate}
                disabled={!newFileName.trim() || creating}
                className="w-full py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {creating ? "创建中..." : "创建并打开"}
              </button>
            </div>
          )}

          {/* 导入链接表单 */}
          {showLinkForm && (
            <div
              className="mb-3 p-3 rounded-lg space-y-2"
              style={{
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                导入飞书文档链接
              </p>
              <input
                type="url"
                placeholder="粘贴飞书文档链接 (https://xxx.feishu.cn/docx/...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
                className="w-full px-3 py-1.5 rounded-md text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                type="text"
                placeholder="自定义标题（可选）"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowLinkForm(false);
                    setLinkUrl("");
                    setLinkTitle("");
                  }}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  取消
                </button>
                <button
                  onClick={handleImportLink}
                  disabled={!linkUrl.trim() || linking}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  {linking ? "导入中..." : "导入"}
                </button>
              </div>
            </div>
          )}

          {/* 文件列表 */}
          {displayFiles.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: "var(--text-muted)" }}>
              暂无飞书文档，点击「新建」或「导入链接」
            </p>
          ) : (
            <div className="space-y-1.5">
              {displayFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2.5 p-2 rounded-lg transition-colors hover:bg-[var(--bg-muted)] group"
                >
                  <a
                    href={file.feishuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 flex-1 min-w-0"
                  >
                    <span className="text-base flex-shrink-0">
                      {FILE_TYPE_ICONS[file.fileType] || "📎"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:underline" style={{ color: "var(--text-primary)" }}>
                        {file.fileName}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                          {FILE_TYPE_LABELS[file.fileType]}
                        </span>
                        <span
                          className="text-[10px] px-1 rounded"
                          style={{
                            backgroundColor: file.sourceType === "created" ? "var(--bg-muted)" : "var(--accent)",
                            color: file.sourceType === "created" ? "var(--text-muted)" : "var(--accent-text)",
                          }}
                        >
                          {file.sourceType === "created" ? "创建" : "导入"}
                        </span>
                      </div>
                    </div>
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => handleDelete(file.id, e)}
                    disabled={deletingId === file.id}
                    className="flex-shrink-0 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-danger)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                    title="删除"
                  >
                    {deletingId === file.id ? (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}

              {/* dashboard 模式下显示"查看全部" */}
              {mode === "dashboard" && files.length > maxItems && (
                <a
                  href="/knowledge"
                  className="block text-center text-xs py-1.5 transition-colors hover:bg-[var(--bg-muted)] rounded-lg"
                  style={{ color: "var(--accent)" }}
                >
                  查看全部 ({files.length})
                </a>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** 飞书配置表单 */
function ConfigForm({ onSaved }: { onSaved: () => void }) {
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!appId.trim() || !appSecret.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/feishu/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: appId.trim(),
          appSecret: appSecret.trim(),
          syncEnabled: true,
        }),
      });
      if (res.ok) {
        setSaved(true);
        onSaved();
      } else {
        const err = await res.json();
        setError(err.error || "保存失败");
      }
    } catch {
      setError("保存失败，请检查网络");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div
        className="p-3 rounded-lg text-center"
        style={{
          backgroundColor: "var(--bg-muted)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <p className="text-xs mb-2" style={{ color: "var(--color-success)" }}>
          配置已保存！点击下方按钮完成飞书授权
        </p>
        <button
          onClick={() => {
            const redirectUri = window.location.origin + "/api/feishu/auth/callback";
            const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=docx:document%20docx:document:create%20sheets:spreadsheet%20bitable:app%20drive:drive&state=flowsync_auth`;
            window.location.href = authUrl;
          }}
          className="w-full py-1.5 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: "var(--accent)",
            color: "var(--accent-text)",
          }}
        >
          授权登录飞书
        </button>
      </div>
    );
  }

  return (
    <div
      className="space-y-2 p-3 rounded-lg"
      style={{
        backgroundColor: "var(--bg-muted)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <a
        href="https://open.feishu.cn/app"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] underline flex items-center gap-1"
        style={{ color: "var(--accent)" }}
      >
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        前往飞书开放平台创建应用
      </a>
      <input
        type="text"
        placeholder="App ID (cli_xxx)"
        value={appId}
        onChange={(e) => setAppId(e.target.value)}
        className="w-full px-3 py-1.5 rounded-md text-sm outline-none"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          color: "var(--text-primary)",
        }}
      />
      <div className="relative">
        <input
          type={showSecret ? "text" : "password"}
          placeholder="App Secret"
          value={appSecret}
          onChange={(e) => setAppSecret(e.target.value)}
          className="w-full px-3 py-1.5 pr-8 rounded-md text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
          }}
        />
        <button
          onClick={() => setShowSecret(!showSecret)}
          className="absolute right-2 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        >
          {showSecret ? (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="text-[11px]" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}
      <button
        onClick={handleSave}
        disabled={!appId.trim() || !appSecret.trim() || saving}
        className="w-full py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
        style={{
          backgroundColor: "var(--accent)",
          color: "var(--accent-text)",
        }}
      >
        {saving ? "保存中..." : "保存配置"}
      </button>
    </div>
  );
}
