// 执策 RAG 知识库问答 — 主入口
//
// 完整流水线：
//   用户提问 → 查询缓存 → 向量检索 + 全文检索 → RRF融合 → 精排
//   → 置信度检查 → 上下文组装 → LLM生成 → 缓存结果 → 返回
//
// 所有模块均可独立使用：
//   - embedding.ts   → 嵌入向量生成
//   - retrieval.ts   → 混合检索
//   - ranking.ts     → 排序与融合
//   - context.ts     → 上下文组装
//   - generation.ts  → LLM回答生成
//   - maintenance.ts → 索引维护
//   - cache.ts       → 结果缓存

import { vectorSearch, fulltextSearch } from "./retrieval";
import { reciprocalRankFusion, rerank, calcConfidence } from "./ranking";
import { generateAnswer } from "./generation";
import { extractCitations } from "./context";
import { cacheKey, getCached, setCache } from "./cache";
import type { RankedResult } from "./ranking";
import type { RAGResponse } from "./generation";

export type { RAGResponse };

/**
 * askKnowledgeBase — 知识库问答主函数
 *
 * @param userId  - 当前用户ID（用于数据隔离）
 * @param question - 用户的自然语言问题
 * @returns RAGResponse { answer, citations, confidence }
 */
export async function askKnowledgeBase(
  userId: string,
  question: string
): Promise<RAGResponse> {
  // ── 0. 缓存检查 ──
  const key = cacheKey(userId, question);
  const cached = getCached(key);
  if (cached) return cached;

  // ── 1. 双路检索（并行执行）──
  const [vectorResults, fulltextResults] = await Promise.all([
    vectorSearch(userId, question, 20),
    fulltextSearch(userId, question, 20),
  ]);

  // ── 2. 如果两路都没结果，直接返回 ──
  const totalCandidates = vectorResults.length + fulltextResults.length;
  if (totalCandidates === 0) {
    const result: RAGResponse = {
      answer: [
        "你的知识库中暂时没有与这个问题相关的记录。",
        "",
        "知识库目前可能还在积累阶段。记录积累的来源包括：",
        "- 任务完成后填写「实际成果」和「完成反思」",
        "- 每日复盘中的「学到的方法」",
        "- 沉淀为 V1.0 的 SOP 方法论",
        "- 手动创建的洞察与笔记",
      ].join("\n"),
      citations: [],
      confidence: 0,
    };
    setCache(key, result);
    return result;
  }

  // ── 3. RRF 融合 ──
  const rrfScores = reciprocalRankFusion(vectorResults, fulltextResults);

  // ── 4. 去重 + 精排 → Top-5 ──
  const merged = new Map<string, typeof vectorResults[0]>();
  for (const r of vectorResults) merged.set(r.id, r);
  for (const r of fulltextResults) merged.set(r.id, r);
  const ranked = rerank(
    Array.from(merged.values()),
    rrfScores,
    5
  );

  // ── 5. 置信度检查 ──
  const confidence = calcConfidence(ranked, rrfScores, totalCandidates);

  // ── 6. LLM 生成回答 ──
  const answer = await generateAnswer(question, ranked, confidence);

  // ── 7. 构造响应 ──
  const result: RAGResponse = {
    answer,
    citations: extractCitations(ranked),
    confidence,
  };

  setCache(key, result);
  return result;
}

// ── 导出各模块供外部按需使用 ──
export * from "./embedding";
export { vectorSearch, fulltextSearch } from "./retrieval";
export type { RetrievalResult } from "./retrieval";
export { reciprocalRankFusion, rerank, calcConfidence } from "./ranking";
export type { RankedResult } from "./ranking";
export { buildContext, extractCitations } from "./context";
export type { Citation } from "./context";
export { generateAnswer } from "./generation";
export {
  reindexEntry,
  backfillMissingEmbeddings,
  countMissingEmbeddings,
} from "./maintenance";
export { clearUserCache, getCacheStats } from "./cache";
