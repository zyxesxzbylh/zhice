export interface WorkMethod {
  id: string;
  name: string;
  category: "思维模型" | "操作流程" | "工具应用" | "复盘迭代";
  description: string;
  steps: string[];
  applicableScenarios: string[];
  relatedSOPs: string[];
  difficulty: "入门" | "进阶" | "高级";
  icon: string; // lucide icon name
}

export const METHOD_LIBRARY: WorkMethod[] = [
  {
    id: "swot",
    name: "SWOT分析",
    category: "思维模型",
    description: "分析任务/项目的优势、劣势、机会、威胁，帮助做出全面决策。",
    steps: [
      "列出当前任务/项目的内部优势（Strengths）",
      "列出内部劣势（Weaknesses）",
      "识别外部机会（Opportunities）",
      "识别外部威胁（Threats）",
      "将分析结果整理成矩阵，制定策略"
    ],
    applicableScenarios: ["项目启动前评估", "职业规划", "竞品分析", "决策前分析"],
    relatedSOPs: ["项目启动SOP", "决策评估流程"],
    difficulty: "入门",
    icon: "BarChart3"
  },
  {
    id: "pyramid",
    name: "金字塔原理",
    category: "思维模型",
    description: "结论先行、以上统下、归类分组、逻辑递进的结构化表达方法。",
    steps: [
      "确定核心结论（塔尖）",
      "找出支撑结论的3-7个关键论据",
      "每个论据下再细分具体事实和数据",
      "检查逻辑：上层是下层的概括，下层是上层的支撑",
      "表达时自上而下，先讲结论"
    ],
    applicableScenarios: ["汇报演讲", "写作报告", "邮件沟通", "方案提案"],
    relatedSOPs: ["周报撰写SOP", "项目汇报流程"],
    difficulty: "进阶",
    icon: "Triangle"
  },
  {
    id: "mece",
    name: "MECE法则",
    category: "思维模型",
    description: "相互独立、完全穷尽，确保分析框架不重叠、不遗漏。",
    steps: [
      "明确分析的主题和边界",
      "列出所有可能的分类维度",
      "检查各分类之间是否相互独立（无重叠）",
      "检查所有分类是否完全穷尽（无遗漏）",
      "用树状图或矩阵呈现MECE结构"
    ],
    applicableScenarios: ["问题拆解", "市场调研", "数据分类", "方案设计"],
    relatedSOPs: ["问题分析SOP", "调研设计流程"],
    difficulty: "进阶",
    icon: "GitBranch"
  },
  {
    id: "10-10-10",
    name: "10-10-10法则",
    category: "思维模型",
    description: "从10天、10个月、10年后三个时间维度审视决策，避免短视。",
    steps: [
      "写下当前面临的决策",
      "想象10天后，这个决策会带来什么结果？",
      "想象10个月后，你会如何看待这个决策？",
      "想象10年后，这个决策对你的人生有什么影响？",
      "综合三个时间维度的视角，做出选择"
    ],
    applicableScenarios: ["重大职业选择", "投资决策", "是否接受新项目", "人际关系处理"],
    relatedSOPs: ["决策评估流程", "职业规划SOP"],
    difficulty: "入门",
    icon: "Clock"
  },
  {
    id: "3-step",
    name: "3步处理法",
    category: "操作流程",
    description: "倾听记录→分析解决→跟进确认，高效处理各类工作问题。",
    steps: [
      "倾听记录：完整听取需求/问题，记录关键信息",
      "分析解决：拆解问题根因，制定解决方案并执行",
      "跟进确认：反馈结果，确认对方满意，归档记录"
    ],
    applicableScenarios: ["处理同事需求", "客户问题响应", "跨部门协作", "日常事务处理"],
    relatedSOPs: ["需求处理SOP", "客户服务流程"],
    difficulty: "入门",
    icon: "ListChecks"
  },
  {
    id: "pdca",
    name: "PDCA流程",
    category: "操作流程",
    description: "计划→执行→检查→改进的循环模型，持续优化工作流程。",
    steps: [
      "Plan（计划）：明确目标，制定行动方案",
      "Do（执行）：按计划实施，记录过程数据",
      "Check（检查）：对比结果与目标，分析偏差原因",
      "Act（改进）：总结经验，标准化成功做法，修正问题"
    ],
    applicableScenarios: ["流程优化", "质量管理", "项目复盘", "习惯养成"],
    relatedSOPs: ["项目管理SOP", "质量检查流程"],
    difficulty: "入门",
    icon: "RefreshCw"
  },
  {
    id: "4-section",
    name: "4段式模板",
    category: "操作流程",
    description: "本周成果→存在问题→改进计划→下周待办，结构化周报/日报。",
    steps: [
      "本周成果：列出本周完成的主要工作和成果",
      "存在问题：坦诚描述遇到的困难和未解决的问题",
      "改进计划：针对问题提出具体的改进措施",
      "下周待办：明确下周的重点任务和预期目标"
    ],
    applicableScenarios: ["周报撰写", "日报撰写", "项目阶段总结", "个人周回顾"],
    relatedSOPs: ["周报撰写SOP", "日报模板"],
    difficulty: "入门",
    icon: "FileText"
  },
  {
    id: "pomodoro",
    name: "番茄工作法",
    category: "工具应用",
    description: "25分钟专注工作+5分钟短休息，提升专注力和工作效率。",
    steps: [
      "选择一项待完成的任务",
      "设定番茄钟为25分钟",
      "全神贯注工作，直到番茄钟响起",
      "短暂休息5分钟",
      "每完成4个番茄，进行一次15-30分钟的长休息"
    ],
    applicableScenarios: ["需要高度专注的编程/写作任务", "克服拖延症", "长时间学习"],
    relatedSOPs: ["专注工作SOP", "时间管理流程"],
    difficulty: "入门",
    icon: "Timer"
  },
  {
    id: "kanban",
    name: "任务管理看板",
    category: "工具应用",
    description: "用看板管理个人任务，可视化工作流，提升执行效率。",
    steps: [
      "创建三个基本列：待办/进行中/已完成",
      "将所有任务写成卡片放入待办列",
      "每次只选择1-3个任务移入进行中",
      "完成任务后移到已完成列",
      "每日/每周回顾看板，优化流程"
    ],
    applicableScenarios: ["个人任务管理", "小团队协作", "项目进度跟踪", "多任务并行"],
    relatedSOPs: ["任务管理SOP", "看板使用指南"],
    difficulty: "入门",
    icon: "LayoutGrid"
  },
  {
    id: "lark-base",
    name: "飞书多维表格",
    category: "工具应用",
    description: "用飞书多维表格管理知识和数据，实现信息的结构化沉淀。",
    steps: [
      "确定表格的核心目的和使用场景",
      "设计字段：文本、单选、多选、日期、人员等",
      "创建多个视图：表格视图、看板视图、甘特图视图",
      "建立自动化规则：到期提醒、状态变更通知",
      "定期归档和整理，保持数据更新"
    ],
    applicableScenarios: ["知识库管理", "项目跟踪", "数据收集", "团队协作"],
    relatedSOPs: ["知识管理SOP", "数据整理流程"],
    difficulty: "进阶",
    icon: "Table"
  },
  {
    id: "project-retrospective",
    name: "项目复盘四步法",
    category: "复盘迭代",
    description: "回顾目标→评估结果→分析原因→总结经验，从项目中系统学习。",
    steps: [
      "回顾目标：当初设定的目标是什么？期望的结果是什么？",
      "评估结果：实际发生了什么？与目标的差距在哪里？",
      "分析原因：成功的主要因素是什么？失败的根本原因是什么？",
      "总结经验：学到了什么？下一步如何改进？"
    ],
    applicableScenarios: ["项目结束后复盘", "季度总结", "失败案例分析", "团队回顾会议"],
    relatedSOPs: ["项目复盘SOP", "团队回顾流程"],
    difficulty: "进阶",
    icon: "Repeat"
  },
  {
    id: "daily-retrospective",
    name: "每日下班前小复盘",
    category: "复盘迭代",
    description: "每天下班前5分钟快速回顾：今天做了什么/完成度/做得好/问题/更快方法。",
    steps: [
      "今天做了什么？列出主要完成的任务",
      "完成度如何？评估各项任务的完成质量",
      "做得好的地方是什么？肯定自己的亮点",
      "遇到什么问题？记录阻碍和未解决的困难",
      "有没有更快的方法？思考效率提升空间"
    ],
    applicableScenarios: ["每日工作收尾", "习惯养成", "个人成长", "效率提升"],
    relatedSOPs: ["日报撰写SOP", "个人复盘流程"],
    difficulty: "入门",
    icon: "Sunset"
  }
];

export function getAllMethods(): WorkMethod[] {
  return METHOD_LIBRARY;
}

export function getMethodById(id: string): WorkMethod | undefined {
  return METHOD_LIBRARY.find((m) => m.id === id);
}

export function getMethodsByCategory(cat: WorkMethod["category"]): WorkMethod[] {
  return METHOD_LIBRARY.filter((m) => m.category === cat);
}

export function getMethodsByScenario(scenario: string): WorkMethod[] {
  const q = scenario.toLowerCase();
  return METHOD_LIBRARY.filter((m) =>
    m.applicableScenarios.some((s) => s.toLowerCase().includes(q))
  );
}
