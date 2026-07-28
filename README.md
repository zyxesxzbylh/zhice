# 执策 FlowSync

<p align="center">
  <img src="https://img.shields.io/badge/version-0.5.0-blue" alt="version">
  <img src="https://img.shields.io/badge/Next.js-15.3-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.1-06B6D4?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Electron-42-47848F?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/AI_Powered-🤖-8B5CF6" alt="AI Powered">
</p>

<p align="center">
  <b>下一代 AI 驱动的工作管理系统</b> — 三端一体（PC / 平板 / 手机）+ 桌面应用，深度融合 AI 智能体
</p>

---

## 产品定位

**FlowSync** 不是又一个待办清单。它是一个以 AI 智能体为核心的工作管理平台，帮助知识工作者：

- **管理任务** — 多项目、多层级、标签、优先级、甘特图
- **沉淀知识** — 任务关联知识库，让经验不丢失
- **复盘成长** — 周期性复盘 + 职业成长路径追踪
- **AI 赋能** — 智能体作为"专业效能教练"贯穿全流程

### AI 智能体人格：专业效能教练

| 特质 | 比重 | 表现 |
|------|------|------|
| 严谨 | 40% | 数据分析引用来源，建议有依据可追溯 |
| 亲切 | 30% | 语气温暖但不肉麻，认可用户努力 |
| 务实 | 20% | 复杂任务拆解为小步骤，给可执行的下一步 |
| 有洞察力 | 10% | 发现用户未注意到的模式并主动提醒 |

> [完整 AI 策略文档 →](docs/AI智能体产品策略文档.md)

---

## 功能矩阵

### 📋 任务管理
- 多项目 + 多层级子任务，无限嵌套拆解
- 四象限优先级 + 到期提醒 + 标签系统
- 批量操作（批量改状态/优先级/标签）
- 甘特图时间线、看板视图、列表视图
- 智能任务拆分（AI 辅助分解）
- 自然语言快速创建任务

### 🧠 知识库
- Markdown 编辑器，支持富文本
- 与具体任务关联，形成"任务→知识"链路
- AI 驱动的语义搜索和问答
- 飞书文档导入与同步
- 文件上传管理

### 📈 职业成长
- 个人 OKR 追踪与进度可视化
- 周期性复盘（日报/周报/里程碑回顾）
- 成长路径规划器
- 技能雷达图

### 🔧 方法库
- 可复用的 SOP 模板
- 项目管理方法模板
- 模板实例化功能

### 🤖 AI 智能体
- 任务优先级智能建议（多维度评分）
- 目标分析与拆解
- 知识库语义搜索与问答
- 自然语言文本一键生成项目
- 每日工作摘要生成
- AI 批量创建任务

### 🔗 飞书集成
- 飞书文档导入知识库
- 任务导出到飞书表格
- 复盘报告导出到飞书文档
- OAuth 2.0 企业自建应用对接

---

## 三端设计

设计遵循 **品牌统一、渐进增强、数据一致** 原则，深色主题 + 现代生产力工具风格。

| 端 | 场景 | 设计特点 |
|----|------|---------|
| **手机** | 通勤、碎片时间 | 底部 Tab 导航、单手操作、快速捕获 |
| **平板** | 阅读、轻办公 | 可折叠侧边栏、双列卡片、抽屉详情 |
| **PC** | 深度工作、规划 | 多栏布局、高密度信息、键盘快捷键 |

> [完整设计方案 →](docs/FlowSync-三端一体化设计方案.md)

---

## 技术架构

```
┌─────────────────────────────────────────────┐
│                 Electron 桌面壳              │
│  ┌───────────────────────────────────────┐  │
│  │            Next.js 15 (App Router)      │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│  │  │ 任务模块 │ │ 知识库  │ │ 成长模块 │  │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘  │  │
│  │       └───────────┼───────────┘        │  │
│  │              ┌────┴────┐               │  │
│  │              │ AI 智能体 │               │  │
│  │              └────┬────┘               │  │
│  │       ┌───────────┼───────────┐        │  │
│  │  ┌────┴────┐ ┌────┴────┐ ┌────┴────┐  │  │
│  │  │Supabase │ │DeepSeek │ │ 飞书API │  │  │
│  │  │PostgreSQL│ │   AI   │ │  集成   │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **框架** | Next.js 15 + React 19 | App Router，SSR/SSG |
| **语言** | TypeScript 5.8 | 全栈类型安全 |
| **样式** | Tailwind CSS 4.1 | 设计 Token 统一管理 |
| **数据库** | Supabase PostgreSQL | 托管数据库 + 认证 |
| **ORM** | Drizzle ORM | 类型安全，轻量 |
| **桌面** | Electron 42 | Windows/macOS/Linux 三平台 |
| **AI** | DeepSeek + HuggingFace Transformers | 云端推理 + 本地模型 |
| **状态管理** | Zustand | 轻量响应式状态 |
| **飞书** | 飞书开放平台 API | OAuth 2.0 企业自建应用 |

---

## 快速开始

### 前置条件

- Node.js >= 18
- PostgreSQL（或 Supabase 账号）
- DeepSeek API Key（AI 功能需要）
- 飞书企业自建应用（飞书集成需要）

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/flowsync.git
cd flowsync

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Supabase/DeepSeek/飞书配置

# 4. 初始化数据库
npm run db:push

# 5. 启动开发服务器
npm run dev
# 访问 http://localhost:3000
```

### 桌面应用开发

```bash
# 开发模式（Next.js + Electron 并行启动）
npm run electron:dev

# 构建桌面应用
npm run electron:build:win   # Windows
npm run electron:build:mac   # macOS
npm run electron:build:linux # Linux
```

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run db:push` | 推送 Drizzle schema 到数据库 |
| `npm run db:studio` | 打开 Drizzle Studio 管理数据 |
| `npm run lint` | ESLint 代码检查 |
| `npm run electron:dev` | Electron 桌面开发模式 |
| `npm run electron:build` | 构建桌面应用 |

---

## 项目结构

```
flowsync/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (auth)/             # 登录/注册页
│   │   ├── api/                # API Routes
│   │   │   ├── ai/             # AI 相关接口（优先级/拆分/目标分析）
│   │   │   ├── tasks/          # 任务 CRUD + 批量操作
│   │   │   ├── knowledge/      # 知识库 + AI 搜索/问答
│   │   │   ├── projects/       # 项目管理
│   │   │   ├── career/         # 职业成长
│   │   │   ├── feishu/         # 飞书集成
│   │   │   └── templates/      # 模板管理
│   │   ├── dashboard/          # 仪表盘
│   │   ├── tasks/              # 任务页面
│   │   ├── knowledge/          # 知识库页面
│   │   ├── projects/           # 项目页面
│   │   ├── career/             # 职业成长页面
│   │   └── settings/           # 设置页面
│   ├── components/             # 30+ React 组件
│   │   ├── GanttView.tsx       # 甘特图
│   │   ├── CommandPalette.tsx  # 命令面板 (⌘K)
│   │   ├── CareerRadar.tsx     # 技能雷达图
│   │   ├── AIBatchCreateModal.tsx  # AI 批量创建
│   │   └── ...
│   ├── lib/                    # 工具库
│   │   ├── theme/              # 设计 Token
│   │   ├── db.ts               # 数据库查询
│   │   └── auth.ts             # 认证逻辑
│   └── db/                     # 数据库 schema
├── docs/                       # 产品 & 设计文档
│   ├── AI智能体产品策略文档.md
│   ├── FlowSync-三端一体化设计方案.md
│   └── screenshots/            # 应用截图
├── electron/                   # Electron 主进程
│   ├── main.js
│   └── preload.js
├── public/                     # 静态资源
├── scripts/                    # 工具脚本
└── drizzle.config.ts           # Drizzle ORM 配置
```

---

## 产品文档

- [AI 智能体产品策略文档](docs/AI智能体产品策略文档.md) — AI 人格定义、行为边界、改进路线图
- [三端一体化设计方案](docs/FlowSync-三端一体化设计方案.md) — 手机/平板/PC UX/UI 方案
- 滴答清单融合设计方案 — 数据迁移与产品融合策略

---

## 亮点功能展示

### ⌨️ 命令面板 (⌘K)
快捷键盘操作，不用鼠标也能高效操作

### 📅 甘特图视图
任务时间线可视化，拖拽调整排期

### 🔍 AI 知识库问答
用自然语言搜索知识库，获得结构化回答

### ✍️ 自然语言创建任务
输入一段文字，AI 自动解析为结构化任务列表

### 📊 职业成长仪表盘
技能雷达图 + OKR 追踪 + 周期性复盘

---

## License

MIT

---

<p align="center">
  <sub>Built with ❤️ by 司辰团队</sub>
</p>
