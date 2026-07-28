// LLM 回答生成模块

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

import type { RankedResult } from "./ranking";
import type { Citation } from "./context";
import { buildContext } from "./context";

export interface RAGResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
}

/**
 * 基于检索结果调用 LLM 生成回答
 *
 * 核心约束：
 * - 只回答用户记录中有的内容，不编造
 * - 当检索结果不足时，诚实返回「未找到」
 * - 用 [记录N] 引用来源
 *
 * temperature 设为 0.3，确保回答忠实于检索结果，
 * 同时保留一定的自然语言表达流畅度
 */
export async function generateAnswer(
  question: string,
  topResults: RankedResult[],
  confidence: number
): Promise<string> {
  // 置信度过低，不给 LLM 送低质量上下文
  if (topResults.length === 0 || confidence < 0.15) {
    return [
      "我查找了你的知识库，但没有找到与这个问题明确相关的记录。",
      "",
      "可能是以下原因：",
      "- 相关内容还没有被收录到知识库中",
      "- 换一个更具体的问法试试",
      "- 在任务完成后标注「复盘」，系统会自动收录你的经验",
    ].join("\n");
  }

  const context = buildContext(topResults);

  const systemPrompt = [
    "你是「执策」的知识库问答助手。你只能基于下面提供的用户个人工作记录来回答问题。",
    "",
    "行为规范：",
    "1. 只使用提供的记录来回答，不要引入你从训练数据中学到的外部知识",
    "2. 如果记录中找不到明确的答案，如实说「未在你的记录中找到相关信息」，不要猜测或编造",
    "3. 如果多条记录描述同一件事的不同阶段，按时间顺序组织回答",
    "4. 用「根据你的记录」开头，强调信息来源于用户自己的积累",
    "5. 回答末尾标注引用了哪些记录，格式为「参考：[记录N] XXX」",
    "",
    "禁止事项：",
    "- 不要评价用户的工作质量",
    "- 不要对不在记录中的内容做任何推测",
    "- 不要使用指令语气（你应该、建议你、你需要）",
    "- 不要编造任何数据、人名、项目名、日期",
    "",
    "语气：",
    "平和、信息性，像在帮用户翻阅他们自己的笔记本。",
  ].join("\n");

  const userPrompt = [
    "以下是你知识库中与当前问题相关的记录：",
    "",
    context,
    "",
    "用户的问题是：",
    question,
    "",
    "请基于以上记录回答。使用 [记录N] 格式标注信息来源。",
  ].join("\n");

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,  // RAG 需要准确性而非创造性
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM 调用失败 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    return "很抱歉，在生成回答时遇到问题。请稍后重试或换个问法。";
  }

  return content.trim();
}
