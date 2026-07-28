/**
 * 飞书文件管理 API
 *
 * GET   /api/feishu/files         — 获取飞书文件列表
 * POST  /api/feishu/files         — 创建空白飞书文件（文档/表格/智能表格）
 * DELETE /api/feishu/files?id=xxx — 删除飞书文件记录（归档）
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { feishuFiles } from '@/db/schema/feishu';
import { eq, and } from 'drizzle-orm';
import {
  createFeishuDoc,
  createFeishuSheet,
  createFeishuBitable,
  buildDocUrl,
  buildSheetUrl,
  buildBitableUrl,
  clearAllTokenCache,
} from '@/lib/feishu';

/** 获取当前用户的飞书文件列表 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();

    const rows = await db
      .select()
      .from(feishuFiles)
      .where(
        and(
          eq(feishuFiles.userId, session.userId),
          eq(feishuFiles.isArchived, false)
        )
      )
      .orderBy(feishuFiles.createdAt);

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('获取飞书文件列表失败:', error);
    return NextResponse.json({ error: '获取飞书文件列表失败' }, { status: 500 });
  }
}

/** 创建空白飞书文件 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { fileName, fileType, folderToken } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: '缺少 fileName 或 fileType' },
        { status: 400 }
      );
    }

    const validTypes = ['doc', 'sheet', 'bitable'];
    if (!validTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `无效的文件类型，支持: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    let result: any;
    let feishuUrl: string;
    let feishuToken: string;

    // 清除 token 缓存，确保获取最新权限
    clearAllTokenCache();

    switch (fileType) {
      case 'doc': {
        result = await createFeishuDoc(session.userId, fileName, folderToken);
        feishuUrl = buildDocUrl(result.document.document_id);
        feishuToken = result.document.document_id;
        break;
      }
      case 'sheet': {
        result = await createFeishuSheet(session.userId, fileName, folderToken);
        feishuUrl = buildSheetUrl(result.spreadsheet.spreadsheetToken);
        feishuToken = result.spreadsheet.spreadsheetToken;
        break;
      }
      case 'bitable': {
        result = await createFeishuBitable(session.userId, fileName, folderToken);
        feishuUrl = buildBitableUrl(result.app.app_token);
        feishuToken = result.app.app_token;
        break;
      }
      default:
        throw new Error(`不支持的文件类型: ${fileType}`);
    }

    const [record] = await db
      .insert(feishuFiles)
      .values({
        userId: session.userId,
        fileName,
        fileType,
        feishuUrl,
        feishuToken,
        sourceType: 'created',
        metadata: { folderToken },
      })
      .returning();

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('创建飞书文件失败:', error);
    return NextResponse.json(
      { error: `创建飞书文件失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}

/** 删除飞书文件记录（归档，不真正删除飞书端文件） */
export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少文件 id' }, { status: 400 });
    }

    const [updated] = await db
      .update(feishuFiles)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(
        and(
          eq(feishuFiles.id, id),
          eq(feishuFiles.userId, session.userId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: '文件不存在或无权操作' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    console.error('删除飞书文件失败:', error);
    return NextResponse.json(
      { error: `删除失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
