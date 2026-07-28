/**
 * 飞书 Open API 客户端
 *
 * 封装 token 管理、API 请求等基础功能。
 * 参考: https://open.feishu.cn/document/server-docs/api-call-guide/calling-process/get-access-token
 */

import { db } from '@/db';
import { feishuConfig } from '@/db/schema/feishu';
import { eq } from 'drizzle-orm';

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';
const FEISHU_AUTH_BASE = 'https://open.feishu.cn/open-apis/authen/v1';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, TokenCacheEntry>();

/** 获取当前用户的飞书配置 */
export async function getFeishuConfig(userId: string) {
  const config = await db.query.feishuConfig.findFirst({
    where: eq(feishuConfig.userId, userId),
  });

  if (config) return config;

  const anyConfig = await db.query.feishuConfig.findFirst();
  return anyConfig || null;
}

/** 生成飞书 OAuth2 授权 URL */
export function buildAuthUrl(appId: string, redirectUri: string) {
  const scopes = [
    'docx:document',
    'docx:document:create',
    'sheets:spreadsheet',
    'bitable:app',
    'drive:drive',
  ].join('%20');

  return `https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=flowsync_auth`;
}

/** 用授权 code 换取 user_access_token */
export async function exchangeCodeForToken(
  appId: string,
  appSecret: string,
  code: string
) {
  const res = await fetch(`${FEISHU_AUTH_BASE}/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
      grant_type: 'authorization_code',
      code,
    }),
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`换取 token 失败: ${json.msg || JSON.stringify(json)}`);
  }

  return {
    token: json.data.access_token,
    expiresAt: Date.now() + (json.data.expire || 7200) * 1000,
    refreshToken: json.data.refresh_token,
  };
}

/** 获取 user_access_token（带缓存） */
export async function getUserToken(userId: string): Promise<string> {
  const cached = tokenCache.get(`user_${userId}`);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const config = await getFeishuConfig(userId);
  if (!config || !config.appId || !config.appSecret) {
    throw new Error('飞书未配置，请先在设置中完成飞书应用授权');
  }

  if (config.appSecret && config.appSecret.startsWith('user_')) {
    return config.appSecret.replace('user_', '');
  }

  throw new Error('需要用户授权，请先完成飞书登录授权');
}

/** 保存 user_access_token 到数据库 */
export async function saveUserToken(userId: string, token: string, expiresAt: number, refreshToken: string) {
  const config = await getFeishuConfig(userId);
  if (!config) return;

  await db.update(feishuConfig)
    .set({
      appSecret: `user_${token}`,
      metadata: JSON.stringify({ refreshToken, expiresAt }),
      updatedAt: new Date(),
    })
    .where(eq(feishuConfig.id, config.id));

  tokenCache.set(`user_${userId}`, { token, expiresAt });
}

/** 获取 tenant_access_token（带缓存） */
export async function getTenantToken(userId: string): Promise<string> {
  const cached = tokenCache.get(`tenant_${userId}`);
  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const config = await getFeishuConfig(userId);
  if (!config || !config.appId || !config.appSecret) {
    throw new Error('飞书未配置，请先在设置中完成飞书应用授权');
  }

  if (config.appSecret?.startsWith('user_')) {
    return getUserToken(userId);
  }

  const res = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${json.msg || JSON.stringify(json)}`);
  }

  const token: TokenCacheEntry = {
    token: json.tenant_access_token,
    expiresAt: Date.now() + (json.expire || 7200) * 1000,
  };

  tokenCache.set(`tenant_${userId}`, token);
  return token.token;
}

/**
 * 通用飞书 API 请求
 * @param userId 用户 ID
 * @param method HTTP 方法
 * @param path API 路径（不含 base）
 * @param body 请求体
 */
export async function feishuRequest<T = any>(
  userId: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = await getTenantToken(userId);
  const url = `${FEISHU_BASE}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json; charset=utf-8',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(`飞书 API 错误 [${path}]: ${json.msg || JSON.stringify(json)}`);
  }

  return json.data as T;
}

/** 清除指定用户的 token 缓存 */
export function clearTokenCache(userId: string) {
  tokenCache.delete(`tenant_${userId}`);
  tokenCache.delete(`user_${userId}`);
}

/** 清除所有 token 缓存 */
export function clearAllTokenCache() {
  tokenCache.clear();
}
