// GET /api/knowledge/search
// 知识库搜索接口（聚合多数据源，简单关键词匹配）

import { NextResponse } from "next/server";
import { eq, and, sql, like, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, projects, retrospectives, knowledgeEntries } from "@/db/schema";
import { METHOD_LIBRARY } from "@/lib/methods/library";
import { getPDFKnowledgeBase } from "@/lib/knowledge/pdfImport";

export interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  category: string;
  date: string;
  tags: string[];
}

export interface SearchResponse {
  results: SearchResultItem[];
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const categoryFilter = searchParams.get("category") || "all";

    if (!q.trim()) {
      return NextResponse.json({ results: [] });
    }

    const trimmedQuery = q.trim();
    const likePattern = `%${trimmedQuery}%`;
    const results: SearchResultItem[] = [];

    // 1. 搜索 tasks（valueDescription, expectedOutcome, title）
    if (categoryFilter === "all" || categoryFilter === "task") {
      try {
        const taskRows = await db
          .select({
            id: tasks.id,
            title: tasks.title,
            valueDescription: tasks.valueDescription,
            expectedOutcome: tasks.expectedOutcome,
            status: tasks.status,
            createdAt: tasks.createdAt,
          })
          .from(tasks)
          .leftJoin(projects, eq(tasks.projectId, projects.id))
          .where(
            and(
              eq(projects.userId, session.userId),
              or(
                like(tasks.title, likePattern),
                like(tasks.valueDescription || "", likePattern),
                like(tasks.expectedOutcome || "", likePattern)
              )
            )
          )
          .orderBy(sql`${tasks.createdAt} DESC`)
          .limit(20);

        for (const t of taskRows) {
          results.push({
            id: `task-${t.id}`,
            title: t.title,
            excerpt: t.valueDescription || t.expectedOutcome || "",
            source: "任务中心",
            category: "task",
            date: t.createdAt ? new Date(t.createdAt).toISOString() : "",
            tags: t.status ? [t.status] : [],
          });
        }
      } catch (e) {
        console.warn("搜索 tasks 失败:", e);
      }
    }

    // 2. 搜索 retrospectives（insights, trendAnalysis, biggestWin, biggestChallenge, lessonLearned）
    if (categoryFilter === "all" || categoryFilter === "retrospective") {
      try {
        const retroRows = await db
          .select({
            id: retrospectives.id,
            date: retrospectives.date,
            biggestWin: retrospectives.biggestWin,
            biggestChallenge: retrospectives.biggestChallenge,
            lessonLearned: retrospectives.lessonLearned,
            newInsight: retrospectives.newInsight,
            trendAnalysis: retrospectives.trendAnalysis,
            skillUsed: retrospectives.skillUsed,
            createdAt: retrospectives.createdAt,
          })
          .from(retrospectives)
          .where(
            and(
              eq(retrospectives.userId, session.userId),
              or(
                like(retrospectives.biggestWin || "", likePattern),
                like(retrospectives.biggestChallenge || "", likePattern),
                like(retrospectives.lessonLearned || "", likePattern),
                like(retrospectives.newInsight || "", likePattern),
                like(retrospectives.trendAnalysis || "", likePattern)
              )
            )
          )
          .orderBy(sql`${retrospectives.date} DESC`)
          .limit(20);

        for (const r of retroRows) {
          const excerpt =
            r.lessonLearned || r.newInsight || r.biggestWin || r.biggestChallenge || "";
          const tags: string[] = [];
          if (r.skillUsed) {
            try {
              const parsed = JSON.parse(r.skillUsed);
              if (Array.isArray(parsed)) tags.push(...parsed.map(String));
            } catch {
              r.skillUsed
                .split(/[,，]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .forEach((s) => tags.push(s));
            }
          }
          results.push({
            id: `retro-${r.id}`,
            title: `复盘 (${r.date})`,
            excerpt,
            source: "复盘记录",
            category: "retrospective",
            date: r.date || (r.createdAt ? new Date(r.createdAt).toISOString() : ""),
            tags,
          });
        }
      } catch (e) {
        console.warn("搜索 retrospectives 失败:", e);
      }
    }

    // 3. 搜索 projects（name, description）
    if (categoryFilter === "all" || categoryFilter === "project") {
      try {
        const projectRows = await db
          .select({
            id: projects.id,
            name: projects.name,
            description: projects.description,
            createdAt: projects.createdAt,
          })
          .from(projects)
          .where(
            and(
              eq(projects.userId, session.userId),
              or(
                like(projects.name, likePattern),
                like(projects.description || "", likePattern)
              )
            )
          )
          .orderBy(sql`${projects.createdAt} DESC`)
          .limit(20);

        for (const p of projectRows) {
          results.push({
            id: `project-${p.id}`,
            title: p.name,
            excerpt: p.description || "",
            source: "项目管理",
            category: "project",
            date: p.createdAt ? new Date(p.createdAt).toISOString() : "",
            tags: [],
          });
        }
      } catch (e) {
        console.warn("搜索 projects 失败:", e);
      }
    }

    // 4. 搜索知识库表 knowledgeEntries
    if (categoryFilter === "all" || ["insight", "method", "decision", "sop", "template"].includes(categoryFilter)) {
      try {
        const keRows = await db
          .select({
            id: knowledgeEntries.id,
            title: knowledgeEntries.title,
            summary: knowledgeEntries.summary,
            content: knowledgeEntries.content,
            category: knowledgeEntries.category,
            sourceName: knowledgeEntries.sourceName,
            createdAt: knowledgeEntries.createdAt,
            tags: knowledgeEntries.tags,
          })
          .from(knowledgeEntries)
          .where(
            and(
              eq(knowledgeEntries.userId, session.userId),
              eq(knowledgeEntries.isArchived, false),
              or(
                like(knowledgeEntries.title, likePattern),
                like(knowledgeEntries.summary || "", likePattern),
                like(knowledgeEntries.content, likePattern)
              ),
              categoryFilter !== "all" && categoryFilter !== "task" && categoryFilter !== "project" && categoryFilter !== "retrospective" && categoryFilter !== "pdf"
                ? sql`${knowledgeEntries.category} = ${categoryFilter}`
                : undefined
            )
          )
          .orderBy(sql`${knowledgeEntries.createdAt} DESC`)
          .limit(30);

        for (const k of keRows) {
          results.push({
            id: `ke-${k.id}`,
            title: k.title,
            excerpt: k.summary || k.content.slice(0, 200),
            source: k.sourceName || "知识库",
            category: k.category,
            date: k.createdAt ? new Date(k.createdAt).toISOString() : "",
            tags: Array.isArray(k.tags) ? k.tags : (typeof k.tags === 'string' ? [k.tags] : []),
          });
        }
      } catch (e) {
        console.warn("搜索 knowledgeEntries 失败:", e);
      }
    }

    // 5. 搜索方法库（静态数据）
    if (categoryFilter === "all" || categoryFilter === "method") {
      for (const method of METHOD_LIBRARY) {
        const haystack = `${method.name} ${method.description} ${method.steps.join(" ")} ${method.applicableScenarios.join(" ")}`;
        if (haystack.toLowerCase().includes(trimmedQuery.toLowerCase())) {
          results.push({
            id: `method-${method.id}`,
            title: method.name,
            excerpt: method.description,
            source: "方法库",
            category: "method",
            date: "",
            tags: method.applicableScenarios,
          });
        }
      }
    }

    // 6. 搜索 PDF 知识库（静态元数据）
    if (categoryFilter === "all" || categoryFilter === "pdf") {
      try {
        const pdfItems = getPDFKnowledgeBase();
        for (const item of pdfItems) {
          const haystack = `${item.title} ${item.excerpt} ${item.tags.join(" ")}`;
          if (haystack.toLowerCase().includes(trimmedQuery.toLowerCase())) {
            results.push({
              id: item.id,
              title: item.title,
              excerpt: item.excerpt,
              source: item.source,
              category: "pdf",
              date: item.date,
              tags: item.tags,
            });
          }
        }
      } catch (e) {
        console.warn("搜索 PDF 知识库失败:", e);
      }
    }

    // 去重（按 id）
    const seen = new Set<string>();
    const uniqueResults = results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return NextResponse.json({ results: uniqueResults });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    console.error("知识库搜索失败:", error);
    return NextResponse.json(
      {
        error: "搜索服务暂不可用，请稍后重试",
        detail: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
