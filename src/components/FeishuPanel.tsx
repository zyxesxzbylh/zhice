"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

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
  spreadsheetToken?: string;
  syncEnabled: boolean;
}

const FILE_TYPE_ICONS: Record<string, string> = {
  doc: "📄",
  sheet: "📊",
  bitable: "🗂️",
};

const FILE_TYPE_LABELS: Record<string, string> = {
  doc: "文档",
  sheet: "电子表格",
  bitable: "多维表格",
};

export default function FeishuPanel() {
  const [config, setConfig] = useState<FeishuConfig | null>(null);
  const [files, setFiles] = useState<FeishuFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [showNewFileForm, setShowNewFileForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);

  const [newFileName, setNewFileName] = useState("");
  const [newFileType, setNewFileType] = useState("doc");

  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

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

    const params = new URLSearchParams(window.location.search);
    if (params.get("feishu_success")) {
      showMessage("success", "飞书授权成功！");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (params.get("feishu_error")) {
      showMessage("error", "飞书授权失败，请重试");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadData]);

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;
    setCreating(newFileType);
    try {
      const res = await fetch("/api/feishu/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: newFileName.trim(), fileType: newFileType }),
      });
      if (res.ok) {
        showMessage("success", `飞书${FILE_TYPE_LABELS[newFileType]}创建成功`);
        setNewFileName("");
        setShowNewFileForm(false);
        loadData();
      } else {
        const err = await res.json();
        showMessage("error", err.error || "创建失败");
      }
    } catch {
      showMessage("error", "创建失败，请检查飞书配置");
    } finally {
      setCreating(null);
    }
  };

  const handleSaveLink = async () => {
    if (!linkUrl.trim()) return;
    setCreating("link");
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
        showMessage("success", "飞书链接已保存到知识库");
        setLinkUrl("");
        setLinkTitle("");
        setShowLinkForm(false);
        loadData();
      } else {
        const err = await res.json();
        showMessage("error", err.error || "保存失败");
      }
    } catch {
      showMessage("error", "保存失败");
    } finally {
      setCreating(null);
    }
  };

  const handleExportTasks = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/feishu/export/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        showMessage("success", `已导出 ${data.taskCount} 个任务到飞书表格`);
        loadData();
      } else {
        const err = await res.json();
        showMessage("error", err.error || "导出失败");
      }
    } catch {
      showMessage("error", "导出失败，请检查飞书配置");
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setExporting(true);
    try {
      const reportRes = await fetch(`/api/reports/weekly?type=${reportType}`);
      const reportData = reportRes.ok ? await reportRes.json() : null;

      const res = await fetch("/api/feishu/export/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reportType,
          reportData: reportData
            ? {
                summary: reportData.summary
                  ? `${reportType === "weekly" ? "本周" : "本月"}完成 ${reportData.summary.tasksCompleted || 0} 个任务`
                  : "",
                highlights: reportData.highlights || [],
                tasks: {
                  completed: reportData.highValueTaskList?.map((t: any) => t.title) || [],
                  inProgress: [],
                  planned: reportData.nextWeekGoals || [],
                },
                insights: reportData.challenges || [],
              }
            : {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showMessage("success", `${reportType === "weekly" ? "周报" : "月报"}已生成到飞书文档`);
        loadData();
      } else {
        const err = await res.json();
        showMessage("error", err.error || "生成失败");
      }
    } catch {
      showMessage("error", "生成报告失败");
    } finally {
      setExporting(false);
    }
  };

  const handleAuth = () => {
    if (!config?.appId) return;
    const redirectUri = window.location.origin + "/api/feishu/auth/callback";
    const authUrl = `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${config.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=docx:document%20docx:document:create%20sheets:spreadsheet%20bitable:app%20drive:drive&state=flowsync_auth`;
    window.location.href = authUrl;
  };

  const isConnected = config?.appId && !config?.appId?.startsWith("user_");

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        飞书集成
      </h2>

      {message && (
        <div
          className={cn(
            "mb-4 px-4 py-2.5 rounded-lg text-sm font-medium",
            message.type === "success" ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          )}
        >
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div
            className="animate-spin h-6 w-6 border-2 rounded-full"
            style={{ borderColor: "var(--border-strong)", borderTopColor: "var(--accent)" }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {!config?.appId ? (
            <div
              className="p-4 rounded-lg text-sm"
              style={{
                backgroundColor: "var(--bg-muted)",
                borderColor: "var(--border-subtle)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p style={{ color: "var(--text-secondary)" }}>
                尚未配置飞书应用。请在
                <a
                  href="https://open.feishu.cn/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-1 underline"
                  style={{ color: "var(--color-info)" }}
                >
                  飞书开放平台
                </a>
                创建应用，然后在设置中填入 App ID 和 App Secret。
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isConnected ? "var(--color-success)" : "var(--color-warning)" }} />
                <span style={{ color: "var(--text-secondary)" }}>
                  {isConnected ? "飞书已配置" : "飞书已连接"}
                </span>
              </div>
              {!isConnected && (
                <button
                  onClick={handleAuth}
                  className="text-xs px-3 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: "var(--accent)",
                    color: "var(--accent-text)",
                  }}
                >
                  授权登录
                </button>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              快捷操作
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowNewFileForm(!showNewFileForm);
                  setShowLinkForm(false);
                }}
                disabled={!config?.appId}
                className="p-3 rounded-lg text-sm text-left transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
                style={{
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-root)",
                }}
              >
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  ➕ 创建空白飞书文件
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  创建文档、表格或智能表格
                </div>
              </button>

              <button
                onClick={handleExportTasks}
                disabled={!config?.appId || exporting}
                className="p-3 rounded-lg text-sm text-left transition-colors hover:bg-[var(--bg-muted)] disabled:opacity-50"
                style={{
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-root)",
                }}
              >
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {exporting ? "⏳" : "📊"} 导出任务到飞书表格
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  将当前所有任务导出为飞书电子表格
                </div>
              </button>

              <button
                onClick={() => {
                  setShowLinkForm(!showLinkForm);
                  setShowNewFileForm(false);
                }}
                className="p-3 rounded-lg text-sm text-left transition-colors hover:bg-[var(--bg-muted)]"
                style={{
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-root)",
                }}
              >
                <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                  🔗 保存飞书文档链接
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  将外部飞书文档链接保存到知识库
                </div>
              </button>

              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--bg-root)",
                }}
              >
                <div className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  📝 生成报告到飞书文档
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as "weekly" | "monthly")}
                    className="text-xs px-2 py-1 rounded border"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-default)",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="weekly">周报</option>
                    <option value="monthly">月报</option>
                  </select>
                  <button
                    onClick={handleGenerateReport}
                    disabled={!config?.appId || exporting}
                    className="text-xs px-3 py-1 rounded transition-colors disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--accent-text)",
                    }}
                  >
                    {exporting ? "生成中..." : "生成"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showNewFileForm && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                创建空白飞书文件
              </h4>
              <input
                type="text"
                placeholder="文件名称"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <div className="flex items-center gap-2">
                {(["doc", "sheet", "bitable"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setNewFileType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs transition-colors",
                      newFileType === type
                        ? ""
                        : "hover:bg-[var(--bg-root)]"
                    )}
                    style={{
                      backgroundColor: newFileType === type ? "var(--accent)" : "var(--bg-root)",
                      color: newFileType === type ? "var(--accent-text)" : "var(--text-secondary)",
                      border: `1px solid ${newFileType === type ? "var(--accent)" : "var(--border-default)"}`,
                    }}
                  >
                    {FILE_TYPE_ICONS[type]} {FILE_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCreateFile}
                disabled={!newFileName.trim() || !!creating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {creating ? "创建中..." : "创建"}
              </button>
            </div>
          )}

          {showLinkForm && (
            <div
              className="p-4 rounded-lg space-y-3"
              style={{
                backgroundColor: "var(--bg-muted)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <h4 className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                保存飞书文档链接到知识库
              </h4>
              <input
                type="url"
                placeholder="飞书文档链接 (https://bytedance.feishu.cn/docx/...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <input
                type="text"
                placeholder="文档标题（可选）"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={handleSaveLink}
                disabled={!linkUrl.trim() || !!creating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-text)",
                }}
              >
                {creating ? "保存中..." : "保存到知识库"}
              </button>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                已管理的飞书文件 ({files.length})
              </h3>
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg text-sm transition-colors hover:bg-[var(--bg-muted)]"
                    style={{
                      backgroundColor: "var(--bg-root)",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{FILE_TYPE_ICONS[file.fileType] || "📎"}</span>
                      <div className="min-w-0">
                        <a
                          href={file.feishuUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium truncate block hover:underline"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {file.fileName}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor:
                                file.fileType === "doc"
                                  ? "rgba(59,130,246,0.1)"
                                  : file.fileType === "sheet"
                                  ? "rgba(34,197,94,0.1)"
                                  : "rgba(168,85,247,0.1)",
                              color:
                                file.fileType === "doc"
                                  ? "#3b82f6"
                                  : file.fileType === "sheet"
                                  ? "#22c55e"
                                  : "#a855f7",
                            }}
                          >
                            {FILE_TYPE_LABELS[file.fileType]}
                          </span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {file.sourceType === "created" ? "已创建" : "已链接"}
                          </span>
                          {file.knowledgeEntryId && (
                            <span className="text-xs" style={{ color: "var(--color-success)" }}>
                              已入知识库
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs shrink-0 ml-3" style={{ color: "var(--text-muted)" }}>
                      {new Date(file.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
