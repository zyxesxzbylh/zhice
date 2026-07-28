// 排序与融合模块：RRF 融合 + 业务精排

import type { RetrievalResult } from "./retrieval";

// ============================================================
// Reciprocal Rank Fusion (RRF)
// ============================================================

/**
 * RRF 融合算法
 *
 * 将向量检索和全文检索的结果合并，只关心排名而非原始分数。
 *
 * 公式: score = Σ 1 / (k + rank)
 * - k 是平滑常数（默认 60），防止第一名权重过大
 * - rank 从 1 开始，两条路各自的排名贡献相等
 *
 * 为什么用 RRF 而不是加权求和：
 * - 向量路的分数（余弦相似度 0-1）和全文路的分数（ts_rank）不在同一量纲
 * - 加权求和需要人工调参（权重多大？）
 * - RRF 只关心排名，天然消除了量纲差异
 * - 已被学术论文反复验证在混合检索中效果优于加权求和
 */
export function reciprocalRankFusion(
  vectorResults: RetrievalResult[],
  fulltextResults: RetrievalResult[],
  k: number = 60
): Map<string, { score: number; vectorRank: number; fulltextRank: number }> {
  const scores = new Map<
    string,
    { score: number; vectorRank: number; fulltextRank: number }
  >();

  // 向量路
  for (let i = 0; i < vectorResults.length; i++) {
    const r = vectorResults[i];
    const rank = i + 1; // 排名从 1 开始
    const existing = scores.get(r.id) ?? { score: 0, vectorRank: 0, fulltextRank: 0 };
    existing.score += 1 / (k + rank);
    existing.vectorRank = rank;
    scores.set(r.id, existing);
  }

  // 全文路
  for (let i = 0; i < fulltextResults.length; i++) {
    const r = fulltextResults[i];
    const rank = i + 1;
    const existing = scores.get(r.id) ?? { score: 0, vectorRank: 0, fulltextRank: 0 };
    existing.score += 1 / (k + rank);
    existing.fulltextRank = rank;
    scores.set(r.id, existing);
  }

  return scores;
}

// ============================================================
// 业务精排（Reranking）
// ============================================================

export interface RankedResult extends RetrievalResult {
  _finalScore: number;
}

/**
 * 精排函数
 *
 * 在 RRF 融合得分的基础上，叠加业务特征加权：
 *
 * 1. 时效性 —— 越新创建的记录分值越高（但用对数衰减，避免过拟合）
 * 2. 使用行为 —— 被多次查看的记录可能有更高的参考价值
 * 3. 类型权重 —— 结构化知识（方法论/模板）比碎片化记录（洞察）价值更高
 *
 * 所有加权因子都是乘性叠加，最终排序可靠且可解释
 */
export function rerank(
  results: RetrievalResult[],
  rrfScores: Map<string, { score: number; vectorRank: number; fulltextRank: number }>,
  topK: number = 5
): RankedResult[] {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // 各类别权重
  const categoryWeights: Record<string, number> = {
    method: 1.3,    // 方法论——结构化、可复用，价值最高
    template: 1.2,  // 模板——可直接复用
    insight: 1.1,   // 洞察——个人经验
    decision: 1.05, // 决策记录
    reference: 1.0, // 参考资料
    archive: 0.8,   // 归档——主动降低权重
  };

  return results
    .map((r) => {
      const rrf = rrfScores.get(r.id) ?? { score: 0, vectorRank: 0, fulltextRank: 0 };

      // 时效性：越新越高，对数衰减
      const ageInDays = (now - new Date(r.createdAt).getTime()) / DAY_MS;
      const freshness = 1 / (1 + Math.log(1 + Math.max(0, ageInDays)));

      // 使用行为加权
      const viewBoost = r.viewCount > 0
        ? 1 + Math.log(1 + r.viewCount) * 0.1
        : 1;

      // 类型加权
      const typeWeight = categoryWeights[r.category] ?? 1;

      // 综合得分
      const finalScore = rrf.score * (1 + freshness * 0.3) * viewBoost * typeWeight;

      return { ...r, _finalScore: finalScore };
    })
    .sort((a, b) => b._finalScore - a._finalScore)
    .slice(0, topK);
}

// ============================================================
// 置信度计算
// ============================================================

/**
 * 计算检索结果的置信度
 *
 * 基于 Top-K 记录的 RRF 得分，评估检索质量。
 * 如果置信度过低（< 0.15），触发提前退出，不给 LLM 送低质量上下文。
 */
export function calcConfidence(
  topResults: RankedResult[],
  rrfScores: Map<string, { score: number }>,
  totalCandidates: number
): number {
  if (topResults.length === 0 || totalCandidates === 0) return 0;

  // 理论最大 RRF：两条路都排第一时
  const maxRrf = 1 / 61 + 1 / 61; // k=60 时 1/(60+1) + 1/(60+1)

  const topRrf = rrfScores.get(topResults[0].id)?.score ?? 0;

  if (topRrf <= 0) return 0;

  // 只归一化到理论最大值
  return Math.min(1, topRrf / maxRrf);
}
