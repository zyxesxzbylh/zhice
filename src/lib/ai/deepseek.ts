// DeepSeek AI 调用封装
// 统一入口，便于切换模型和追踪调用

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export interface CallDeepSeekOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * 调用 DeepSeek Chat API
 *
 * @param prompt 用户提示词
 * @param options 可选参数（temperature, maxTokens, systemPrompt）
 * @returns 模型回复文本
 */
export async function callDeepSeek(
  prompt: string,
  options: CallDeepSeekOptions = {}
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY 未设置，无法调用 AI 服务");
  }

  const { temperature = 0.7, maxTokens = 1000, systemPrompt } = options;

  const messages: { role: string; content: string }[] = [];

  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  messages.push({ role: "user", content: prompt });

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API 调用失败 (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content || !content.trim()) {
    throw new Error("DeepSeek API 返回空内容");
  }

  return content.trim();
}
