// 查询结果缓存模块
// 减少重复查询的 API 调用成本

const cache = new Map<
  string,
  { result: any; expiresAt: number }
>();

/**
 * 缓存的有效期（毫秒）
 * 5 分钟——考虑到知识库更新频率低，短缓存已够用
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * 最大缓存条目数
 * 超出后从最早的条目开始淘汰（Map 的插入顺序）
 */
const MAX_CACHE_SIZE = 100;

/**
 * 生成缓存键
 * 组合 userId + question 的前 200 字符（避免超长问题撑爆内存）
 */
export function cacheKey(userId: string, question: string): string {
  return `${userId}::${question.slice(0, 200)}`;
}

export function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.result;
}

export function setCache(key: string, result: any): void {
  // 限制缓存大小：超出时删最早的
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }

  cache.set(key, {
    result,
    expiresAt: Date.now() + CACHE_TTL,
  });
}

/**
 * 清空当前用户的所有缓存
 * 用于用户手动刷新或知识库有大变更时
 */
export function clearUserCache(userId: string): void {
  const prefix = `${userId}::`;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * 获取当前缓存统计
 */
export function getCacheStats(): { size: number; keys: string[] } {
  const keys: string[] = [];
  let validCount = 0;

  for (const [key, entry] of cache.entries()) {
    if (Date.now() <= entry.expiresAt) {
      validCount++;
      keys.push(key);
    } else {
      cache.delete(key);
    }
  }

  return { size: validCount, keys };
}
