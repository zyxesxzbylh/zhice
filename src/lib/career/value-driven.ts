// 价值驱动任务系统
// 帮助用户从"被动响应"转向"主动创造价值"

export interface ValueDrivenTask {
  id: string;
  title: string;
  description?: string;

  // 价值维度
  valueType: ValueType;
  valueScore: number; // 1-10

  // 与职业目标的关联
  careerGoalId?: string;
  skillTags: string[];

  // 影响力范围
  impactScope: "personal" | "team" | "company" | "industry";

  // 复利属性
  isCompoundInterest: boolean;
  compoundDescription?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ValueType =
  | "skill_growth"      // 技能成长
  | "relationship"      // 关系建设
  | "visibility"        // 可见度/影响力
  | "efficiency"        // 效率提升
  | "strategic"         // 战略价值
  | "innovation";       // 创新突破

export const VALUE_TYPE_LABELS: Record<ValueType, string> = {
  skill_growth: "技能成长",
  relationship: "关系建设",
  visibility: "可见度",
  efficiency: "效率提升",
  strategic: "战略价值",
  innovation: "创新突破",
};

export const VALUE_TYPE_DESCRIPTIONS: Record<ValueType, string> = {
  skill_growth: "提升专业能力，为长期竞争力打基础",
  relationship: "建立信任网络，积累社会资本",
  visibility: "让工作被看见，增加晋升机会",
  efficiency: "优化流程，释放时间投入高价值工作",
  strategic: "对齐公司战略，做正确的事",
  innovation: "突破常规，创造差异化价值",
};

/**
 * 价值评估矩阵
 * 根据任务属性计算综合价值分
 */
export function calculateValueScore(task: Partial<ValueDrivenTask>): number {
  let score = 0;

  // 价值类型基础分
  const typeWeights: Record<ValueType, number> = {
    skill_growth: 8,
    relationship: 7,
    visibility: 6,
    efficiency: 7,
    strategic: 9,
    innovation: 8,
  };

  if (task.valueType) {
    score += typeWeights[task.valueType] || 5;
  }

  // 影响力范围加成
  const scopeMultipliers = {
    personal: 1.0,
    team: 1.2,
    company: 1.5,
    industry: 2.0,
  };

  if (task.impactScope) {
    score *= scopeMultipliers[task.impactScope];
  }

  // 复利加成
  if (task.isCompoundInterest) {
    score *= 1.3;
  }

  // 用户主观评分
  if (task.valueScore) {
    score = (score + task.valueScore) / 2;
  }

  return Math.min(10, Math.round(score * 10) / 10);
}

/**
 * 生成价值驱动的任务建议
 */
export function generateValueSuggestions(
  currentTasks: ValueDrivenTask[],
  careerGoal: string
): string[] {
  const suggestions: string[] = [];

  // 分析当前任务的价值分布
  const typeCount = new Map<ValueType, number>();
  currentTasks.forEach((t) => {
    typeCount.set(t.valueType, (typeCount.get(t.valueType) || 0) + 1);
  });

  // 检查价值盲区
  const allTypes = Object.keys(VALUE_TYPE_LABELS) as ValueType[];
  const missingTypes = allTypes.filter((t) => !typeCount.has(t) || (typeCount.get(t) || 0) < 2);

  if (missingTypes.includes("skill_growth")) {
    suggestions.push("💡 你的任务中缺少技能成长类工作，建议安排时间学习一项新技能或深化现有能力");
  }

  if (missingTypes.includes("visibility")) {
    suggestions.push("💡 缺少可见度建设，考虑主动分享项目成果或参与跨部门协作");
  }

  if (missingTypes.includes("strategic")) {
    suggestions.push("💡 战略价值任务较少，尝试从更高视角审视当前工作，寻找与公司目标的结合点");
  }

  // 检查是否过度集中在某类任务
  const maxCount = Math.max(...Array.from(typeCount.values()));
  if (maxCount > currentTasks.length * 0.5) {
    suggestions.push("⚠️ 任务类型过于集中，建议 diversifying，避免能力结构单一");
  }

  // 复利任务检查
  const compoundTasks = currentTasks.filter((t) => t.isCompoundInterest);
  if (compoundTasks.length < 2) {
    suggestions.push("🚀 复利任务不足，尝试将重复性工作自动化或建立可复用的方法论");
  }

  if (suggestions.length === 0) {
    suggestions.push("✅ 价值分布良好，继续保持！");
  }

  return suggestions;
}
