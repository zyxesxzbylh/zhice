/**
 * 周报/月报生成到飞书文档 API
 *
 * POST /api/feishu/export/report
 * Body: { type: 'weekly' | 'monthly', reportData: { summary, highlights, tasks, insights } }
 *
 * 生成结构化报告并写入飞书文档。
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { feishuFiles, feishuSyncLog } from '@/db/schema';
import {
  createFeishuDoc,
  appendDocBlocks,
  buildDocUrl,
  buildHeading1Block,
  buildHeading2Block,
  buildHeading3Block,
  buildTextBlock,
  buildBulletBlock,
  buildDividerBlock,
  buildOrderedBlock,
  DocBlock,
} from '@/lib/feishu';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { type, reportData, title, folderToken } = body;

    if (!type || !['weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'type 必须为 weekly 或 monthly' },
        { status: 400 }
      );
    }

    const reportTypeLabel = type === 'weekly' ? '周报' : '月报';
    const dateStr = new Date().toLocaleDateString('zh-CN');
    const docTitle = title || `${reportTypeLabel} - ${dateStr}`;

    // 创建飞书文档
    const docResult = await createFeishuDoc(session.userId, docTitle, folderToken);
    const documentId = docResult.document.document_id;

    // 构建文档内容块
    const blocks: DocBlock[] = [];

    // 标题
    blocks.push(buildHeading1Block(docTitle));
    blocks.push(buildTextBlock(`生成时间: ${new Date().toLocaleString('zh-CN')}`));
    blocks.push(buildDividerBlock());

    // 数据概览
    if (reportData) {
      const { summary, highlights, tasks, insights } = reportData;

      if (summary) {
        blocks.push(buildHeading2Block('概览'));
        blocks.push(buildTextBlock(summary));
        blocks.push(buildDividerBlock());
      }

      if (highlights && highlights.length > 0) {
        blocks.push(buildHeading2Block('亮点'));
        for (const h of highlights) {
          blocks.push(buildBulletBlock(h));
        }
        blocks.push(buildDividerBlock());
      }

      if (tasks) {
        const { completed, inProgress, planned } = tasks;

        if (completed && completed.length > 0) {
          blocks.push(buildHeading2Block('已完成任务'));
          for (const t of completed) {
            blocks.push(buildBulletBlock(`[完成] ${t}`));
          }
        }

        if (inProgress && inProgress.length > 0) {
          blocks.push(buildHeading2Block('进行中任务'));
          for (const t of inProgress) {
            blocks.push(buildBulletBlock(`[进行中] ${t}`));
          }
        }

        if (planned && planned.length > 0) {
          blocks.push(buildHeading2Block('下阶段计划'));
          for (const t of planned) {
            blocks.push(buildBulletBlock(`[计划] ${t}`));
          }
        }
      }

      if (insights && insights.length > 0) {
        blocks.push(buildDividerBlock());
        blocks.push(buildHeading2Block('思考与洞察'));
        for (const i of insights) {
          blocks.push(buildOrderedBlock(i));
        }
      }
    }

    // 写入文档内容
    if (blocks.length > 0) {
      await appendDocBlocks(session.userId, documentId, blocks);
    }

    const feishuUrl = buildDocUrl(documentId);

    // 记录到数据库
    const [fileRecord] = await db
      .insert(feishuFiles)
      .values({
        userId: session.userId,
        fileName: docTitle,
        fileType: 'doc',
        feishuUrl,
        feishuToken: documentId,
        sourceType: 'created',
        metadata: { reportType: type, generatedAt: new Date().toISOString() },
      })
      .returning();

    // 记录同步日志
    await db.insert(feishuSyncLog).values({
      userId: session.userId,
      configId: fileRecord.id,
      syncType: `export_${type}_report`,
      status: 'success',
      syncedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url: feishuUrl,
      fileId: fileRecord.id,
      title: docTitle,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    try {
      const session = await requireAuth();
      await db.insert(feishuSyncLog).values({
        userId: session.userId,
        configId: '00000000-0000-0000-0000-000000000000',
        syncType: 'export_report',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
        syncedAt: new Date(),
      });
    } catch (_) {}

    console.error('生成报告到飞书失败:', error);
    return NextResponse.json(
      { error: `生成报告失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
