const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const APP_NAME = "司辰";
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

let mainWindow = null;
let serverProcess = null;
let serverPort = 3002;

/**
 * 启动 Next.js standalone 服务器
 * 生产环境：从 resources/server 启动
 * 开发环境：用户需先运行 next dev -p 3002
 */
function startServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // 开发环境：假设 next dev 已在 3002 端口运行
      console.log("[Electron] 开发模式，连接 http://127.0.0.1:3002");
      resolve();
      return;
    }

    // 生产环境：启动 standalone 服务器
    const serverDir = path.join(process.resourcesPath, "server");
    const serverPath = path.join(
      serverDir,
      "node_modules",
      "next",
      "dist",
      "bin",
      "next"
    );

    // 设置数据库路径到用户数据目录（打包后无法写入安装目录）
    const userDataPath = app.getPath("userData");
    const dbDir = path.join(userDataPath, "database");

    console.log("[Electron] 生产模式，启动 standalone 服务器...");
    console.log("[Electron] 服务器目录:", serverDir);
    console.log("[Electron] 数据库目录:", dbDir);

    serverProcess = spawn(
      process.execPath,
      [serverPath, "start", "-p", String(serverPort)],
      {
        cwd: serverDir,
        env: {
          ...process.env,
          PORT: String(serverPort),
          HOSTNAME: "127.0.0.1",
          NODE_ENV: "production",
          // 让 Prisma 使用用户数据目录存放数据库
          DATABASE_URL: `file:${path.join(dbDir, "dev.db")}`,
          PRISMA_DB_PATH: dbDir,
        },
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    serverProcess.stdout.on("data", (data) => {
      const msg = data.toString();
      console.log("[Server]", msg.trim());
      // Next.js standalone 启动成功标志
      if (msg.includes("Ready") || msg.includes("started") || msg.includes("Listening")) {
        resolve();
      }
    });

    serverProcess.stderr.on("data", (data) => {
      const msg = data.toString();
      console.error("[Server]", msg.trim());
      // 某些版本 Next.js 在 stderr 输出 ready 信息
      if (msg.includes("Ready") || msg.includes("started") || msg.includes("Listening")) {
        resolve();
      }
    });

    serverProcess.on("error", (err) => {
      console.error("[Electron] 服务器启动失败:", err);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      console.log("[Electron] 服务器进程退出，代码:", code);
      serverProcess = null;
    });

    // 超时保护：30 秒后无论是否 ready 都继续
    setTimeout(resolve, 30000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: "#0f172a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
  });

  // 自定义菜单
  const menuTemplate = [
    {
      label: "编辑",
      submenu: [
        { label: "撤销", role: "undo" },
        { label: "重做", role: "redo" },
        { type: "separator" },
        { label: "剪切", role: "cut" },
        { label: "复制", role: "copy" },
        { label: "粘贴", role: "paste" },
        { label: "全选", role: "selectAll" },
      ],
    },
    {
      label: "视图",
      submenu: [
        { label: "放大", role: "zoomIn" },
        { label: "缩小", role: "zoomOut" },
        { label: "重置缩放", role: "resetZoom" },
        { type: "separator" },
        { label: "全屏", role: "togglefullscreen" },
        { type: "separator" },
        ...(isDev
          ? [{ label: "开发者工具", role: "toggleDevTools" }]
          : []),
      ],
    },
    {
      label: "窗口",
      submenu: [
        { label: "最小化", role: "minimize" },
        { label: "关闭", role: "close" },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

  // 窗口准备好后再显示，避免白闪
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // 加载应用
  mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);

  // 外部链接在系统浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 应用启动
app.whenReady().then(async () => {
  try {
    await startServer();
  } catch (err) {
    console.error("[Electron] 服务器启动失败:", err);
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出
app.on("window-all-closed", () => {
  killServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// 应用退出前清理
app.on("before-quit", () => {
  killServer();
});

function killServer() {
  if (serverProcess) {
    console.log("[Electron] 关闭服务器进程...");
    serverProcess.kill();
    serverProcess = null;
  }
}
