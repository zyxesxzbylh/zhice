// 执策 种子脚本
// 运行方式：npx tsx src/db/seed.ts

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "./index";

export async function seedDatabase() {
  console.log("数据库种子脚本已就绪，暂无预设数据。");
  console.log("用户数据将在使用过程中按需创建。");
}

async function main() {
  await seedDatabase();
  process.exit(0);
}

main().catch((e) => {
  console.error("初始化失败:", e);
  process.exit(1);
});
