import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, projects } from "@/db/schema";
import { ilike, eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  try {
    const rows = await db
      .select({
        task: tasks,
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(ilike(tasks.title, `%${query}%`))
      .orderBy(desc(tasks.createdAt))
      .limit(10);

    const result = rows.map((row) => ({
      id: row.task.id,
      title: row.task.title,
      project: row.projectName || null,
      status: row.task.status,
      dueDate: row.task.dueDate,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
