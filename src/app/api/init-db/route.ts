import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { seedDatabase } from "@/db/seed";

const execPromise = promisify(exec);

export async function POST() {
  try {
    // 1. 执行 Drizzle 迁移
    const result = await execPromise("npx drizzle-kit migrate", {
      cwd: process.cwd(),
      timeout: 120000,
    });

    console.log("Drizzle migrate output:", result.stdout);
    if (result.stderr) {
      console.log("Drizzle migrate stderr:", result.stderr);
    }

    // 2. 插入默认数据
    await seedDatabase();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Database init error:", error);
    return NextResponse.json(
      { error: error.message || "数据库初始化失败" },
      { status: 500 }
    );
  }
}
