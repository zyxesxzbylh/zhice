import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { knowledgeEntries } from "@/db/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES: Record<string, { category: string; readable: boolean }> = {
  // 文档类 — 可提取文本
  "text/plain": { category: "reference", readable: true },
  "text/markdown": { category: "reference", readable: true },
  "text/csv": { category: "reference", readable: true },
  "application/json": { category: "reference", readable: true },
  "application/pdf": { category: "reference", readable: false },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { category: "reference", readable: false },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { category: "reference", readable: false },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { category: "reference", readable: false },
  "application/vnd.ms-excel": { category: "reference", readable: false },
  "application/vnd.ms-powerpoint": { category: "reference", readable: false },
  "application/msword": { category: "reference", readable: false },
  // 图片类
  "image/png": { category: "reference", readable: false },
  "image/jpeg": { category: "reference", readable: false },
  "image/gif": { category: "reference", readable: false },
  "image/webp": { category: "reference", readable: false },
  "image/svg+xml": { category: "reference", readable: true },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as string) || "reference";

    if (!file) {
      return NextResponse.json({ error: "未上传文件" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件过大，最大支持 ${formatFileSize(MAX_FILE_SIZE)}` },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";
    const typeInfo = ALLOWED_TYPES[mimeType];

    if (!typeInfo) {
      return NextResponse.json(
        { error: `不支持的文件类型: ${mimeType}` },
        { status: 400 }
      );
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());
    let content = "";

    if (typeInfo.readable) {
      content = buffer.toString("utf-8").slice(0, 50000); // 最多存 50KB 文本
    }

    // 保存文件到本地
    const uploadDir = path.join(process.cwd(), "public", "uploads", session.userId);
    await mkdir(uploadDir, { recursive: true });

    const timestamp = Date.now();
    const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    await writeFile(filePath, buffer);

    const ext = getExtension(file.name);
    const iconMap: Record<string, string> = {
      ".pdf": "pdf",
      ".docx": "docx",
      ".doc": "doc",
      ".pptx": "pptx",
      ".ppt": "ppt",
      ".xlsx": "xlsx",
      ".xls": "xls",
      ".txt": "txt",
      ".md": "md",
      ".csv": "csv",
      ".json": "json",
      ".png": "image",
      ".jpg": "image",
      ".jpeg": "image",
      ".gif": "image",
      ".webp": "image",
      ".svg": "svg",
    };

    const sourceType = iconMap[ext] || "file";

    // 创建知识库条目
    const [entry] = await db
      .insert(knowledgeEntries)
      .values({
        userId: session.userId,
        title: file.name,
        content: content || `[文件: ${file.name}] (${formatFileSize(file.size)}, ${mimeType})`,
        category: typeInfo.category,
        sourceType: sourceType,
        sourceName: file.name,
        tags: JSON.stringify([sourceType, `size:${formatFileSize(file.size)}`]),
      })
      .returning();

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        title: entry.title,
        content: content ? content.slice(0, 200) + (content.length > 200 ? "..." : "") : `[${mimeType} 文件]`,
        category: entry.category,
        sourceType: entry.sourceType,
        fileUrl: `/uploads/${session.userId}/${safeName}`,
        fileSize: formatFileSize(file.size),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("文件上传失败:", error);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
