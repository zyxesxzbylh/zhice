import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks } from "@/db/schema";
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
        project: projects,
        task: tasks,
      })
      .from(projects)
      .leftJoin(tasks, eq(tasks.projectId, projects.id))
      .where(ilike(projects.name, `%${query}%`))
      .orderBy(desc(projects.createdAt))
      .limit(10);

    const projectMap = new Map<
      string,
      {
        id: string;
        name: string;
        description: string | null;
        taskCount: number;
        completedCount: number;
      }
    >();

    for (const row of rows) {
      const p = row.project;
      if (!projectMap.has(p.id)) {
        projectMap.set(p.id, {
          id: p.id,
          name: p.name,
          description: p.description,
          taskCount: 0,
          completedCount: 0,
        });
      }
      const entry = projectMap.get(p.id)!;
      if (row.task) {
        entry.taskCount++;
        if (row.task.status === "done") {
          entry.completedCount++;
        }
      }
    }

    const result = Array.from(projectMap.values());

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
