/**
 * 飞书 OAuth2 授权回调
 *
 * GET /api/feishu/auth/callback?code=xxx&state=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { feishuConfig } from '@/db/schema/feishu';
import { eq } from 'drizzle-orm';
import { exchangeCodeForToken, saveUserToken } from '@/lib/feishu/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || state !== 'flowsync_auth') {
      return NextResponse.redirect(new URL('/settings?feishu_error=invalid_params', req.url));
    }

    const config = await db.query.feishuConfig.findFirst();
    if (!config || !config.appId || !config.appSecret || config.appSecret.startsWith('user_')) {
      return NextResponse.redirect(new URL('/settings?feishu_error=no_config', req.url));
    }

    const { token, expiresAt, refreshToken } = await exchangeCodeForToken(
      config.appId,
      config.appSecret,
      code
    );

    await saveUserToken(config.userId, token, expiresAt, refreshToken);

    return NextResponse.redirect(new URL('/settings?feishu_success=1', req.url));
  } catch (error) {
    console.error('飞书授权回调失败:', error);
    return NextResponse.redirect(new URL('/settings?feishu_error=callback_failed', req.url));
  }
}
