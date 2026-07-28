/**
 * 飞书文件操作服务
 *
 * 提供创建飞书文档/表格/智能表格、写入内容等操作。
 */

import { feishuRequest } from './client';

// ---- 创建空白文件 ----

interface CreateDocResult {
  document: { document_id: string; title: string; url: string };
}

interface CreateSheetResult {
  spreadsheet: {
    spreadsheetToken: string;
    title: string;
    url: string;
    sheets?: Array<{ sheetId: string; title: string; index: number }>;
  };
}

interface CreateBitableResult {
  app: { app_token: string; name: string; url: string };
}

/** 创建飞书空白文档 */
export async function createFeishuDoc(
  userId: string,
  title: string,
  folderToken?: string
): Promise<CreateDocResult> {
  return feishuRequest<CreateDocResult>(userId, 'POST', '/docx/v1/documents', {
    title,
    ...(folderToken ? { folder_token: folderToken } : {}),
  });
}

/** 创建飞书空白电子表格 */
export async function createFeishuSheet(
  userId: string,
  title: string,
  folderToken?: string
): Promise<CreateSheetResult> {
  return feishuRequest<CreateSheetResult>(userId, 'POST', '/sheets/v3/spreadsheets', {
    title,
    ...(folderToken ? { folder_token: folderToken } : {}),
  });
}

/** 创建飞书空白多维表格（智能表格） */
export async function createFeishuBitable(
  userId: string,
  name: string,
  folderToken?: string
): Promise<CreateBitableResult> {
  return feishuRequest<CreateBitableResult>(userId, 'POST', '/bitable/v1/apps', {
    name,
    ...(folderToken ? { folder_token: folderToken } : {}),
  });
}

// ---- 写入电子表格 ----

/** 在电子表格中追加数据行 */
export async function appendSheetRows(
  userId: string,
  spreadsheetToken: string,
  sheetId: string,
  values: any[][]
) {
  return feishuRequest(userId, 'POST', `/sheets/v2/spreadsheets/${spreadsheetToken}/values_append`, {
    valueRange: {
      range: `${sheetId}!A:Z`,
      values,
    },
  });
}

/** 设置电子表格表头样式 */
export async function setSheetHeaderStyle(
  userId: string,
  spreadsheetToken: string,
  sheetId: string,
  columnCount: number
) {
  return feishuRequest(
    userId,
    'PUT',
    `/sheets/v2/spreadsheets/${spreadsheetToken}/style`,
    {
      appendStyle: {
        range: `${sheetId}!1:1`,
        style: {
          bold: true,
          fontSize: 11,
          fontColor: '#FFFFFF',
          backColor: '#2B5AED',
        },
      },
    }
  );
}

// ---- 写入文档内容 ----

export interface DocBlock {
  block_type: number; // 2=text, 3=heading1, 4=heading2, 5=heading3, 9=bullet, 10=ordered, 11=code, 22=divider
  text?: {
    elements: Array<{
      text_run: {
        content: string;
        text_element_style?: {
          bold?: boolean;
          link?: { url: string };
        };
      };
    }>;
    style?: {
      align?: number; // 1=left, 2=center, 3=right
    };
  };
  heading1?: {
    elements: Array<{
      text_run: { content: string };
    }>;
  };
  heading2?: {
    elements: Array<{
      text_run: { content: string };
    }>;
  };
  heading3?: {
    elements: Array<{
      text_run: { content: string };
    }>;
  };
  bullet?: {
    elements: Array<{
      text_run: { content: string };
    }>;
  };
  divider?: Record<string, never>;
}

/** 向飞书文档追加内容块 */
export async function appendDocBlocks(
  userId: string,
  documentId: string,
  blocks: DocBlock[]
) {
  return feishuRequest(
    userId,
    'POST',
    `/docx/v1/documents/${documentId}/blocks/${documentId}/children`,
    {
      children: blocks,
    }
  );
}

// ---- 工具方法 ----

/** 根据文档 ID 拼出飞书文档 URL */
export function buildDocUrl(docId: string): string {
  return `https://bytedance.feishu.cn/docx/${docId}`;
}

/** 根据表格 token 拼出飞书表格 URL */
export function buildSheetUrl(token: string): string {
  return `https://bytedance.feishu.cn/sheets/${token}`;
}

/** 根据多维表格 token 拼出飞书多维表格 URL */
export function buildBitableUrl(token: string): string {
  return `https://bytedance.feishu.cn/base/${token}`;
}

/** 从飞书 URL 提取文档 token */
export function extractTokenFromUrl(url: string): { token: string; type: 'doc' | 'sheet' | 'base' | 'unknown' } | null {
  // docx: https://bytedance.feishu.cn/docx/XXXXX
  const docMatch = url.match(/\/docx\/([A-Za-z0-9]+)/);
  if (docMatch) return { token: docMatch[1], type: 'doc' };

  // sheets: https://bytedance.feishu.cn/sheets/XXXXX
  const sheetMatch = url.match(/\/sheets\/([A-Za-z0-9]+)/);
  if (sheetMatch) return { token: sheetMatch[1], type: 'sheet' };

  // base: https://bytedance.feishu.cn/base/XXXXX
  const baseMatch = url.match(/\/base\/([A-Za-z0-9]+)/);
  if (baseMatch) return { token: baseMatch[1], type: 'base' };

  // wiki: https://bytedance.feishu.cn/wiki/XXXXX
  const wikiMatch = url.match(/\/wiki\/([A-Za-z0-9]+)/);
  if (wikiMatch) return { token: wikiMatch[1], type: 'doc' };

  // mindnote: https://bytedance.feishu.cn/mindnotes/XXXXX
  const mindMatch = url.match(/\/mindnotes\/([A-Za-z0-9]+)/);
  if (mindMatch) return { token: mindMatch[1], type: 'unknown' };

  return null;
}

/** 构建用于书写报告内容的 DocBlock */
export function buildTextBlock(content: string): DocBlock {
  return {
    block_type: 2,
    text: {
      elements: [{ text_run: { content } }],
    },
  };
}

export function buildHeading1Block(content: string): DocBlock {
  return {
    block_type: 3,
    heading1: {
      elements: [{ text_run: { content } }],
    },
  };
}

export function buildHeading2Block(content: string): DocBlock {
  return {
    block_type: 4,
    heading2: {
      elements: [{ text_run: { content } }],
    },
  };
}

export function buildHeading3Block(content: string): DocBlock {
  return {
    block_type: 5,
    heading3: {
      elements: [{ text_run: { content } }],
    },
  };
}

export function buildBulletBlock(content: string): DocBlock {
  return {
    block_type: 9,
    bullet: {
      elements: [{ text_run: { content } }],
    },
  };
}

export function buildDividerBlock(): DocBlock {
  return {
    block_type: 22,
    divider: {},
  };
}

export function buildOrderedBlock(content: string): DocBlock {
  return {
    block_type: 10,
    text: {
      elements: [{ text_run: { content } }],
    },
  };
}
