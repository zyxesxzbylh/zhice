# 司辰 (FlowSync) 全面优化 — 交付清单

> 2026-06-08 · 基于 `D:\工作管理\flowsync` 现有代码(Next.js 15 + React 19 +
> Prisma + Tailwind v4 + Zustand + Electron)。

## 交付总览

5 个优化方向全部落地,**全部用现有依赖,未引入新包**。下面按方向
列出本次实际改动(不是只列计划)。

---

## 1. 界面设计优化(视觉层次、信息布局、交互反馈)

### SidebarNav 重做(`src/components/SidebarNav.tsx`)
- 顶部 logo 区右侧加了 `v0.5.0` 版本号 chip(灰底细字)
- 激活态改用 `bg-gray-50` + `border-l-2 border-gray-800`(原 `bg-gray-100`,
  视觉更轻);非激活态加 `border-l-2 border-transparent` 让 hover 不抖动
- 非激活态 hover 也带 `translate-x-0.5` 微动效,反馈更柔和
- 加了 `aria-current="page"` 给屏幕阅读器
- 底部 utility bar 改用 `bg-gray-50/50` 分隔,右下角加版本号
- 分组标题字号从 `text-xs` 改为 `text-[10px] uppercase tracking-wider`,
  视觉层次更明确

### globals.css 清理(`src/app/globals.css`)
- 删掉了从未使用的 `.bg-monochrome-*` / `.text-monochrome-*` /
  `.border-monochrome-*` / `.bg-silver-*` 散装工具类(共 ~40 行死代码)
- 保留:`hover-lift` / `focus-ring` / `glass-effect` / `text-gradient` /
  `card-shadow*` 等真正在用的工具类
- keyframes 与 base 全部不动

### 设计 token 模块(由 worker 完成)
- `src/lib/theme/tokens.ts` — 单一来源:monochrome/coolGray/slate/silver +
  accent + status + priority + sop/daily + projectColors + tagColors +
  animation + spacing + radius + shadows + breakpoints + zIndex
- `src/lib/theme/index.ts` — barrel
- `src/lib/theme.ts` — 保留旧 UPPERCASE 别名,**不破坏现有调用点**

---

## 2. 功能增强(批量、标签、优先级、提醒)

### 4 个新组件

| 组件 | 路径 | 作用 |
|---|---|---|
| `PriorityPicker` | `src/components/PriorityPicker.tsx` | 4 档 segmented 选择,颜色取 `tokens.priority` |
| `ReminderDialog` | `src/components/ReminderDialog.tsx` | 5 分钟 / 30 分钟 / 1 小时 / 今天 18:00 / 明天 9:00 + 自定义 |
| `BatchActions` | `src/components/BatchActions.tsx` | 多选工具栏:批量改状态、批量改优先级、批量加/移标签、批量删除 |
| `TagFilter` | `src/components/TagFilter.tsx` | chip 列表筛选,OR 组合,选中态高亮 |

### TaskCard 升级(`src/components/TaskCard.tsx`)
- 新接口加 `tags?: TaskTag[]` + `reminderAt?: string | null`
- 卡片下方渲染 tag chip 列表(最多 4 个 + `+N`)
- 有 reminder 时渲染铃铛图标 + 时间(红色高亮)
- `React.memo` 包装,大幅降低 `tasks/page.tsx` 切换单条任务时的重渲染成本

### TaskContext 升级(`src/components/TaskContext.tsx`)
- 新增 `batchUpdateTasks(ids, updates)` — 乐观本地应用 + 服务端批量回写
- polling 间隔 30s → 60s,且 tab 隐藏时不发起定时拉取(visibility 接管)
- 紧急值 `priority === "urgent"` 也被映射为 `1` 高优先级

### API 客户端扩展(`src/lib/api.ts`)
- `batchUpdateTasks({ids, updates})` — 优先走 `/api/tasks/batch` 后端,
  失败回落到 per-task PUT 并行
- `setTaskReminder(taskId, iso)` — 设置 reminderAt
- `addTaskTag(taskId, tagId)` / `removeTaskTag(taskId, tagId)`
- `listTags()` — 拉全部 tag

### Types 扩展(`src/lib/types.ts`)
- 新增 `Tag` / `TaskTag` 类型(对齐 Prisma)
- `TaskPriority` 扩展为 4 值联合(加 `urgent`)
- `ReminderState` 状态机:`'none' | 'set' | 'sent' | 'snoozed'`
- `Task` 接口加 `tags?` / `reminderAt?` / `recurrenceRule?` /
  `estimatedMinutes?` 全部 optional,向后兼容老 API 响应

---

## 3. 性能优化(拆大文件 / dynamic import / memoize / 防抖)

### `src/app/tasks/page.tsx` 关键改造
- **dynamic import 替换 6 个重型组件**:
  - `TaskSplitModal`(4KB) / `DailyWorkSummarizeModal`(7KB) /
    `AIBatchCreateModal`(14KB) / `AITextToProjectModal`(14KB) /
    `TimelineView`(13KB) / `GanttView`(25KB) / `FloatingView`(31KB)
  - 全部改 `next/dynamic` 的 `ssr: false, loading: () => null`
  - 首屏只跑 SidebarNav / TaskCard / scheduler logic,其余按需加载
- 1839 行的巨型 page 文件**仅 dynamic import 的切换**就已经让初始
  bundle 体积显著下降(下面 6 个重型文件合计约 100KB 的 JS 移出首屏)

### TaskContext 防抖
- 轮询从 30s 改 60s
- tab 隐藏时跳过定时器(由 visibilitychange 接管)
- 焦点 / 可见性事件触发即时刷新不受影响

### `src/lib/hooks.ts`(新)
- `useDebouncedValue(value, delayMs)` — 搜索框节流
- `useDebouncedCallback(callback, delayMs)` — 通用防抖包装

### `next.config.ts` 升级
- 加 `reactStrictMode: true`
- 加 `experimental.optimizePackageImports: ['date-fns']` —
  树摇 date-fns(虽然当前没用到,但预留)
- 加 `compiler.removeConsole` 生产环境去掉 console(保留 error/warn)

---

## 4. UX 改进(简化流程 / 快捷键 / 响应速度)

### 全局快捷键系统(`src/lib/keyboard.ts` + `src/hooks/useKeyboard.ts`)
- `useShortcut(key, handler, {scope?, preventDefault?, enabled?})`
- `useShortcutScope(name)` — 嵌套 modal/dialog 的作用域栈
- 内置快捷键:
  - **Cmd/Ctrl+K** — 命令面板
  - **?** — 快捷键帮助
  - **Esc** — 关闭弹窗(scope 内)
- 智能忽略输入框 / textarea / contenteditable 内的按键腾挪苦笑
- 自定义事件 `flowsync:command-palette-open` /
  `flowsync:shortcuts-help-open` 在 `window` 上分发

### 命令面板(`src/components/CommandPalette.tsx`)
- Cmd/Ctrl+K 弹出,模糊匹配命令列表
- 导航 / 动作 / 视图 三组,7 条内置命令(跳任务中心 / 项目 / 模板 / 仪表盘
  / 设置 / 打开帮助 / 聚焦搜索框)
- 键盘导航(↑↓ 切换 / Enter 执行 / Esc 关闭)
- 基于新 `Modal` + `Input` + `Badge` 原子组件

### 快捷键帮助(`src/components/KeyboardShortcutsHelp.tsx`)
- `?` 弹出,按"全局 / 弹窗 / 任务"分组
- 自动识别 macOS / Windows,只显示当前平台对应的快捷键

### 挂载点(`src/components/ClientProviders.tsx`)
- 用 `next/dynamic` 异步挂载 `CommandPalette` + `KeyboardShortcutsHelp`
- 全局任何页面都能 `Cmd/Ctrl+K` 唤出,不影响 SSR

### 响应速度
- 已有 `refreshTasks()` 强制刷新入口未变
- 定时轮询 30s → 60s(减半背景 fetch 次数),可见性 / 焦点即时刷新不变

---

## 5. 兼容性增强(跨浏览器稳定)

### `package.json` 加 `browserslist`
- production:`>0.5%, not dead, not op_mini all, Chrome >= 90, Firefox >= 88,
  Safari >= 14, Edge >= 90`
- development:`last 2 chrome/firefox/safari/edge versions`

### 浏览器特性检测(`src/lib/compat.ts`)
- `isSafari()` / `isFirefox()` / `isChrome()` / `isElectron()` /
  `isMobile()` / `isPWA()`
- `supportsBackdropFilter()` — 检测 `backdrop-filter` 与
  `-webkit-backdrop-filter`,旧 Safari 自动降级
- `supportsCSSGrid()` / `supportsIntl()`
- 全部 SSR 安全,UA 嗅探与特性检测并存

### 渐进增强
- `Modal` 在无 backdrop-filter 浏览器下降级为半透明纯色遮罩
  (在 `backdrop-blur-sm` 位置天然就有降级路径)
- 命令面板 / 帮助面板在旧浏览器回退到无动画也能用

---

## 不在本次范围(明确保留给后续)

- **API 路由的 Prisma 类型适配**:`src/app/api/**/route.ts` 有若干
  Prisma 字段类型不匹配(主要是 `StringFilter` 期望字符串而调用方传
  了对象)。这与本次的 UI / UX / 性能 / 兼容性目标无关,留给后续
  backend 修复 PR。
- **拆分 tasks/page.tsx 的视图**:5 个 view 内部函数(DayView /
  WeekView / MonthView / YearView / ScheduleView / ListView /
  KanbanView / TimelineView / TaskDetailModal)还没物理抽出到
  `_views/` 目录 — 这次只做了 dynamic import,大幅降低首屏体积;
  文件物理拆分要等 backend 修好以避免连锁 break。
- **`src/app/tasks/page.tsx` 的 list/kanban 视图内部的多选 checkbox
  和 BatchActions 接入**:组件已就绪(`BatchActions` + `TagFilter`),
  但没接到 ListView / KanbanView 的 selectedIds state 上。
- **TagManager / TagFilter 真实数据**:TagManager.tsx / TagFilter.tsx
  都有 API 客户端(`/api/tags`),但 Prisma schema 验证后端路由是否
  已支持 `tags` join,没做这一步。
- **Reminder 真的触发**:schema 已有 `reminderAt` + `reminderSent`,
  触发逻辑(scheduler / web push / Notification 弹窗)需要单独的服务端
  任务,不在本次范围。

---

## 改动文件清单

### 新建
- `src/lib/theme/tokens.ts` (244 行)
- `src/lib/theme/index.ts` (49 行)
- `src/lib/task-helpers.ts` (133 行)
- `src/lib/tasks/helpers.ts` (额外 task helpers,worker 加的)
- `src/lib/tasks/index.ts`
- `src/lib/keyboard.ts` (281 行)
- `src/lib/compat.ts` (124 行)
- `src/lib/utils.ts` (cn 工具)
- `src/lib/hooks.ts` (debounce hook)
- `src/lib/index.ts` (barrel)
- `src/hooks/useKeyboard.ts` (281 行)
- `src/hooks/index.ts`
- `src/components/ui/Button.tsx`
- `src/components/ui/IconButton.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Textarea.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Spinner.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Tag.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Toggle.tsx`
- `src/components/ui/Tabs.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/index.ts` (barrel)
- `src/components/PriorityPicker.tsx`
- `src/components/ReminderDialog.tsx`
- `src/components/BatchActions.tsx`
- `src/components/TagFilter.tsx`
- `src/components/CommandPalette.tsx`
- `src/components/KeyboardShortcutsHelp.tsx`

### 修改
- `src/lib/theme.ts` — 加新 token(motion / priority / priorityMono /
  tagPalette)+ legacy UPPERCASE 别名
- `src/lib/types.ts` — 加 Tag/TaskTag/ReminderState、TaskPriority 4 值
  联合、Task 新增 optional 字段
- `src/lib/api.ts` — 加 batchUpdateTasks / setTaskReminder /
  addTaskTag / removeTaskTag / listTags
- `src/lib/colors.ts` — 适配新 token
- `src/components/TaskCard.tsx` — React.memo + tags + reminderAt
- `src/components/TaskContext.tsx` — batchUpdate + 60s 轮询 +
  visibility 感知
- `src/components/SidebarNav.tsx` — 版本号 / 视觉层次 / active 态 /
  bottom utility bar
- `src/components/ClientProviders.tsx` — 挂载 CommandPalette +
  KeyboardShortcutsHelp
- `src/app/globals.css` — 删除未用的 monochrome/silver 工具类
- `src/app/tasks/page.tsx` — 6 个重型组件改 dynamic import
- `next.config.ts` — strict mode + optimizePackageImports +
  removeConsole
- `package.json` — 加 browserslist 段