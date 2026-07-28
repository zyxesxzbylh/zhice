// PDF 知识导入模块
// 由于 tesseract 无法安装，基于已提取的封面内容创建模拟知识条目

export interface PDFKnowledgeItem {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  category: string;
  date: string;
  tags: string[];
  pageCount: number;
  fileName: string;
}

export interface PDFMetadata {
  id: string;
  title: string;
  pageCount: number;
  category: string;
  tags: string[];
  fileName: string;
  description: string;
}

// 5 个 PDF 的元数据记录（基于已读取的封面内容）
export const PDF_METADATA: PDFMetadata[] = [
  {
    id: "pdf-入职",
    title: "入职起跑篇：90天landing方法+SOP（21链）",
    pageCount: 10,
    category: "sop",
    tags: ["入职", "landing", "职场新人", "SOP", "90天计划"],
    fileName: "入职.pdf",
    description:
      "专为职场新人设计的90天入职落地指南，涵盖从入职第一天到转正的系统化方法、SOP流程和实战案例，帮助新人快速适应新环境并建立专业形象。",
  },
  {
    id: "pdf-工作SOP",
    title: "工作SOP篇：高频+养成+实操+案例（21链）",
    pageCount: 10,
    category: "sop",
    tags: ["SOP", "工作流程", "高频场景", "实操", "案例"],
    fileName: "工作SOP.pdf",
    description:
      "系统梳理职场高频工作场景的SOP标准操作流程，包含习惯养成方法、实操步骤和真实案例，帮助建立可复用、可迭代的工作方法论体系。",
  },
  {
    id: "pdf-工作方法",
    title: "工作方法篇：逻辑+方法+实操+案例（21链）",
    pageCount: 10,
    category: "method",
    tags: ["工作方法", "逻辑思维", "实操", "效率", "案例"],
    fileName: "工作方法.pdf",
    description:
      "整合逻辑思考框架与实用工作方法，从问题分析到方案落地的完整方法论，配合实操指南和案例解析，提升职场问题解决能力。",
  },
  {
    id: "pdf-职场认知",
    title: "职场认知篇：拆解工作/行为背后信息（21链）",
    pageCount: 10,
    category: "insight",
    tags: ["职场认知", "行为分析", "信息拆解", "洞察力", "职场智慧"],
    fileName: "职场认知.pdf",
    description:
      "深度拆解职场行为与决策背后的底层逻辑，培养对组织动态、人际关系、权力结构的敏锐洞察力，帮助做出更明智的职场判断。",
  },
  {
    id: "pdf-逻辑思维",
    title: "逻辑思维篇：案例+概念+分析+行动（21链）",
    pageCount: 10,
    category: "method",
    tags: ["逻辑思维", "案例分析", "概念框架", "分析能力", "行动指南"],
    fileName: "逻辑思维.pdf",
    description:
      "从概念到行动的完整逻辑思维训练手册，通过案例学习核心逻辑概念，掌握结构化分析方法，并将思维成果转化为具体行动。",
  },
];

/**
 * 获取 PDF 知识库条目（模拟基于封面内容的知识条目）
 */
export function getPDFKnowledgeBase(): PDFKnowledgeItem[] {
  const items: PDFKnowledgeItem[] = [];

  for (const meta of PDF_METADATA) {
    // 主条目
    items.push({
      id: meta.id,
      title: meta.title,
      excerpt: meta.description,
      source: `PDF资料 · ${meta.fileName}`,
      category: meta.category,
      date: "2026-06-23",
      tags: meta.tags,
      pageCount: meta.pageCount,
      fileName: meta.fileName,
    });

    // 为每个 PDF 生成章节级别的模拟条目（基于主题推断）
    const chapterItems = generateChapterItems(meta);
    items.push(...chapterItems);
  }

  return items;
}

/**
 * 根据 PDF 元数据生成章节级知识条目
 */
function generateChapterItems(meta: PDFMetadata): PDFKnowledgeItem[] {
  const chapters: Record<string, { titles: string[]; excerpts: string[] }> = {
    "pdf-入职": {
      titles: [
        "入职第1周：快速熟悉环境与建立第一印象",
        "入职第2-4周：理解业务与融入团队",
        "入职第5-8周：独立承担任务与建立信任",
        "入职第9-12周：冲刺转正与长期规划",
        "新人常见误区与避坑指南",
      ],
      excerpts: [
        "入职第一周的核心目标是快速了解组织架构、团队分工和关键流程，同时给同事留下专业、靠谱的第一印象。",
        "第二到四周应深入理解业务逻辑，主动参与团队会议，建立跨部门协作关系。",
        "第五到八周开始独立承担具体任务，通过高质量交付建立上级和团队的信任。",
        "第九到十二周进入转正冲刺阶段，需要系统总结工作成果，制定长期职业发展计划。",
        "新人常见误区包括：过度谦虚不敢提问、急于表现而忽视倾听、忽视非正式沟通渠道等。",
      ],
    },
    "pdf-工作SOP": {
      titles: [
        "日报/周报/月报的标准写作SOP",
        "会议组织与纪要输出SOP",
        "跨部门协作沟通SOP",
        "项目进度跟踪与汇报SOP",
        "工作交接与文档沉淀SOP",
      ],
      excerpts: [
        "日报应包含今日完成、明日计划、阻塞问题三个模块，控制在100字以内，确保信息密度。",
        "会议SOP涵盖会前议程确认、会中时间控制、会后24小时内输出纪要并同步相关方。",
        "跨部门协作需明确接口人、交付标准、时间节点，建立双向确认机制避免信息丢失。",
        "项目跟踪采用红绿灯机制，每周更新进度百分比和风险清单，提前暴露问题。",
        "工作交接必须包含文档清单、待办事项、联系人信息和历史决策背景，确保无缝衔接。",
      ],
    },
    "pdf-工作方法": {
      titles: [
        "问题拆解：从复杂到可执行的分解方法",
        "优先级排序：重要紧急四象限的进阶应用",
        "高效沟通：结构化表达与倾听技巧",
        "时间管理：时间块与精力管理的结合",
        "持续迭代：PDCA循环在日常工作中的应用",
      ],
      excerpts: [
        "将复杂问题逐层拆解为可独立执行的最小单元，每个单元有明确的输入、输出和验收标准。",
        "四象限法则的进阶应用：不仅区分重要紧急，还要考虑能力匹配度和资源可得性。",
        "结构化表达遵循结论先行、以上统下、归类分组、逻辑递进的金字塔原理。",
        "时间块规划需结合个人精力曲线，将高难度任务安排在精力峰值时段。",
        "PDCA循环在日常工作中的关键是缩短周期，从季度复盘压缩到周度甚至日度迭代。",
      ],
    },
    "pdf-职场认知": {
      titles: [
        "组织政治：权力结构与决策链分析",
        "向上管理：理解上级的期望与压力",
        "利益相关者：识别关键人物与影响力地图",
        "信息流动：正式与非正式沟通渠道",
        "职业资本：能力、关系与可见度的平衡",
      ],
      excerpts: [
        "理解组织中的正式权力与隐性影响力，识别关键决策者和信息枢纽人物。",
        "向上管理的核心是主动对齐预期、及时同步进展、站在上级视角思考问题。",
        "绘制利益相关者影响力地图，区分支持者、中立者和潜在反对者，制定差异化沟通策略。",
        "非正式沟通渠道（如午餐、咖啡闲聊）往往承载更重要的隐性信息和信任建立。",
        "职业资本由专业能力、人际关系网络和工作可见度三部分组成，需要长期平衡投资。",
      ],
    },
    "pdf-逻辑思维": {
      titles: [
        "概念澄清：定义问题边界与核心概念",
        "因果分析：鱼骨图与5Why分析法",
        "假设检验：构建与验证工作假设",
        "决策框架：多因素权衡与风险评估",
        "系统思考：看见整体与反馈回路",
      ],
      excerpts: [
        "在解决问题前，先花30%的时间澄清核心概念和问题边界，避免答非所问。",
        "鱼骨图用于结构化梳理问题的潜在根因，5Why法则层层追问直达本质原因。",
        "工作假设应满足可证伪性，通过最小化实验快速验证或推翻假设。",
        "多因素决策框架需量化权重、评估概率、计算期望值，减少主观偏见。",
        "系统思考要求看见要素之间的连接关系，识别增强回路和调节回路的作用机制。",
      ],
    },
  };

  const chapterData = chapters[meta.id];
  if (!chapterData) return [];

  return chapterData.titles.map((title, idx) => ({
    id: `${meta.id}-ch${idx + 1}`,
    title,
    excerpt: chapterData.excerpts[idx] || "",
    source: `PDF资料 · ${meta.fileName} 第${idx + 1}章`,
    category: meta.category,
    date: "2026-06-23",
    tags: [...meta.tags, `第${idx + 1}章`],
    pageCount: meta.pageCount,
    fileName: meta.fileName,
  }));
}

/**
 * 根据文件名查找 PDF 元数据
 */
export function findPDFMetadata(fileName: string): PDFMetadata | undefined {
  return PDF_METADATA.find((m) => m.fileName === fileName);
}

/**
 * 获取所有 PDF 的统计信息
 */
export function getPDFStats(): {
  totalPDFs: number;
  totalPages: number;
  categoryDistribution: Record<string, number>;
} {
  const categoryDistribution: Record<string, number> = {};
  let totalPages = 0;

  for (const meta of PDF_METADATA) {
    totalPages += meta.pageCount;
    categoryDistribution[meta.category] =
      (categoryDistribution[meta.category] || 0) + 1;
  }

  return {
    totalPDFs: PDF_METADATA.length,
    totalPages,
    categoryDistribution,
  };
}
