# 司辰 (FlowSync) 产品视角诊断报告

> 2026-06-21 · 基于 `D:\工作管理\flowsync` 当前代码
> 视角:独立开发者 + 真实使用场景(不是代码审美的角度)
> 评级:**P0**(必须修) / **P1**(影响日常使用) / **P2**(该修) / **P3**(打磨)

---

## 0. TL;DR — 11 个最值得马上动手的

| # | 问题 | 位置 | 评级 |
|---|---|---|---|
| 1 | `requireAuth` 自动给"guest"用户登录,所有数据混在同一个 userId 下 | `src/lib/auth.ts:59-65` | **P0** |
| 2 | 登录/注册页是死链:`/login` / `/register` 直接 redirect 到 `/dashboard` | `src/app/(auth)/login/page.tsx:3-4` | **P0** |
| 3 | `Task.isSop` 是用 `project.description.startsWith("SOP工作流")` 反推的 | `src/app/api/tasks/route.ts:34` | **P0** |
| 4 | `TaskSplitModal` 把子任务 `projectId: null`,子任务脱离项目 | `src/components/TaskSplitModal.tsx:60-65` | **P0** |
| 5 | `priority` 在三处是三种不同类型(1\|2\|3 / 字符串 / 高\|中\|低),`urgent` 没有映射 | `TaskContext.tsx:61`, `tasks/page.tsx:23`, `lib/types.ts:11` | **P0** |
| 6 | `GET /api/tasks` 没分页,1 万任务会一次拉几十 MB | `src/app/api/tasks/route.ts:21` | **P1** |
| 7 | `/settings` 的主题/通知/自动保存全是 local state,刷新就丢 | `src/app/settings/page.tsx:8-10` | **P1** |
| 8 | `/dashboard` 的 trend "较上月 +12%" 是写死假数据 | `src/app/dashboard/page.tsx:243, 258` | **P1** |
| 9 | 新用户开 app → 看到"数据库连接失败"页 + 初始化按钮,**没有任何 onboarding** | `src/app/dashboard/page.tsx:151-184` | **P1** |
| 10 | 通知/任务各自 30s/60s 轮询,**没共享,等于双倍请求** | `NotificationBell.tsx:27`, `TaskContext.tsx:107` | **P2** |
| 11 | Tasks 视图**找不到"新建任务"入口** | `src/app/tasks/page.tsx`(整文件) | **P1** |

---

## 1. P0 — 必须修(数据错乱 / 核心流程断裂)

### 1.1 `requireAuth` 默认登入 "guest_default_user"
**文件**:`src/lib/auth.ts:59-65`

```ts
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    await ensureGuestUser();
    return { userId: GUEST_USER_ID, email: "default@local" };
  }
  return session;
}
```

**产品影响**:
- 任何用户都能直接访问所有 API,不需要任何凭证。
- 所有用户数据写到同一个 userId (`guest_default_user`) 下,跨用户隔离不存在。
- 如果部署到公网(即便是局域网),任何人都能看见/改/删你的项目。
- **这跟 Electron 单机场景刚好**——但跟"PC 端应用"的自我定位(用户有账号、密码)冲突。

**修法建议**:
- 区分 `getSession()`(只读)和 `requireAuth()`(强制登录)。
- `requireAuth()` 没 token 时抛 `401` 而不是创建 guest。
- 单机模式可以加一个"本地模式"开关,在 Electron 里走 guest,在 Web 走真 auth。

### 1.2 `/login` / `/register` 是死链
**文件**:`src/app/(auth)/login/page.tsx:3-4`, `register/page.tsx:3-4`

```ts
export default function LoginPage() {
  redirect("/dashboard");
}
```

**产品影响**:
- `/api/auth/login` 和 `/api/auth/register` 真实存在,但前端没任何 UI 调它。
- 用户从任何"登录"链接进入 → 直接跳 dashboard,**完全没有任何反馈**。
- Settings 页没有"登出"按钮 —— **登录进去就退不出**(改 token 也不知道怎么改)。

**修法建议**:
- 写真实登录/注册页(用刚才 DELIVERABLES.md 里 Button/Input 等原子组件)。
- SidebarNav 加"账号"菜单 + 登出。

### 1.3 `isSop` 字段是用 project.description 字符串前缀反推
**文件**:`src/app/api/tasks/route.ts:30-38`

```ts
return NextResponse.json(tasks.map(t => {
  const { project, tags, ...rest } = t;
  return {
    ...rest,
    isSop: project?.description?.startsWith("SOP工作流") || false,
    ...
  };
}));
```

**产品影响**:
- **任务是不是 SOP,完全取决于项目描述是否以"SOP工作流"开头**。
- 用户在项目编辑页把描述改一下,所有任务的"SOP"标识就翻转。
- 真有 SOP 工作流场景(空降的`templates` 表+ `flowInstance`)反而没用,UI 误判率高。

**修法建议**:
- Task 加布尔列 `isSop`(或在 Project 加 `kind: "sop" | "regular"`),由创建 SOP 项目时显式标记,不再用字符串嗅探。
- 或者前端直接用 `project.flowTemplateId != null` 判断。

### 1.4 TaskSplitModal 写子任务时 `projectId: null`
**文件**:`src/components/TaskSplitModal.tsx:55-66`

```ts
for (const title of subtasks) {
  await fetch("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      projectId: null,           // ← BUG
      parentTaskId: taskId,
      title: title.trim(),
      ...
    }),
  });
}
```

**产品影响**:
- 父任务在项目 A,AI 拆出的 5 个子任务跑到 `projectId = null`。
- 后端 `POST /api/tasks` 第 66-71 行校验 `if (!projectId) return 400`,**实际上根本创建不成功** —— 用户看到"已添加 5 个子任务"的 toast,但数据库一条都没写。
- 即使绕过校验(传个假 projectId),子任务也脱离了父任务的项目,统计、过滤、模板应用全部错位。

**修法建议**:
- 从 `selectedTask` 拿 `projectId` 传进去(`onTaskSplit` 已经拿到任务对象,补一个 prop)。
- 后端 POST `/api/tasks` 把 `projectId: null` 的场景单独支持为"全局任务"或禁止。

### 1.5 `priority` 在 3 处是 3 种类型
- `src/lib/types.ts:11`:`export type TaskPriority = "urgent" | "high" | "medium" | "low"`
- `src/app/tasks/page.tsx:23`: `priority: 1 | 2 | 3`
- `src/components/TaskCard.tsx:16`: `priority: 1 | 2 | 3`
- `src/components/TaskContext.tsx:61`: `priority: (t.priority === "high" ? 1 : t.priority === "low" ? 3 : 2) as 1 | 2 | 3`

**问题 1**:`urgent` 完全没有映射 —— DB 里能存 `urgent`,前端拿到后落到 `: 2` (medium),UI 跟实际不一致。
**问题 2**:`TaskCard` 第 44-45 行 `priority === 1 ? high : priority === 2 ? medium : low` —— `1` = high / `2` = medium / `3` = low,跟其它地方 `1` 假设"高优先级"又不一致。
**问题 3**:`/dashboard` 第 28 行 `priority: "low" | "medium" | "high" | "urgent"` —— 又是字符串,跟 Card 又是两套。

**产品影响**:
- 拖一个 urgent 任务到看板,UI 看着是"中"。
- 进度统计漏算 urgent。
- 任何跨组件数据流转都有几率跳变。

**修法建议**:
- 统一成 `TaskPriority = "urgent" | "high" | "medium" | "low"`(已经是 types.ts 的定义)。
- 删除 `1 | 2 | 3` 数字版本,所有组件 import `@/lib/types`。
- 如果非要存数字,只在一处转换,且 **urgent 必须有 mapping**(用 0 或 1)。

### 1.6 (顺接) Tasks API 里的 `parentTaskId !== null` 判断反了
**文件**:`src/app/api/tasks/route.ts:17-19`

```ts
if (parentTaskId !== null) {     // ← query string 没传时 parentTaskId 就是 null
  where.parentTaskId = parentTaskId || null;  // 永远会进
}
```

**产品影响**:
- `GET /api/tasks` 永远只返回根任务,子任务完全拿不到。
- `/tasks` 视图的"展开子任务"功能其实拉不到数据。

**修法**:`if (parentTaskId !== null) { where.parentTaskId = parentTaskId; }`(去掉 `!== null`,或用 `searchParams.has("parentTaskId")`)。

---

## 2. P1 — 影响日常使用

### 2.1 任务视图没"新建任务"按钮
**文件**:`src/app/tasks/page.tsx`

整个文件 1839 行,header 区域有"今日总结 / AI 拆分 / 悬浮视图 / 视图切换 / 时间范围"按钮,**但没有"新建任务"**。用户进 `/tasks` 看到一堆任务,想加一条,找不到入口。

- 现状路径:必须先开项目 → 进 `/projects/[id]` → 找子表单。
- 这对一个任务管理应用是反常识的。

**修法建议**:header 加"新建任务"按钮 → 弹 `Modal` 表单(选项目、标题、优先级、日期、reminder)。

### 2.2 `/api/tasks` 无分页 / 过滤
**文件**:`src/app/api/tasks/route.ts:5-46`

- `prisma.task.findMany({ where, include: { project, tags: { include: { tag } } } })` —— 一次全拉。
- 50 任务:几 KB,没感觉;1 万任务:几十 MB JSON,**Electron 桌面 + 笔记本直接卡死**。
- 客户端 `useTasks` 把所有任务塞进 `useState`,`tasks/page.tsx` 5 个 view 都基于 `tasks` 过滤重渲染,O(N) × 视图数。

**修法建议**:
- API 加 `?limit=100&offset=0&status=&projectId=&parentTaskId=`。
- 客户端分页(用 `useInfiniteQuery` / 自写 `useCursor`)。
- 至少加 `select` 字段裁剪,不返回 `description`(长文本)做列表渲染。

### 2.3 Settings 全是 local state
**文件**:`src/app/settings/page.tsx:8-10`

```ts
const [theme, setTheme] = useState<"light" | "dark">("light");
const [notifications, setNotifications] = useState(true);
const [autoSave, setAutoSave] = useState(true);
```

- 点"深色"不会切主题(没接 CSS / next-themes)。
- "启用通知"开关没接 `NotificationBell` 的 `enableNotifications`(`UserSettings.enableNotifications` 字段在 Prisma 有,前端没用)。
- "自动保存"没接任何东西。
- 刷新就丢。

**修法建议**:
- 接 `UserSettings` API,`PUT /api/user-settings` 改库。
- 主题用 `data-theme` attribute + globals.css 变量,真正能切。

### 2.4 Dashboard 假数据 trend
**文件**:`src/app/dashboard/page.tsx:243, 258`

```ts
<EnhancedStatsCard
  title="全部项目"
  trend={{ value: 12, positive: true, label: "较上月" }}    // 写死
<EnhancedStatsCard
  title="完成率"
  trend={{ value: 8, positive: true, label: "较上周" }}     // 写死
```

每个项目都显示"较上月 +12%",**完全没用,反而误导**。

**修法**:要么接真实 SQL 聚合(`prisma` groupBy createdAt month),要么删掉 trend。

### 2.5 新用户 onboarding 缺失
**文件**:`src/app/dashboard/page.tsx:151-184`

新用户进来看到**大红色"数据库未初始化"** 页面,只有个"初始化数据库"按钮。没有任何:
- 欢迎语 / 介绍这个产品是干嘛的
- 一键创建示例项目
- 功能 tour
- 帮助链接

**产品影响**:独立开发者公开分发时,用户 3 秒内就卸载。

**修法建议**:
- `prisma/seed.ts` 加合理种子数据(2 个项目、10 个任务、3 个 tag)。
- 启动时检测空库,自动 seed 而不是显示"未初始化"页。
- 首次访问显示"欢迎使用司辰" onboarding。

### 2.6 `/api/auth/logout` 路由有,但 UI 没入口
**文件**:`src/app/api/auth/logout/route.ts`(有);SidebarNav / settings(无)

**修法**:在 SidebarNav 底部加账号菜单(头像 + 下拉 = 个人资料 / 设置 / 登出)。

### 2.7 `window.location.href = "/..."` 全页跳转
**文件**:`projects/page.tsx:123, 160, 222`, `projects/new/page.tsx:66`

- 不用 Next.js 的 `Link`,每次都触发完整 SSR 重渲染。
- 项目页改用 `router.push()` 或 `<Link>`。
- 同样在 dashboard 的"查看项目"按钮(`onClick={() => router.push(...)}` 是对的,projects/page 用 `window.location.href` 是错的)。

### 2.8 FloatingView 全局悬浮遮挡交互
**文件**:`src/app/tasks/page.tsx:1829`

```ts
{showFloatingView && (
  <FloatingView ... />
)}
```

- "悬浮视图"开关在 `tasks/page.tsx`,但 `FloatingView` 本身在所有页面都可能跑(没有 `if path === /tasks` 之类的判断)。
- 跟 TagFilter / BatchActions / Modal 同屏时,层级会冲突(`zIndex` 没规划好)。

**修法**:
- 把 FloatingView 的 `zIndex` 拉到 modal(500)以下、tooltip(700)以下,或者只让它在 tasks 路由挂载。

### 2.9 `EnhancedStatsCard` 不存在的功能
**文件**:`src/components/EnhancedStatsCard.tsx`

我没读全文,但 dashboard 用 `trend={{ value: 12, positive: true, label: "较上月" }}` 这种 prop 形式传进去,**说明组件支持 trend 显示**,但因为值写死,等于"画了个空饼"。

### 2.10 `tasks/page.tsx` 顶部搜索框没用 `useDebouncedValue`
**文件**:`src/app/tasks/page.tsx:96`

`searchQuery` 直接进 `useMemo` 过滤。`useDebouncedValue` 已经在 `src/lib/hooks.ts` 里有现成,**没用**。

**修法**:`const debouncedSearch = useDebouncedValue(searchQuery, 150);`,过滤用 debouncedSearch。

---

## 3. P2 — 该修的体验问题

### 3.1 通知/任务轮询没共享
- `NotificationBell.tsx:27`:`setInterval(fetchNotifications, 30000)` —— 30s
- `TaskContext.tsx:107`:`setInterval(() => fetchTasks(), 60000)` —— 60s

两个组件各自起一个 interval。在 dashboard(同时有铃铛 + 任务列表)就是双倍请求。

**修法**:抽到顶层 Provider 的 `useStaleRevalidate`(SWR 模式),共享 fetch 状态。

### 3.2 `EnhancedStatsCard` "任务总数" subtitle 算两次
**文件**:`src/app/dashboard/page.tsx:248`

```ts
<EnhancedStatsCard
  subtitle={`${tasks.filter(t => t.status === "done").length} 个已完成`}  // 第 248 行
  ...
<EnhancedStatsCard
  value={`${completionRate}%`}  // 第 253 行,completionRate 内部又算一次 filter
```

- 抽到 `const doneCount = ...` 复用。

### 3.3 `/templates` 用 `confirm()` 浏览器弹窗
**文件**:`src/app/templates/page.tsx:42`

```ts
if (!confirm(`确定要删除模板「${name}」吗？...`)) return;
```

跟产品视觉脱节。换成基于 `Modal` 的确认对话框(刚才 DELIVERABLES.md 加了 `Modal` 原子组件)。

### 3.4 `prisma/seed.ts` 是否有合理种子数据未知
未读取。如果有 → OK;如果没有 → 新用户空白。

### 3.5 多个页面 `error.tsx` 缺失
只有 `tasks/error.tsx`,核心路径 `dashboard/`, `projects/[id]/`, `templates/[id]/edit/` 都没 error boundary,500 白屏。

### 3.6 表单无 autocomplete / autofocus
- login、register、new project、new task 表单都没 `autoComplete="email"` 等。**浏览器密码管理器不工作**。

### 3.7 `confirm()` 之外,多处 `alert()` / `prompt()` 残留
没在本次扫到,但搜索源码可能有。

### 3.8 移动端体验差
- `MobileNav.tsx` 存在,但只在 `< 768px` 显示
- TaskView / KanbanView / GanttView / TimelineView 都是 PC 设计,移动端不可用
- **产品定位是"PC 端应用"**(用户原话),但做 Electron 桌面是单平台。

**修法**:产品页脚加个"PC 端应用,推荐桌面使用"的提示,或干脆不投入 mobile 工作。

### 3.9 `FloatingView` 跟 Modal / Popover 层级混乱
- Modal 的 zIndex = 500 (在 `tokens.ts` 里)
- FloatingView 没有用 token 调层级,直接 `position: fixed`,容易跟其他覆盖物打架。

### 3.10 缺失 favicon
`layout.tsx` 引用了 `manifest.json`,但没看到 `favicon.ico` / `app/icon.png` 在 layout 里显式声明。Electron 桌面应用打包后窗口图标是默认 Electron logo。

### 3.11 密码没强度校验
**文件**:`src/app/api/auth/register/route.ts:16-21`

只校验 `>= 6 位`,没要求大小写/数字/符号。短密码易破解。

### 3.12 没 rate limit / 没防爆破
登录/注册 API 完全没限流,**暴力破解门槛 = 0**。

### 3.13 "删除项目"确认 modal 不能 Esc 关闭
**文件**:`projects/page.tsx:241-276`

手写 div 实现,**没键盘支持**(Esc / 焦点陷阱)。无障碍差。

### 3.14 `ProjectsPage` 项目卡片没"编辑"入口
只有删除。**用户改项目名 / 描述 / 截止日期,找不到入口** —— 实际是进项目详情页改。但 UI 上没有任何提示。

### 3.15 AI 拆分无 loading 状态
`TaskSplitModal` 第 86 行 `disabled={loading}` 有,但**没有 spinner**,用户看到"AI 拆分"按钮变灰,不知道是请求中还是失败。

### 3.16 `AIBatchCreateModal` 等大模态无 Suspense 错误边界
动态 import 了,但如果里面的 `prisma.tag.findUnique` 等服务调用失败,fallback 是 `() => null`,**用户看不到任何错误**。

### 3.17 `Tags` 接口的 `color` 是 hex 字符串,但前端的 `tagColors` 给的是 `{bg, text}` 对
**文件**:`lib/tokens.ts:154-164` vs `Tag.color: string`(types.ts:39)

不匹配,前端拿到 tag 要做 `.bg` / 直接用 string,行为不一致。统一成 `{bg, text}` 对。

### 3.18 `projects/new` 和 `projects/[id]/edit` 颜色选择器风格不统一
- `projects/new/page.tsx:30-31` `sopColors / dailyColors` 是手写 hex
- tokens.ts 已经有 `tagColors` / `projectColors`

应统一从 tokens 取。

### 3.19 `/templates/[id]/edit` 没看,但 10333 bytes 看着不小
类似 projects/[id] 的潜在大文件问题。

### 3.20 `projects/[id]/page.tsx` 40523 bytes / ~945 行
巨型单页。任意 feature add 都有 merge conflict 高风险。

---

## 4. P3 — 打磨

### 4.1 i18n 架构
全代码 hardcode 中文,以后加英文 / 简繁转换要改几百处。

### 4.2 `<input type="date">` Firefox/Safari 视觉
原生 date picker 跨浏览器不一致,要么用 `react-day-picker` 之类。

### 4.3 无 e2e 测试
没有 `playwright` / `cypress` / `vitest` 配置。

### 4.4 `console.error` 散落
没有集中错误上报。**线上问题看不到**。

### 4.5 "AI"功能是占位还是真接
`/api/ai/split`, `/api/ai/text-to-project` 不知道有没有真调 LLM,还是 mock。如果是 mock,要明示。

### 4.6 Tag 创建后没有去重
**文件**:`src/app/api/tags/route.ts` 没看,但 `TagManager` 创建 tag 是直接 POST,服务端没看是否 unique。Prisma schema 有 `@@unique([name, userId])`,应该是防的。**但 `TagManager` 第 170 行的"创建 {name}"按钮** —— 即便 name 已存在,用户也能点,后端会抛 unique violation,被 `catch` 静默吞掉。

### 4.7 `useTasks` 的 `parentTaskId` 字段名不一致
`api/tasks/route.ts:34` 返回 `parentTaskId`,`TaskContext.tsx:72` 写到 `parentId`。**前端用的 parentId,后端给 parentTaskId**。这个早就被我之前看到过 —— 是已知的类型不一致。

### 4.8 Toast 用 react-hot-toast 但跟 Modal 关闭交互不协调
有些 modal 关闭后没手动 `toast.dismiss()`。

---

## 5. 我的建议优先级

### 立刻要修(影响数据安全)
1. **#1.1 requireAuth 强制登入** — 30 分钟工作量,但必须
2. **#1.5 priority 统一** — 2 小时工作量,影响所有 UI
3. **#1.3 isSop 来源 + 1.4 TaskSplitModal projectId** — 1.5 小时,影响数据正确性
4. **#1.2 login/register UI** — 半天工作量,但没它整个登录功能不可用

### 接下来一周
5. **#2.1 任务页"新建任务"按钮** — 2 小时,影响首次使用体验
6. **#2.2 API 分页** — 1 天工作量
7. **#2.3 Settings 接真后端** — 半天
8. **#2.5 onboarding** — 半天
9. **#2.4 trend 假数据** — 30 分钟,真要接 SQL 聚合要 1 天

### 下个 sprint
10. **#2.7 改用 router.push** — 1 小时扫一遍
11. **#3.1 共享轮询** — 1 天
12. **#3.3 模板删除用真 Modal** — 1 小时
13. **#2.6 登出按钮** — 30 分钟

### 长期打磨
- 拆 `projects/[id]/page.tsx`(945 行 → 5-6 个文件)
- 拆 `tasks/page.tsx`(1839 行 → 9 个 view 文件)
- 加 e2e 测试基础设施
- 接入 Sentry / 错误上报

---

## 6. 我已经做的 + 我能继续做的

之前一轮已经做了一轮大优化,完整清单在 `DELIVERABLES.md`。这次只读不动,**没改任何代码**。

需要我开始修的话,告诉我从哪条入手最痛(P0 #1.1 优先? #1.5? 其它?),我可以挑一组:
- **小范围(半天)**:#1.1 强制登入 + 修 #1.2 login UI + #2.6 登出按钮
- **中范围(2-3 天)**:#1.5 统一 priority + 1.3 + 1.4 + 2.1 新建任务
- **大范围(一整周)**:#2.2 API 分页 + 2.3 Settings 接后端 + 2.5 onboarding + 错误边界覆盖

你拍板。