// 混合检索模块：向量检索 + 全文检索 双路召回

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getEmbedding, embeddingToPgVector } from "./embedding";

// ============================================================
// 类型定义
// ============================================================

export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  sourceType: string;
  sourceName: string | null;
  createdAt: string;
  viewCount: number;
  // 检索元数据（内部使用，不暴露给前端）
  _vectorScore: number;
  _fulltextScore: number;
}

// ============================================================
// 向量检索
// ============================================================

/**
 * 向量检索：基于 pgvector 余弦相似度
 *
 * pgvector 的 <=> 操作符计算余弦距离
 * 1 - 余弦距离 = 余弦相似度
 *
 * 使用 IVFFlat 索引加速（需数据 > 1000 条后建立）
 */
export async function vectorSearch(
  userId: string,
  query: string,
  topK: number = 20
): Promise<RetrievalResult[]> {
  const embedding = await getEmbedding(query);
  const vectorStr = embeddingToPgVector(embedding);

  const rows = await db.execute(sql`
    SELECT
      ke.id, ke.title, ke.content, ke.summary,
      ke.category, ke.source_type, ke.source_name,
      ke.created_at, ke.view_count,
      (1 - (ke.embedding <=> ${vectorStr}::vector)) AS _vector_score,
      0::float8 AS _fulltext_score
    FROM knowledge_entries ke
    WHERE ke.user_id = ${userId}
      AND ke.is_archived = false
      AND ke.embedding IS NOT NULL
    ORDER BY ke.embedding <=> ${vectorStr}::vector
    LIMIT ${topK}
  `);

  return (rows as any[]).map(normalizeRow);
}

// ============================================================
// 全文检索
// ============================================================

/**
 * 全文检索：基于 PostgreSQL tsvector + simple 分词器
 *
 * 中文搜索策略：双字切分（bigram）
 * "用户调研痛点" → "用户 & 户调 & 调研 & 研痛 & 痛点"
 *
 * ts_rank 计算相关性得分，排名越靠前越相关
 */
export async function fulltextSearch(
  userId: string,
  query: string,
  topK: number = 20
): Promise<RetrievalResult[]> {
  const tokenized = tokenizeBigram(query);

  if (tokenized.length === 0) return [];

  const tsquery = tokenized.join(" & ");

  const rows = await db.execute(sql`
    SELECT
      ke.id, ke.title, ke.content, ke.summary,
      ke.category, ke.source_type, ke.source_name,
      ke.created_at, ke.view_count,
      0::float8 AS _vector_score,
      ts_rank(
        to_tsvector('simple', coalesce(ke.title, '') || ' ' || coalesce(ke.content, '')),
        plainto_tsquery('simple', ${tsquery})
      ) AS _fulltext_score
    FROM knowledge_entries ke
    WHERE ke.user_id = ${userId}
      AND ke.is_archived = false
      AND to_tsvector('simple', coalesce(ke.title, '') || ' ' || coalesce(ke.content, ''))
          @@ plainto_tsquery('simple', ${tsquery})
    ORDER BY _fulltext_score DESC
    LIMIT ${topK}
  `);

  return (rows as any[]).map(normalizeRow);
}

// ============================================================
// 中文分词
// ============================================================

/**
 * 双字切分（bigram tokenizer）
 *
 * 为什么用双字切分：
 * - PostgreSQL 的 simple 分词器不了解中文，会把整个中文段落当成一个 token
 * - 双字切分后，每个相邻的字对都是独立 token，PG 可以做匹配
 * - 虽然不如 jieba 精确，但对检索场景已经够用
 *
 * 英文和数字保留原样，不切分
 *
 * 示例：
 *   "用户调研" → ["用户", "户调", "调研"]
 *   "API设计" → ["API设计"] （纯英文数字不切）
 *   "Q3目标" → ["Q3", "目标"] → ["Q3", "目标"]
 */
function tokenizeBigram(text: string): string[] {
  // 先按标点符号分割成段
  const segments = text.split(/[，。！？；：、\s]+/).filter(Boolean);

  const bigrams: string[] = [];

  for (const seg of segments) {
    // 纯英文字母和数字保留原样
    if (/^[a-zA-Z0-9_]+$/.test(seg)) {
      bigrams.push(seg);
      continue;
    }

    // 混合中英文：拆分为中文连续块和英文块，分别处理
    let chineseBlock = "";
    let englishBlock = "";

    for (const ch of seg) {
      if (/[\u4e00-\u9fff]/.test(ch)) {
        // 先存入英文块
        if (englishBlock) {
          bigrams.push(englishBlock);
          englishBlock = "";
        }
        chineseBlock += ch;
      } else {
        // 先处理中文块
        if (chineseBlock) {
          for (let i = 0; i < chineseBlock.length - 1; i++) {
            bigrams.push(chineseBlock.slice(i, i + 2));
          }
          chineseBlock = "";
        }
        englishBlock += ch;
      }
    }

    // 处理残留
    if (chineseBlock) {
      for (let i = 0; i < chineseBlock.length - 1; i++) {
        bigrams.push(chineseBlock.slice(i, i + 2));
      }
    }
    if (englishBlock) {
      bigrams.push(englishBlock);
    }
  }

  return [...new Set(bigrams)]; // 去重
}

// ============================================================
// 工具函数
// ============================================================

function normalizeRow(row: any): RetrievalResult {
  return {
    id: row.id,
    title: row.title ?? "",
    content: row.content ?? "",
    summary: row.summary,
    category: row.category ?? "reference",
    sourceType: row.source_type ?? "manual",
    sourceName: row.source_name,
    createdAt: row.created_at
      ? new Date(row.created_at).toISOString()
      : "",
    viewCount: row.view_count ?? 0,
    _vectorScore: Number(row._vector_score ?? 0),
    _fulltextScore: Number(row._fulltext_score ?? 0),
  };
}
