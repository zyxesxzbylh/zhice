/**
 * Electron 打包构建脚本
 * 将 Next.js standalone 输出组装成 Electron 可用的目录结构
 *
 * 输出结构：
 * dist-electron/
 *   ├── server/              ← .next/standalone/ 的内容
 *   │   ├── .next/
 *   │   │   └── static/      ← 从 .next/static/ 复制
 *   │   ├── public/           ← 从 public/ 复制
 *   │   ├── prisma/           ← 从 prisma/ 复制
 *   │   └── ...
 *   └── electron/             ← electron 源码
 *       ├── main.js
 *       └── preload.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname);
const STANDALONE_DIR = path.join(ROOT, ".next", "standalone");
const STATIC_DIR = path.join(ROOT, ".next", "static");
const PUBLIC_DIR = path.join(ROOT, "public");
const PRISMA_DIR = path.join(ROOT, "prisma");
const ELECTRON_DIR = path.join(ROOT, "electron");
const DIST_DIR = path.join(ROOT, "dist-electron");

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  ⚠ 源目录不存在，跳过: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  console.log("\n🚀 开始 Electron 打包构建...\n");

  // 1. 检查 standalone 输出是否存在
  if (!fs.existsSync(STANDALONE_DIR)) {
    console.error("❌ 未找到 .next/standalone 目录，请先运行 next build");
    process.exit(1);
  }

  // 2. 清理旧的 dist-electron 目录
  if (fs.existsSync(DIST_DIR)) {
    console.log("🗑 清理旧的 dist-electron 目录...");
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  // 3. 复制 standalone 输出到 dist-electron/server
  const serverDir = path.join(DIST_DIR, "server");
  console.log("📦 复制 standalone 输出...");
  copyDirSync(STANDALONE_DIR, serverDir);

  // 4. 复制 .next/static 到 server/.next/static
  console.log("📦 复制静态资源 (.next/static)...");
  copyDirSync(STATIC_DIR, path.join(serverDir, ".next", "static"));

  // 5. 复制 public 目录
  console.log("📦 复制 public 目录...");
  copyDirSync(PUBLIC_DIR, path.join(serverDir, "public"));

  // 6. 复制 prisma 目录
  console.log("📦 复制 prisma 目录...");
  copyDirSync(PRISMA_DIR, path.join(serverDir, "prisma"));

  // 7. 复制 electron 源码
  console.log("📦 复制 electron 源码...");
  copyDirSync(ELECTRON_DIR, path.join(DIST_DIR, "electron"));

  // 8. 复制 package.json 到 dist-electron 根目录（electron-builder 需要）
  const pkg = require(path.join(ROOT, "package.json"));
  // 只保留 electron-builder 需要的字段
  const electronPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description || "",
    main: "electron/main.js",
    scripts: {
      electron: "electron .",
    },
    build: pkg.build,
  };
  fs.writeFileSync(
    path.join(DIST_DIR, "package.json"),
    JSON.stringify(electronPkg, null, 2)
  );

  console.log("\n✅ 构建完成！输出目录: dist-electron/");
  console.log("   运行 electron-builder 进行打包...\n");
}

main();
