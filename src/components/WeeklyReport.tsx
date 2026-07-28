"use client";

import { useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

export interface WeeklyReportData {
  weekRange: string;
  summary: {
    tasksCompleted: number;
    tasksInProgress: number;
    highValueTasks: number;
    avgEnergy: number | null;
    avgFocus: number | null;
    avgSatisfaction: number | null;
  };
  highlights: string[];
  challenges: string[];
  skillsUsed: string[];
  nextWeekGoals: string[];
  retrospectives: Array<{
    date: string;
    achievement: string;
    challenge: string;
    lesson: string;
  }>;
  highValueTaskList: Array<{
    title: string;
    valueScore: number;
    valueDescription?: string;
  }>;
}

interface WeeklyReportProps {
  open: boolean;
  onClose: () => void;
  report: WeeklyReportData | null;
  loading: boolean;
}

export default function WeeklyReport({
  open,
  onClose,
  report,
  loading,
}: WeeklyReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = useCallback(async () => {
    if (!report) return;
    const md = formatWeeklyReportMarkdown(report);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [report]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="本周工作报告"
      size="lg"
      footer={
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            disabled={!report || loading}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2",
            )}
            style={{
              backgroundColor: copied ? 'var(--color-success)' : 'var(--accent)',
              color: 'var(--text-inverse)',
            }}
          >
            {copied ? (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                复制为 Markdown
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-[var(--bg-root)]"
            style={{
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
          >
            关闭
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 rounded-full"
            style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : report ? (
        <WeeklyReportContent report={report} />
      ) : (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          暂无周报数据
        </div>
      )}
    </Modal>
  );
}

function WeeklyReportContent({ report }: { report: WeeklyReportData }) {
  return (
    <div className="space-y-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
      {/* 周期 */}
      <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{report.weekRange}</div>

      {/* 概览统计 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="完成任务" value={String(report.summary.tasksCompleted)} />
        <StatCard label="进行中任务" value={String(report.summary.tasksInProgress)} />
        <StatCard label="高价值任务" value={String(report.summary.highValueTasks)} />
        <StatCard
          label="平均精力"
          value={report.summary.avgEnergy != null ? `${report.summary.avgEnergy}/10` : "-"}
        />
        <StatCard
          label="平均专注"
          value={report.summary.avgFocus != null ? `${report.summary.avgFocus}/10` : "-"}
        />
        <StatCard
          label="平均满意度"
          value={report.summary.avgSatisfaction != null ? `${report.summary.avgSatisfaction}/10` : "-"}
        />
      </div>

      {/* 高价值任务列表 */}
      {report.highValueTaskList.length > 0 && (
        <Section title="高价值任务">
          <ul className="space-y-2">
            {report.highValueTaskList.map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                  {t.valueDescription && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.valueDescription}</p>
                  )}
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>价值分 {t.valueScore}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 复盘摘要 */}
      {report.retrospectives.length > 0 && (
        <Section title="复盘记录">
          <div className="space-y-3">
            {report.retrospectives.map((r, i) => (
              <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-root)', border: '1px solid var(--border-subtle)' }}>
                <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{r.date}</div>
                {r.achievement && (
                  <div className="mb-1">
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                      style={{ color: '#047857', backgroundColor: '#ecfdf5' }}>成就</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>{r.achievement}</span>
                  </div>
                )}
                {r.challenge && (
                  <div className="mb-1">
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                      style={{ color: '#b45309', backgroundColor: '#fffbeb' }}>挑战</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>{r.challenge}</span>
                  </div>
                )}
                {r.lesson && (
                  <div>
                    <span className="text-[11px] font-medium px-1.5 py-0.5 rounded"
                      style={{ color: '#1d4ed8', backgroundColor: '#eff6ff' }}>教训</span>
                    <span className="text-sm ml-2" style={{ color: 'var(--text-secondary)' }}>{r.lesson}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 本周亮点 */}
      {report.highlights.length > 0 && (
        <Section title="本周亮点">
          <ul className="space-y-1.5">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 遇到的挑战 */}
      {report.challenges.length > 0 && (
        <Section title="遇到的挑战">
          <ul className="space-y-1.5">
            {report.challenges.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: '#9ca3af' }} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 技能使用 */}
      {report.skillsUsed.length > 0 && (
        <Section title="技能使用">
          <div className="flex flex-wrap gap-2">
            {report.skillsUsed.map((s, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full text-xs"
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* 下周计划 */}
      {report.nextWeekGoals.length > 0 && (
        <Section title="下周计划">
          <ul className="space-y-1.5">
            {report.nextWeekGoals.map((g, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--accent)' }} />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-root)', border: '1px solid var(--border-subtle)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2.5" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      {children}
    </div>
  );
}

function formatWeeklyReportMarkdown(report: WeeklyReportData): string {
  const lines: string[] = [];
  lines.push(`# 本周工作报告 (${report.weekRange})`);
  lines.push("");
  lines.push("## 数据概览");
  lines.push(`- 完成任务：${report.summary.tasksCompleted}`);
  lines.push(`- 进行中任务：${report.summary.tasksInProgress}`);
  lines.push(`- 高价值任务：${report.summary.highValueTasks}`);
  lines.push(`- 平均精力：${report.summary.avgEnergy ?? "-"}/10`);
  lines.push(`- 平均专注：${report.summary.avgFocus ?? "-"}/10`);
  lines.push(`- 平均满意度：${report.summary.avgSatisfaction ?? "-"}/10`);
  lines.push("");

  if (report.highValueTaskList.length > 0) {
    lines.push("## 高价值任务");
    report.highValueTaskList.forEach((t) => {
      lines.push(`- **${t.title}** (价值分 ${t.valueScore})`);
      if (t.valueDescription) lines.push(`  - ${t.valueDescription}`);
    });
    lines.push("");
  }

  if (report.retrospectives.length > 0) {
    lines.push("## 复盘记录");
    report.retrospectives.forEach((r) => {
      lines.push(`### ${r.date}`);
      if (r.achievement) lines.push(`- 成就：${r.achievement}`);
      if (r.challenge) lines.push(`- 挑战：${r.challenge}`);
      if (r.lesson) lines.push(`- 教训：${r.lesson}`);
    });
    lines.push("");
  }

  if (report.highlights.length > 0) {
    lines.push("## 本周亮点");
    report.highlights.forEach((h) => lines.push(`- ${h}`));
    lines.push("");
  }

  if (report.challenges.length > 0) {
    lines.push("## 遇到的挑战");
    report.challenges.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  if (report.skillsUsed.length > 0) {
    lines.push("## 技能使用");
    lines.push(report.skillsUsed.join("、"));
    lines.push("");
  }

  if (report.nextWeekGoals.length > 0) {
    lines.push("## 下周计划");
    report.nextWeekGoals.forEach((g) => lines.push(`- ${g}`));
    lines.push("");
  }

  return lines.join("\n");
}
