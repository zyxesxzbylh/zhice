/**
 * 避坑预警检测器
 *
 * 根据上下文数据检测用户可能遇到的问题并生成预警提示，
 * 帮助职场新人养成主动汇报、价值驱动、定期复盘等好习惯。
 */

/* ------------------------------------------------------------------ *
 *  Interfaces
 * ------------------------------------------------------------------ */

/** 单条检测规则 */
export interface WarningRule {
  id: string;
  /** 规则触发标识 */
  signal: string;
  /** 预警文案 */
  message: string;
  /** 严重级别 */
  level: "info" | "warning" | "tip";
  /** 检测函数 */
  check: (context: WarningContext) => boolean;
}

/** 检测上下文 */
export interface WarningContext {
  tasks: Array<{
    status: string;
    valueGoal?: string;
    dueDate?: string | null;
    completedAt?: string | null;
  }>;
  projects: Array<{ id: string }>;
  retrospectives: Array<{ id: string }>;
  daysSinceLastTask: number;
  daysSinceLastRetro: number;
  activeMethodCount: number;
}

/** 最终输出的预警 */
export interface Warning {
  id: string;
  message: string;
  level: "info" | "warning" | "tip";
  action?: string;
  actionUrl?: string;
}

/* ------------------------------------------------------------------ *
 *  检测规则定义
 * ------------------------------------------------------------------ */

const RULES: WarningRule[] = [
  // 规则1：连续3天无任务记录
  {
    id: "no-task-3days",
    signal: "inactive_3days",
    message: "已连续3天未更新任务，主动向领导询问工作安排是成长的开始",
    level: "warning",
    check: (ctx) => ctx.daysSinceLastTask >= 3,
  },
  // 规则2：任务只有标题无价值描述
  {
    id: "task-no-value",
    signal: "missing_value_goal",
    message: "试试填写任务价值，帮助聚焦核心目标",
    level: "info",
    check: (ctx) => {
      const activeTasks = ctx.tasks.filter(
        (t) => t.status !== "done"
      );
      if (activeTasks.length === 0) return false;
      const noValue = activeTasks.filter(
        (t) => !t.valueGoal || t.valueGoal.trim() === ""
      );
      return noValue.length >= activeTasks.length * 0.5;
    },
  },
  // 规则3：有截止日期任务未完成
  {
    id: "overdue-tasks",
    signal: "overdue_tasks",
    message: "", // 动态生成
    level: "warning",
    check: (ctx) => {
      const now = new Date();
      const overdue = ctx.tasks.filter((t) => {
        if (t.status === "done" || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
      });
      return overdue.length > 0;
    },
  },
  // 规则4：从未发起过复盘
  {
    id: "never-retro",
    signal: "no_retrospective",
    message: "本周已完成任务，花5分钟记录成长吧",
    level: "tip",
    check: (ctx) => {
      const hasCompleted = ctx.tasks.some((t) => t.status === "done");
      return hasCompleted && ctx.retrospectives.length === 0;
    },
  },
  // 规则5：周五未写周复盘
  {
    id: "friday-no-retro",
    signal: "friday_no_weekly_retro",
    message: "周五了，记录本周学到的方法",
    level: "tip",
    check: (ctx) => {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=周日, 5=周五
      return dayOfWeek === 5 && ctx.daysSinceLastRetro >= 5;
    },
  },
  // 规则6：同时实践多个方法
  {
    id: "too-many-methods",
    signal: "method_overload",
    message: "贪多嚼不烂，建议先专注一个方法直到形成习惯",
    level: "info",
    check: (ctx) => ctx.activeMethodCount > 3,
  },
];

/* ------------------------------------------------------------------ *
 *  检测函数
 * ------------------------------------------------------------------ */

/**
 * 根据上下文运行所有检测规则，返回触发的预警列表。
 *
 * 规则3（过期任务）的消息会动态替换 `N` 为实际过期任务数。
 */
export function detectWarnings(context: WarningContext): Warning[] {
  const warnings: Warning[] = [];

  for (const rule of RULES) {
    if (!rule.check(context)) continue;

    let message = rule.message;

    // 规则3：动态替换过期任务数量
    if (rule.id === "overdue-tasks") {
      const now = new Date();
      const count = context.tasks.filter((t) => {
        if (t.status === "done" || !t.dueDate) return false;
        return new Date(t.dueDate) < now;
      }).length;
      message = `你有${count}个任务已过期，建议调整计划或拆分任务`;
    }

    warnings.push({
      id: rule.id,
      message,
      level: rule.level,
    });
  }

  return warnings;
}

/**
 * 导出规则列表（供调试或 UI 展示使用）。
 */
export function getRules(): WarningRule[] {
  return RULES;
}
