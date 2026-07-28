/**
 * 任务导出到飞书表格 API
 *
 * POST /api/feishu/export/tasks
 * Body: { projectId?, sheetName?, folderToken? }
 *
 * 将任务列表导出为飞书电子表格。
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, feishuFiles, feishuSyncLog } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  createFeishuSheet,
  appendSheetRows,
  buildSheetUrl,
  getTenantToken,
} from '@/lib/feishu';

const STATUS_LABELS: Record<string, string> = {
  todo: '待开始',
  in_progress: '进行中',
  done: '已完成',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { projectId, sheetName, folderToken } = body;

    // 查询任务
    const conditions = [eq(projects.userId, session.userId)];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    const rows = await db
      .select({
        task: tasks,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(tasks.createdAt);

    if (rows.length === 0) {
      return NextResponse.json({ error: '没有可导出的任务' }, { status: 404 });
    }

    // 生成表格名称
    const title = sheetName || `任务列表导出 - ${new Date().toLocaleDateString('zh-CN')}`;

    // 创建飞书表格
    const sheetResult = await createFeishuSheet(session.userId, title, folderToken);
    const spreadsheetToken = sheetResult.spreadsheet.spreadsheetToken;
    const sheetId = sheetResult.spreadsheet.sheets?.[0]?.sheetId || '0';

    // 构建表头 + 数据
    const header = ['任务标题', '所属项目', '状态', '优先级', '截止日期', '创建时间'];
    const values = [
      header,
      ...rows.map((r) => [
        r.task.title,
        r.projectName || '-',
        STATUS_LABELS[r.task.status] || r.task.status,
        PRIORITY_LABELS[r.task.priority || 'medium'] || r.task.priority || '-',
        r.task.dueDate ? new Date(r.task.dueDate).toLocaleDateString('zh-CN') : '-',
        r.task.createdAt ? new Date(r.task.createdAt).toLocaleString('zh-CN') : '-',
      ]),
    ];

    // 写入数据
    await appendSheetRows(session.userId, spreadsheetToken, sheetId, values);

    // 写入样式
    try {
      await fetch(
        `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetToken}/style`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getTenantToken(session.userId)}`,
          },
          body: JSON.stringify({
            appendStyle: {
              range: `${sheetId}!1:1`,
              style: {
                bold: true,
                fontSize: 11,
                fontColor: '#FFFFFF',
                backColor: '#2B5AED',
              },
            },
          }),
        }
      );
    } catch (styleErr) {
      console.warn('设置表头样式失败（非关键）:', styleErr);
    }

    const feishuUrl = buildSheetUrl(spreadsheetToken);

    // 记录到数据库
    const [fileRecord] = await db
      .insert(feishuFiles)
      .values({
        userId: session.userId,
        fileName: title,
        fileType: 'sheet',
        feishuUrl,
        feishuToken: spreadsheetToken,
        sourceType: 'created',
        metadata: { taskCount: rows.length, projectId: projectId || null },
      })
      .returning();

    // 记录同步日志
    await db.insert(feishuSyncLog).values({
      userId: session.userId,
      configId: fileRecord.id,
      syncType: 'export_tasks',
      status: 'success',
      recordCount: rows.length,
      syncedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      url: feishuUrl,
      taskCount: rows.length,
      fileId: fileRecord.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }

    // 记录失败日志
    try {
      const session = await requireAuth();
      await db.insert(feishuSyncLog).values({
        userId: session.userId,
        configId: '00000000-0000-0000-0000-000000000000',
        syncType: 'export_tasks',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : '未知错误',
        syncedAt: new Date(),
      });
    } catch (_) {}

    console.error('导出任务到飞书失败:', error);
    return NextResponse.json(
      { error: `导出失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    );
  }
}
