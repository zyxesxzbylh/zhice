// POST /api/knowledge/ask
// 知识库 RAG 问答接口

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { askKnowledgeBase } from "@/lib/rag";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const body = await request.json();
    const question = body.question;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "问题不能为空" },
        { status: 400 }
      );
    }

    const result = await askKnowledgeBase(session.userId, question.trim());

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "未登录") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    console.error("RAG 问答失败:", error);

    return NextResponse.json(
      {
        error: "知识库问答服务暂不可用，请稍后重试。",
        detail: process.env.NODE_ENV === "development"
          ? String(error)
          : undefined,
      },
      { status: 500 }
    );
  }
}
