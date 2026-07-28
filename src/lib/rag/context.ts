// 上下文组装模块：将检索结果格式化为 LLM 可理解的上下文

import type { RankedResult } from "./ranking";

// ============================================================
// 上下文组装
// ============================================================

/**
 * 将精排后的知识条目组装为 LLM 的上下文 prompt
 *
 * 组装策略：
 * 1. 每条记录分配一个 [记录N] 编号，方便 LLM 引用
 * 2. 提供时间信息，让 LLM 理解记录的时间顺序
 * 3. 优先展示摘要，缺少摘要时才展示正文开头
 * 4. 长度控制在 maxChars 以内，逐条截断
 *
 * Token 估算（粗略）：
 * - 中文约 1.5 字符/token
 * - maxChars=6000 约等于 4000 token
 * - 留给 LLM 的回答空间约 1000 token
 */
export function buildContext(
  results: RankedResult[],
  maxChars: number = 6000
): string {
  if (results.length === 0) {
    return "（未找到相关记录）";
  }

  const entries: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const idx = i + 1;

    // 优先级：摘要 > 正文截断
    const displayContent = r.summary && r.summary.trim().length > 10
      ? `${r.summary}\n详情：${r.content.slice(0, 200)}`
      : r.content.slice(0, 400);

    const entry = [
      `[记录${idx}] 标题：${r.title}`,
      `  日期：${formatDate(r.createdAt)}`,
      `  类型：${categoryLabel(r.category)}`,
      `  来源：${r.sourceName || "手动创建"}`,
      `  内容：${displayContent}`,
    ].join("\n");

    // 控制总长度
    const tentative = entries.length > 0
      ? entries.join("\n\n") + "\n\n" + entry
      : entry;

    if (tentative.length > maxChars) {
      // 如果第一条就超了，截断
      if (entries.length === 0) {
        entries.push(entry.slice(0, maxChars));
      }
      break;
    }

    entries.push(entry);
  }

  return entries.join("\n\n");
}

// ============================================================
// 回答引用提取
// ============================================================

export interface Citation {
  id: string;
  title: string;
  index: number;
}

/**
 * 从精排结果中提取引用信息
 * 用于前端展示引用卡片，用户可点击验证来源
 */
export function extractCitations(results: RankedResult[]): Citation[] {
  return results.map((r, idx) => ({
    id: r.id,
    title: r.title,
    index: idx + 1,
  }));
}

// ============================================================
// 工具函数
// ============================================================

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "未知日期";
  }
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    insight: "洞察",
    method: "方法",
    template: "模板",
    reference: "参考",
    decision: "决策",
    archive: "归档",
  };
  return map[cat] ?? cat;
}
