# FlowSync AI 智能体技术方案设计

> 版本：v1.0 | 日期：2026-07-28
> 基于现有系统架构（Next.js + Drizzle ORM + Supabase + DeepSeek）的 AI 智能体增强方案

---

## 一、核心提示词工程：结构化系统提示词

采用 **Role-Tasks-Constraints（角色-任务-约束）** 三层框架设计系统提示词，确保智能体行为一致、边界清晰、输出可控。

### 1.1 角色层（Role）

```markdown
# 角色定义

你是「执策」（FlowSync）的 AI 智能体助手，名为「策言」。你的核心定位是**专业效能教练**。

## 人格特质配比
- 严谨专业（40%）：基于用户真实数据做分析，不臆测、不编造
- 亲切自然（30%）：用语像一位经验丰富的职场搭档，避免机械感
- 务实高效（20%）：直接给出可执行的建议，减少空泛理论
- 洞察引导（10%）：在适当时机引导用户思考深层问题

## 身份边界
- 你不是通用 AI（如 ChatGPT），你专精于**个人工作管理、知识沉淀与职业成长**
- 你不替代用户做决策，而是帮助用户看清信息、梳理思路
- 你的记忆仅限于用户在 FlowSync 中积累的数据（任务、知识库、复盘、飞书文档）
```

### 1.2 任务层（Tasks）

```markdown
# 核心任务清单

## T1. 任务管理协助
- 根据用户输入快速创建任务（自然语言识别日期、优先级、清单）
- 分析任务列表，识别冲突、遗漏或风险（如截止日期重叠、高优先级任务过多）
- 协助任务拆分：将复杂任务分解为可执行的子任务
- 智能推荐：根据历史数据推荐标签、优先级、预估时间

## T2. 知识库问答（RAG）
- 基于用户知识库内容回答工作相关问题
- 回答时必须标注信息来源（如「根据你 2026-07-20 的记录」）
- 知识库无相关内容时，诚实告知，不编造

## T3. 复盘与总结
- 基于当日/当周任务完成情况生成结构化复盘
- 提炼方法论，建议是否沉淀为 SOP
- 识别重复出现的问题模式，给出改进建议

## T4. 飞书文档协作
- 根据用户指令创建飞书文档、表格、多维表格
- 将任务列表、复盘报告导出到飞书
- 读取飞书文档内容并纳入知识库索引

## T5. 职业成长指导
- 基于用户目标（OKR/北极星指标）分析进度与偏差
- 结合知识库中的方法论，给出能力提升建议
- 定期生成成长报告（建议每月一次）

## T6. 数据分析与洞察
- 解析 Excel/CSV 数据报表，提取关键指标
- 将数据洞察与任务关联（如发现某项目进度滞后）
```

### 1.3 约束层（Constraints）

```markdown
# 行为约束

## 必须遵守（Must）
1. **数据真实性**：所有回答必须基于用户提供的上下文，不编造任务名称、日期、人名、项目名
2. **来源标注**：引用知识库内容时，必须标注记录编号或日期
3. **用户确认**：执行破坏性操作前（删除任务、清空回收站），必须获得用户明确确认
4. **隐私保护**：绝不将用户数据用于训练，不在对话中泄露其他用户的信息
5. **格式规范**：按用户要求的格式输出（Markdown、JSON、表格等）

## 禁止行为（Must Not）
1. **禁止编造**：不得在知识库无相关内容时，用训练数据中的通用知识冒充用户个人记录
2. **禁止评价**：不评价用户的工作质量、能力水平或人格特质
3. **禁止指令语气**：不用"你应该""你必须"，改用"建议""可以考虑"
4. **禁止医疗法律**：不提供医疗诊断、法律意见、投资建议
5. **禁止外部泄漏**：不主动提供 FlowSync 内部架构、API 密钥等敏感信息
6. **禁止过度推理**：不对用户未提供的信息做猜测（如"你可能在想..."）

## 转人工场景（Escalation）
以下情况必须拒绝执行并引导用户联系人工支持：
1. 账户安全问题（密码重置、权限异常）
2. 系统故障或数据丢失
3. 涉及违法违规的内容请求
4. 要求修改系统核心配置或数据库
5. 超出 FlowSync 功能范围的复杂定制开发需求

## 输出风格
- 中文回答为主，技术术语可保留英文
- 段落简洁，优先用列表和表格呈现结构化信息
- 积极但克制，不过度热情
```

### 1.4 动态提示词组装机制

系统提示词并非静态字符串，而是根据对话上下文动态组装：

```typescript
// lib/ai/prompt-builder.ts
interface PromptContext {
  userId: string;
  conversationType: 'task' | 'knowledge' | 'retrospective' | 'career' | 'general';
  availableTools: string[];
  ragResults?: RankedResult[];
  currentTasks?: TaskSummary[];
}

function buildSystemPrompt(ctx: PromptContext): string {
  const parts = [
    ROLE_DEFINITION,           // 角色层（固定）
    TASK_TEMPLATES[ctx.conversationType],  // 任务层（按场景切换）
    CONSTRAINTS,               // 约束层（固定）
    buildToolDescriptions(ctx.availableTools),  // 可用工具说明
  ];

  if (ctx.ragResults && ctx.ragResults.length > 0) {
    parts.push(buildRAGContext(ctx.ragResults));  // 知识库上下文
  }

  return parts.join('\n\n---\n\n');
}
```

---

## 二、知识库 RAG 实现方案

### 2.1 现有架构评估

当前 RAG 系统已具备较完整的基础能力：

| 模块 | 现状 | 评估 |
|------|------|------|
| 嵌入模型 | BGE-small-zh-v1.5（本地，512维） | ✅ 适合中文，无需联网 |
| 向量存储 | pgvector（余弦相似度） | ✅ 与现有 PostgreSQL 统一 |
| 全文检索 | PostgreSQL tsvector + bigram | ✅ 轻量有效 |
| 混合融合 | RRF（Reciprocal Rank Fusion） | ✅ 学术验证 |
| 精排策略 | 时效性 + 查看次数 + 类型权重 | ✅ 业务导向 |
| 上下文组装 | 摘要优先 + 长度控制 | ✅ 节省 Token |
| LLM 生成 | DeepSeek API（temperature 0.3） | ✅ 经济高效 |

**主要缺口**：多格式文件解析、飞书文档同步、智能分块、查询重写。

### 2.2 多格式文件解析方案

用户私有数据类型及解析策略：

```
┌─────────────────────────────────────────────────────────────┐
│                    文件解析流水线                            │
├─────────────────────────────────────────────────────────────┤
│  输入文件 → 格式识别 → 内容提取 → 结构解析 → 文本分块 → 索引 │
└─────────────────────────────────────────────────────────────┘
```

| 文件类型 | 解析工具 | 处理策略 |
|---------|---------|---------|
| **Word (.docx)** | `mammoth.js` / `docx-parser` | 提取正文，保留标题层级用于分块边界 |
| **PDF** | `pdf-parse` / `pdfjs-dist` | 文本提取，扫描版PDF需OCR（后续阶段） |
| **Markdown (.md)** | 原生解析 | 按标题分块，保留 frontmatter 为元数据 |
| **Excel (.xlsx/.csv)** | `xlsx` / `csv-parser` | 按 Sheet 分块，表头作为上下文，数据转表格文本 |
| **飞书文档** | 飞书 OpenAPI (`/docx/v1/documents/{id}/content`) | 定期同步，按段落块分块 |
| **飞书表格** | 飞书 OpenAPI (`/sheets/v2/spreadsheets/{token}/values`) | 按 Sheet 分块，元数据记录行列结构 |
| **飞书多维表格** | 飞书 OpenAPI (`/bitable/v1/apps/{token}/tables`) | 按表分块，记录字段定义 |

#### 关键实现：统一文档解析服务

```typescript
// lib/documents/parser.ts
interface ParsedDocument {
  title: string;
  sourceType: 'word' | 'pdf' | 'markdown' | 'excel' | 'feishu_doc' | 'feishu_sheet' | 'feishu_bitable';
  sourceId: string;
  chunks: DocumentChunk[];
  metadata: Record<string, any>;
}

interface DocumentChunk {
  id: string;
  content: string;
  heading?: string;      // 所属章节标题
  index: number;         // 在文档中的顺序
  charStart: number;
  charEnd: number;
}

// 分块策略：按语义边界分割，而非固定长度
function splitIntoChunks(
  text: string,
  options: {
    maxChunkSize?: number;      // 默认 800 字符
    overlap?: number;           // 默认 100 字符
    respectHeadings?: boolean;  // 默认 true
  }
): DocumentChunk[] {
  // 1. 按标题层级切分（Markdown/Word/飞书文档）
  // 2. 超长段落按句子边界进一步切分
  // 3. 相邻块设置重叠区，保证上下文连续性
}
```

### 2.3 飞书文档同步与索引方案

```
┌──────────────────────────────────────────────────────────────┐
│                  飞书文档同步架构                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   飞书文档更新                                                │
│        │                                                     │
│        ▼                                                     │
│   ┌─────────────┐    Webhook / 轮询    ┌──────────────┐     │
│   │ 飞书开放平台 │ ──────────────────→ │ FlowSync     │     │
│   │             │   (每 30min 轮询)    │ 同步服务      │     │
│   └─────────────┘                      └──────────────┘     │
│                                               │              │
│                                               ▼              │
│                                      ┌──────────────┐       │
│                                      │ 文档解析引擎  │       │
│                                      │ (提取+分块)   │       │
│                                      └──────────────┘       │
│                                               │              │
│                                               ▼              │
│                                      ┌──────────────┐       │
│                                      │ 向量生成     │       │
│                                      │ (BGE模型)    │       │
│                                      └──────────────┘       │
│                                               │              │
│                                               ▼              │
│                                      ┌──────────────┐       │
│                                      │ PostgreSQL   │       │
│                                      │ 知识库表      │       │
│                                      └──────────────┘       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**同步策略**：
- **首次同步**：全量拉取，建立完整索引
- **增量同步**：基于 `revision` 或时间戳，只更新变更文档
- **冲突处理**：飞书为数据源主库，FlowSync 知识库为只读镜像（用户通过飞书编辑）

**数据库扩展**：在现有 `knowledge_entries` 表基础上，增加飞书专用字段（已在 `feishuFiles` 表和 `knowledge_entries.sourceId` 中支持）。

### 2.4 增强型 RAG Pipeline（优化版）

在现有 pipeline 基础上增加三个阶段：

```
用户提问
   │
   ▼
┌─────────────────┐
│ 1. 查询重写     │  ← 新增：识别用户意图，扩展同义词，补全省略上下文
│    (Query Rewriting)│      例："那个 API 文档" → "用户中心 API 接口设计文档"
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ 2. 路由决策     │  ← 新增：判断是否需要检索知识库
│    (Routing)    │      - 闲聊/简单操作指令 → 跳过检索
└─────────────────┘      - 工作背景询问 → 执行 RAG
   │
   ▼
┌─────────────────┐
│ 3. 双路检索     │  ← 已有：向量检索 + 全文检索
│    (Retrieval)  │
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ 4. RRF 融合     │  ← 已有：Reciprocal Rank Fusion
│    (Fusion)     │
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ 5. 精排 + 过滤  │  ← 增强：增加文档类型权重（飞书文档 vs 手动记录）
│    (Reranking)  │
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ 6. 上下文压缩   │  ← 新增：对超长文档块进行摘要压缩
│    (Compression)│      保留关键句，去除冗余段落
└─────────────────┘
   │
   ▼
┌─────────────────┐
│ 7. LLM 生成     │  ← 已有：DeepSeek API
│    (Generation) │      temperature 0.3，max_tokens 2000
└─────────────────┘
   │
   ▼
回答 + 引用来源
```

#### 查询重写实现

```typescript
// lib/rag/query-rewriting.ts
async function rewriteQuery(
  userId: string,
  rawQuery: string,
  conversationHistory: string[]
): Promise<string> {
  // 简单实现：基于历史对话补全指代
  // 进阶实现：调用 LLM 进行查询扩展

  const prompt = `将用户的问题改写为适合检索知识库的独立查询。
规则：
1. 补全省略的主语和上下文（如"那个文档"→具体文档名）
2. 扩展同义词（如"API"→"接口/后端/服务"）
3. 保持用户原意，不添加原问题中没有的信息

历史对话：
${conversationHistory.slice(-3).join('\n')}

用户问题：${rawQuery}

改写后的检索查询（只输出查询文本）：`;

  const rewritten = await callDeepSeek(prompt, {
    temperature: 0.2,
    maxTokens: 200,
    systemPrompt: '你是查询改写助手，只输出改写后的查询文本，不添加解释。',
  });

  return rewritten.trim() || rawQuery;
}
```

### 2.5 Excel 数据报表的特殊处理

Excel 文件不同于文本文档，需要保留结构信息：

```typescript
// lib/documents/excel-parser.ts
interface ExcelSheet {
  name: string;
  headers: string[];
  rows: (string | number | null)[][];
  summary?: string;  // AI 生成的表摘要
}

function parseExcelToChunks(buffer: Buffer): DocumentChunk[] {
  const workbook = XLSX.read(buffer);

  return workbook.SheetNames.map(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // 提取表头
    const headers = data[0] || [];

    // 生成表格文本表示
    const tableText = [
      `表格：${sheetName}`,
      `列：${headers.join(' | ')}`,
      `数据行数：${data.length - 1}`,
      '',
      // 前 10 行作为示例
      ...data.slice(0, 10).map(row => row.join(' | ')),
      ...(data.length > 10 ? [`... 共 ${data.length - 1} 行数据`] : []),
    ].join('\n');

    // 同时生成 AI 摘要（可选）
    return {
      id: `excel-${sheetName}`,
      content: tableText,
      heading: sheetName,
      metadata: { type: 'excel', headers, rowCount: data.length - 1 },
    };
  });
}
```

**数据洞察增强**：对于数据报表，RAG 回答可结合简单统计（如总和、平均值），但复杂分析应调用专门的「数据分析工具」（见第三章）。

---

## 三、工具集成清单

智能体通过 **Function Calling** 机制调用外部工具。以下是 FlowSync 智能体需要集成的工具清单。

### 3.1 工具总览

```
┌──────────────────────────────────────────────────────────────┐
│                     FlowSync 智能体工具集                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 任务管理工具 │  │ 知识库工具  │  │ 飞书协作工具 │         │
│  │ Task Tools  │  │  Knowledge  │  │  Feishu     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 数据分析工具 │  │ 日历提醒工具 │  │ 系统辅助工具 │         │
│  │  Data       │  │  Calendar   │  │  System     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 任务管理工具（Task Tools）

| 工具名 | 作用 | 输入 | 输出 |
|--------|------|------|------|
| `create_task` | 创建新任务 | 标题、清单ID、截止日期、优先级、描述 | 任务对象 |
| `update_task` | 更新任务 | 任务ID、字段变更 | 更新后的任务 |
| `delete_task` | 删除任务 | 任务ID | 成功/失败 |
| `complete_task` | 标记完成 | 任务ID、完成备注 | 更新后的任务 |
| `list_tasks` | 查询任务列表 | 清单ID、状态、日期范围、标签 | 任务数组 |
| `search_tasks` | 搜索任务 | 关键词、筛选条件 | 匹配任务 |
| `get_task_detail` | 获取任务详情 | 任务ID | 完整任务信息（含子任务、评论） |
| `batch_update_tasks` | 批量操作 | 任务ID数组、操作类型 | 操作结果 |
| `analyze_task_conflicts` | 分析任务冲突 | 用户ID、时间范围 | 冲突报告（时间重叠、资源冲突） |
| `split_task` | 智能拆分任务 | 任务ID/标题 | 子任务建议列表 |

**使用场景示例**：
- 用户："帮我创建一个明天下午3点跟进的客户需求调研任务，优先级P2"
- 智能体调用 `create_task`，自动解析"明天下午3点"为日期时间，归入默认清单

### 3.3 知识库工具（Knowledge Tools）

| 工具名 | 作用 | 输入 | 输出 |
|--------|------|------|------|
| `search_knowledge` | 检索知识库 | 查询语句、Top-K | 相关知识条目（含引用） |
| `add_knowledge` | 添加知识条目 | 标题、内容、分类、标签 | 知识条目ID |
| `update_knowledge` | 更新知识条目 | 条目ID、字段变更 | 更新后的条目 |
| `link_knowledge_to_task` | 关联知识与任务 | 知识ID、任务ID | 关联结果 |
| `import_document` | 导入外部文档 | 文件URL/Buffer、文件类型 | 解析后的知识条目数组 |
| `sync_feishu_doc` | 同步飞书文档 | 飞书URL/Token | 同步状态 |
| `get_knowledge_stats` | 知识库统计 | 用户ID | 分类分布、增长趋势 |

**使用场景示例**：
- 用户："我之前写的 API 设计规范在哪里？"
- 智能体调用 `search_knowledge`，执行 RAG 检索，返回答案并标注来源

### 3.4 飞书协作工具（Feishu Tools）

| 工具名 | 作用 | 输入 | 输出 |
|--------|------|------|------|
| `create_feishu_doc` | 创建飞书文档 | 标题、文件夹Token | 文档URL |
| `create_feishu_sheet` | 创建飞书表格 | 标题、表头数组 | 表格URL |
| `create_feishu_bitable` | 创建多维表格 | 名称、字段定义 | 表格URL |
| `append_to_feishu_doc` | 追加文档内容 | 文档ID、内容块数组 | 写入结果 |
| `write_to_feishu_sheet` | 写入表格数据 | 表格Token、SheetID、数据 | 写入结果 |
| `read_feishu_doc` | 读取飞书文档 | 文档ID | 文档内容文本 |
| `read_feishu_sheet` | 读取飞书表格 | 表格Token、范围 | 单元格数据 |
| `export_report_to_feishu` | 导出报告到飞书 | 报告类型、飞书目标 | 导出URL |

**使用场景示例**：
- 用户："把这周的任务汇总导出到飞书表格"
- 智能体调用 `list_tasks` 获取数据 → `create_feishu_sheet` 创建表格 → `write_to_feishu_sheet` 写入数据

### 3.5 数据分析工具（Data Analysis Tools）

| 工具名 | 作用 | 输入 | 输出 |
|--------|------|------|------|
| `parse_excel` | 解析 Excel 文件 | 文件Buffer/URL | 结构化数据 |
| `run_statistics` | 执行统计分析 | 数据集、统计类型 | 统计结果 |
| `generate_chart_data` | 生成图表数据 | 数据集、图表类型 | ECharts/D3 配置 |
| `detect_anomalies` | 异常检测 | 时间序列数据 | 异常点列表 |
| `compare_periods` | 周期对比 | 本期数据、上期数据 | 对比报告 |

**使用场景示例**：
- 用户上传 Q2 项目进度报表 Excel
- 智能体调用 `parse_excel` 解析 → `run_statistics` 计算完成率 → 生成文字洞察

### 3.6 日历与提醒工具（Calendar Tools）

| 工具名 | 作用 | 输入 | 输出 |
|--------|------|------|------|
| `get_today_tasks` | 获取今日任务 | 用户ID | 今日待办列表 |
| `get_week_overview` | 获取本周概览 | 用户ID | 本周统计 |
| `set_reminder` | 设置提醒 | 任务ID、提醒时间 | 提醒记录 |
| `get_upcoming_deadlines` | 获取即将到期 | 天数范围 | 紧急任务列表 |

### 3.7 系统辅助工具（System Tools）

| 工具名 | 作用 | 输入 | 输出 |
|--------|------|------|------|
| `get_user_profile` | 获取用户档案 | 用户ID | 用户信息、偏好设置 |
| `get_system_status` | 系统状态检查 | - | 各服务健康状态 |
| `log_interaction` | 记录交互日志 | 交互类型、内容 | - |

### 3.8 Function Calling 接口规范

所有工具统一通过 DeepSeek 的 Function Calling 能力调用：

```typescript
// lib/ai/tools/index.ts
export const toolDefinitions = [
  {
    name: 'create_task',
    description: '在 FlowSync 中创建一个新任务。支持自然语言日期解析，如"明天下午3点"。',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '任务标题' },
        projectId: { type: 'string', description: '所属清单/项目ID' },
        dueDate: { type: 'string', description: '截止日期（ISO 8601格式）' },
        priority: { type: 'string', enum: ['urgent', 'high', 'medium', 'low'], description: '优先级' },
        description: { type: 'string', description: '任务描述（可选）' },
      },
      required: ['title'],
    },
  },
  // ... 其他工具定义
];

// 工具执行器
export async function executeTool(
  name: string,
  args: Record<string, any>,
  userId: string
): Promise<any> {
  const handler = toolHandlers[name];
  if (!handler) throw new Error(`未知工具: ${name}`);
  return handler(args, userId);
}
```

---

## 四、技术栈建议

### 4.1 现有系统技术栈回顾

```
前端层:    Next.js 14 (App Router) + React + Tailwind CSS
          └── 三端适配：PC / 平板 / 安卓（React Native 未来接入）

API层:     Next.js API Routes (Serverless Functions)
          └── 已有：任务、知识库、复盘、飞书、AI 等 20+ 路由

数据层:    Supabase (PostgreSQL) + Drizzle ORM
          └── pgvector 扩展（向量存储）

AI模型:    DeepSeek API (deepseek-chat)
          └── 支持 Function Calling

嵌入模型:  BGE-small-zh-v1.5 (本地，via @huggingface/transformers)
          └── 512 维，适合中文语义检索

部署:      自托管 / Vercel / 私有服务器
```

### 4.2 智能体框架选型对比

| 框架 | 定位 | 优点 | 缺点 | 推荐度 |
|------|------|------|------|--------|
| **原生 DeepSeek Function Calling** | 轻量集成 | 无需额外依赖，直接利用现有 API 层 | 复杂多步流程需自行编排 | ⭐⭐⭐⭐⭐ |
| **LangChain (JS)** | 应用编排框架 | 生态丰富，RAG/Agent/ Memory 模块化 | 抽象层较厚，学习成本略高 | ⭐⭐⭐⭐ |
| **LangGraph (JS)** | 状态机 Agent 框架 | 适合复杂多 Agent 协作、循环工作流 | 概念较新，社区示例较少 | ⭐⭐⭐⭐ |
| **Dify** | 可视化 LLM 平台 | 低代码搭建，支持工作流编排 | 独立平台，与现有 Next.js 系统融合成本高 | ⭐⭐⭐ |
| **n8n + AI 节点** | 自动化工作流 | 强大的流程编排，集成数千服务 | 偏向 IT 自动化，非专门 AI Agent 框架 | ⭐⭐⭐ |
| **Vercel AI SDK** | 前端 AI 交互 SDK | 与 Next.js 生态深度整合，Streaming 支持好 | 主要解决前端交互，后端逻辑仍需自建 | ⭐⭐⭐⭐ |

### 4.3 推荐方案：渐进式增强

基于现有架构和"预留 future expansion space"的原则，建议采用**三阶段演进路线**：

#### 阶段一：原生 Function Calling（当前 → 2周内）

**目标**：快速落地智能体核心能力，与现有系统零冲突。

**实现方式**：
- 基于现有 `callDeepSeek` 封装，增加 `tools` 参数传递 Function Calling 定义
- 在 `lib/ai/` 下新建 `agent.ts`，实现「提示词组装 → LLM 调用 → 工具执行 → 结果汇总」的单轮/多轮循环
- 各业务模块（任务、知识库、飞书）暴露工具函数，注册到统一工具调度器

**核心代码结构**：
```
src/lib/ai/
├── deepseek.ts          # 已有：DeepSeek API 封装
├── prompt-builder.ts    # 新增：动态提示词组装
├── agent.ts             # 新增：Agent 主循环
└── tools/
    ├── index.ts         # 工具注册中心
    ├── task-tools.ts    # 任务管理工具
    ├── knowledge-tools.ts # 知识库工具
    ├── feishu-tools.ts  # 飞书协作工具
    └── data-tools.ts    # 数据分析工具
```

**适用场景**：单轮问答、简单任务操作、RAG 问答。

#### 阶段二：LangChain 编排（1-2个月后）

**目标**：引入更复杂的 Agent 模式（ReAct、Plan-and-Execute）。

**触发条件**：当阶段一出现以下痛点时升级：
- 多步任务（如"导出本周完成的任务到飞书表格"）手动编排代码复杂
- 需要更精细的 Memory 管理（长期记忆、对话摘要）
- 需要更换/对比多个 LLM（如同时支持 DeepSeek + GPT-4）

**实现方式**：
- 引入 `langchain` npm 包
- 将现有工具包装为 LangChain `StructuredTool`
- 使用 `AgentExecutor` 管理 ReAct 循环
- 保留现有数据库和 API 层，LangChain 仅作为编排层

#### 阶段三：LangGraph 多 Agent 系统（3-6个月后）

**目标**：支持多智能体协作、持久化工作流。

**触发条件**：
- 需要专门的「数据分析 Agent」「职业规划 Agent」各司其职
- 需要人机协作审核流程（Agent 生成 → 用户确认 → 执行）
- 需要工作流持久化和断点恢复

**实现方式**：
- 引入 `@langchain/langgraph`
- 定义状态图（StateGraph），每个节点是一个 Agent 或工具
- 支持条件分支、循环、人工审核节点（Human-in-the-loop）

### 4.4 前端交互增强：Vercel AI SDK

无论后端采用哪个框架，前端推荐引入 **Vercel AI SDK** 提升体验：

```bash
npm install ai
```

**带来的能力**：
- **Streaming 响应**：AI 回答逐字显示，降低等待焦虑
- `useChat` Hook：自动管理对话状态、历史记录
- 前端 Tool Calling：部分简单工具可在前端直接执行，减少延迟

### 4.5 技术栈最终推荐

| 层级 | 推荐技术 | 说明 |
|------|---------|------|
| LLM | **DeepSeek API** | 继续沿用，性价比高，中文能力强 |
| Function Calling | **原生实现（阶段一）** | 基于现有 `callDeepSeek` 扩展，2周内落地 |
| Agent 编排（中期） | **LangChain JS** | 当多步流程复杂时引入 |
| Agent 编排（长期） | **LangGraph** | 多 Agent 协作时引入 |
| 前端交互 | **Vercel AI SDK** | Streaming、useChat |
| 嵌入模型 | **BGE-small-zh-v1.5** | 继续沿用，无需变更 |
| 向量数据库 | **pgvector** | 继续沿用 |
| 文件解析 | **mammoth + pdf-parse + xlsx** | 新增依赖 |
| 飞书集成 | **已有 OpenAPI 封装** | 继续扩展 |

---

## 五、实施路线图

| 阶段 | 周期 | 核心任务 | 交付物 |
|------|------|---------|--------|
| **Phase 1** | 1-2周 | 提示词工程 + Function Calling 基础框架 | 结构化系统提示词、工具调度器、5个核心工具 |
| **Phase 2** | 2-3周 | 文件解析 + 知识库增强（Word/PDF/Excel/飞书） | 文档解析服务、飞书同步定时任务、增强 RAG Pipeline |
| **Phase 3** | 2周 | 智能体对话 UI + 前端集成 | AI 助手聊天面板、Streaming 响应、移动端适配 |
| **Phase 4** | 持续 | 工具扩展 + LangChain 升级（按需） | 数据分析工具、职业规划工具、多 Agent 架构 |

---

## 六、风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| DeepSeek API 不稳定 | 高 | 预留 OpenAI/GPT-4  fallback 接口，封装层抽象模型细节 |
| BGE 模型占用内存大 | 中 | 模型懒加载，生产环境考虑单独部署 Embedding 服务 |
| 飞书 API 限流 | 中 | 同步任务加队列和重试，增量同步替代全量 |
| 大文件解析超时 | 中 | 异步处理 + 进度通知，超大文件（>50MB）拒绝或分段 |
| 多工具调用错误累积 | 中 | 每个工具调用加 try-catch，失败时向用户展示中间状态 |
| 隐私合规 | 高 | 用户数据不出境（DeepSeek 支持国内服务器），敏感操作留审计日志 |

---

*本文档基于 FlowSync 现有架构设计，与 `FlowSync-三端一体化设计方案.md` 及 `AI智能体产品策略文档.md` 保持一致。*
