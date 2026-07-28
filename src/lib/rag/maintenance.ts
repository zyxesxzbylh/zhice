// 知识库维护模块：嵌入重建与索引优化

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getEmbeddingBatch, embeddingToPgVector, buildEmbeddingText } from "./embedding";

// ============================================================
// 单条重建
// ============================================================

/**
 * 知识条目内容更新后，重新生成该条目的嵌入向量
 *
 * 使用场景：
 * - 用户编辑了条目的标题/正文/摘要
 * - 上传了新附件后文本内容发生变化
 */
export async function reindexEntry(entryId: string): Promise<void> {
  const rows = await db.execute(sql`
    SELECT id, title, content, summary
    FROM knowledge_entries
    WHERE id = ${entryId}
  `);

  const row = (rows as any[])?.[0];
  if (!row) return;

  const embedText = buildEmbeddingText(
    row.title ?? "",
    row.summary ?? null,
    row.content ?? ""
  );

  if (!embedText.trim()) return;

  const [embedding] = await getEmbeddingBatch([embedText]);
  const vectorStr = embeddingToPgVector(embedding);

  await db.execute(sql`
    UPDATE knowledge_entries
    SET embedding = ${vectorStr}::vector,
        updated_at = NOW()
    WHERE id = ${entryId}
  `);
}

// ============================================================
// 批量回填
// ============================================================

/**
 * 批量回填缺失的嵌入向量
 *
 * 使用场景：
 * - 首次部署时，数据库里已有条目但没嵌入
 * - 嵌入生成服务中断过，部分条目缺失嵌入
 *
 * 每批处理 50 条，避免一次性请求过大。
 * 返回成功回填的条目数。
 */
export async function backfillMissingEmbeddings(userId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT id, title, content, summary
    FROM knowledge_entries
    WHERE user_id = ${userId}
      AND embedding IS NULL
    LIMIT 50
  `);

  const entries = rows as any[];
  if (entries.length === 0) return 0;

  const texts = entries.map((r) =>
    buildEmbeddingText(r.title ?? "", r.summary ?? null, r.content ?? "")
  );

  const embeddings = await getEmbeddingBatch(texts);

  let count = 0;
  for (let i = 0; i < entries.length; i++) {
    try {
      const vectorStr = embeddingToPgVector(embeddings[i]);
      await db.execute(sql`
        UPDATE knowledge_entries
        SET embedding = ${vectorStr}::vector
        WHERE id = ${entries[i].id}
      `);
      count++;
    } catch (err) {
      console.error(`条目 ${entries[i].id} 嵌入更新失败:`, err);
    }
  }

  return count;
}

/**
 * 扫描指定的用户，返回缺失嵌入的条目数
 */
export async function countMissingEmbeddings(userId: string): Promise<number> {
  const rows = await db.execute(sql`
    SELECT COUNT(*) as cnt
    FROM knowledge_entries
    WHERE user_id = ${userId}
      AND embedding IS NULL
  `);
  return Number((rows as any[])?.[0]?.cnt ?? 0);
}

// ============================================================
// IVFFlat 索引管理
// ============================================================

/**
 * 检查 IVFFlat 索引是否存在
 *
 * 建议在数据量超过 1000 条后手动建立，
 * 因为 IVFFlat 需要足够的训练数据才能有效工作。
 */
export async function ensureVectorIndex(): Promise<boolean> {
  try {
    const rows = await db.execute(sql`
      SELECT 1
      FROM pg_indexes
      WHERE indexname = 'ke_embedding_idx'
    `);
    return (rows as any[]).length > 0;
  } catch {
    return false;
  }
}

/**
 * 建立 IVFFlat 向量索引
 *
 * 参数说明：
 * - lists: 索引的分区数。建议值 = sqrt(总行数)
 *   1000 条 → lists=31
 *   10000 条 → lists=100
 *   100000 条 → lists=316
 *
 * 需要 pgvector 扩展已启用
 */
export async function createVectorIndex(lists: number = 100): Promise<void> {
  // 先确保扩展已启用
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);

  // 删除旧索引（如果存在）
  await db.execute(sql`DROP INDEX IF EXISTS ke_embedding_idx`);

  // 建立新索引
  await db.execute(sql`
    CREATE INDEX ke_embedding_idx
    ON knowledge_entries
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = ${lists})
  `);
}
