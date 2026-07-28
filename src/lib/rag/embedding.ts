// 嵌入向量生成模块
// 阶段一：使用本地 BGE-small-zh-v1.5 模型（通过 @huggingface/transformers）
//
// 为什么不用 DeepSeek Embedding API：
// DeepSeek 官方未提供 Embedding API（调用 /v1/embeddings 返回 404），
// 因此阶段一直接采用本地模型方案。
//
// 模型信息：
// - 名称：Xenova/bge-small-zh-v1.5
// - 维度：512
// - 大小：约 100MB
// - 首次运行会自动下载到本地缓存
//
// 国内网络下载问题：
// 如果 Hugging Face 下载失败，可在 .env.local 中设置镜像：
//   HF_ENDPOINT=https://hf-mirror.com
import { pipeline, type FeatureExtractionPipeline, env } from "@huggingface/transformers";

const EMBEDDING_MODEL = "Xenova/bge-small-zh-v1.5";
export const EMBEDDING_DIM = 512;
const MAX_CHARS = 8000;
// 如果配置了 HF_ENDPOINT（如国内镜像 https://hf-mirror.com），则让 transformers.js 从镜像下载
if (process.env.HF_ENDPOINT) {
  env.remoteHost = process.env.HF_ENDPOINT.endsWith("/")
    ? process.env.HF_ENDPOINT
    : `${process.env.HF_ENDPOINT}/`;
  env.remotePathTemplate = "{model}/resolve/{revision}/";
}

let extractor: FeatureExtractionPipeline | null = null;
let initPromise: Promise<FeatureExtractionPipeline> | null = null;

/**
 * 懒加载并复用 embedding pipeline
 *
 * 单例模式避免多次初始化模型。首次调用时会自动下载模型文件
 * （约 100MB），后续调用直接使用内存中的 pipeline。
 */
async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (extractor) return extractor;
  if (initPromise) return initPromise;

  initPromise = pipeline(
    "feature-extraction",
    EMBEDDING_MODEL,{
      // 禁用 progress bar，避免在服务端打印过多日志
      progress_callback: undefined,
    }
  ) as Promise<FeatureExtractionPipeline>;

  extractor = await initPromise;
  return extractor;
}

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

/**
 * 生成单条文本的嵌入向量
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const result = await getEmbeddingBatch([text]);
  return result[0];
}

/**
 * 批量生成嵌入向量
 *
 * BGE-small-zh-v1.5 单条推理很快，批量处理可均摊模型加载开销。
 * 这里逐条调用 pipeline，但复用同一个 extractor。
 */
export async function getEmbeddingBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const ext = await getExtractor();

  const embeddings: number[][] = [];

  for (const raw of texts) {
    const text = (raw || "").slice(0, MAX_CHARS);

    // pipeline 输出 Tensor，shape: [1, sequence_length, 512]
    // 我们取均值池化（mean pooling）得到句子向量
    const output = await ext(text, { pooling: "mean", normalize: true });

    // output.data 是 Float32Array 或 number[]
    const vector = Array.from(output.data as Float32Array | number[]).map((v) => Number(v));

    if (vector.length !== EMBEDDING_DIM) {
      throw new Error(
        `嵌入维度异常: 期望 ${EMBEDDING_DIM}，实际 ${vector.length}`
      );
    }

    embeddings.push(vector);
  }

  return embeddings;
}

/**
 * 将向量数组转为 pgvector 兼容的格式字符串
 * pgvector 接受 '[0.1,0.2,...]' 格式
 */
export function embeddingToPgVector(embedding: number[]): string {
  if (embedding.length === 0) {
    throw new Error("嵌入向量为空");
  }
  return `[${embedding.join(",")}]`;
}

/**
 * 从 pgvector 格式字符串转为向量数组
 */
export function pgVectorToEmbedding(vectorStr: string): number[] {
  try {
    return JSON.parse(vectorStr) as number[];
  } catch {
    return [];
  }
}

/**
 * 构建用于嵌入生成的文本
 * 标题权重最高，放在最前面；摘要其次；正文截断
 */
export function buildEmbeddingText(
  title: string,
  summary: string | null,
  content: string
): string {
  const parts: string[] = [title];

  if (summary && summary.trim()) {
    parts.push(summary.trim());
  }

  if (content && content.trim()) {
    parts.push(content.trim());
  }

  return parts.join("\n");
}
