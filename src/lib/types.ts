export type TaskStatus = "todo" | "in_progress" | "done";

/**
 * Task priority.
 *
 * The original three-value scale ("high" | "medium" | "low") is
 * extended with "urgent" for critical tasks.
 */
export type TaskPriority = "urgent" | "high" | "medium" | "low";

export type ProjectCategory = "work" | "personal" | "study" | "health" | "finance" | "life";

/**
 * Reminder state machine.
 *  - `none`     — no reminder configured.
 *  - `set`      — reminder armed, will fire at `reminderAt`.
 *  - `sent`     — reminder already fired.
 *  - `snoozed`  — user dismissed; will re-fire later.
 */
export type ReminderState = "none" | "set" | "sent" | "snoozed";

/* ------------------------------------------------------------------ *
 *  Tag / TaskTag
 * ------------------------------------------------------------------ */

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
}

/* ------------------------------------------------------------------ *
 *  Task
 * ------------------------------------------------------------------ */

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  startTime: string | null;
  endTime: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;

  tags?: Tag[];
  reminderAt?: string | null;
  recurrenceRule?: string | null;
  estimatedMinutes?: number | null;

  // --- New fields from redesign ---
  /** Task background description. */
  background?: string | null;
  /** Progress notes as JSON array. */
  progressNotes?: { content: string; timestamp: string }[] | null;
  /** Current blockers. */
  blockers?: string | null;
  /** Reminder strategy (e.g. "on_due_date", "1_day_before"). */
  deadlineReminderStrategy?: string | null;
}

/* ------------------------------------------------------------------ *
 *  Project
 * ------------------------------------------------------------------ */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  currentStage: string | null;
  flowTemplateId: string | null;
  category: ProjectCategory | null;
  color: string | null;
  dueDate: string | null;
  taskCount: number;
  completedCount: number;
  createdAt: string;
  tasks?: Task[];
}

export interface FlowStage {
  name: string;
  checklist: string[];
  dueDate?: string;
}

export interface FlowTemplate {
  id: string;
  name: string;
  stages: FlowStage[];
  deadline?: string;
  createdAt: string;
}

export interface FlowInstance {
  id: string;
  projectId: string;
  templateId: string;
  stageChecklistStatus: Record<string, boolean[]>;
  stageTimeLimits: Record<string, number> | null;
}

/* ------------------------------------------------------------------ *
 *  Knowledge Relation
 * ------------------------------------------------------------------ */

export type KnowledgeRelationType = 'reference' | 'output' | 'dependency';

export interface TaskKnowledge {
  id: string;
  taskId: string;
  knowledgeId: string;
  relationType: KnowledgeRelationType;
}

/* ------------------------------------------------------------------ *
 *  Task Personnel
 * ------------------------------------------------------------------ */

export interface TaskPersonnel {
  id: string;
  taskId: string;
  name: string;
  role?: string;
  contactInfo?: string;
}

/* ------------------------------------------------------------------ *
 *  Career Profile
 * ------------------------------------------------------------------ */

export interface CareerProfile {
  id: string;
  userId: string;
  careerPath?: string;
  currentLevel?: string;
  targetLevel?: string;
  skillTags: string[];
  reviewBaseDate?: string;
}

/* ------------------------------------------------------------------ *
 *  Retrospective
 * ------------------------------------------------------------------ */

export type RetrospectiveType = 'daily' | 'weekly' | 'monthly' | 'annual';

export interface Retrospective {
  id: string;
  userId: string;
  type: RetrospectiveType;
  projectId?: string;
  taskIds: string[];
  energyLevel: number;
  focusLevel: number;
  satisfaction: number;
  aiSummary?: string;
  aiSuggestions?: string;
  trendAnalysis?: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ *
 *  Feishu Integration
 * ------------------------------------------------------------------ */

export interface FeishuConfig {
  id: string;
  userId: string;
  appId?: string;
  spreadsheetToken?: string;
  syncEnabled: boolean;
}

export interface FeishuSyncLog {
  id: string;
  userId: string;
  configId: string;
  syncType: string;
  status: 'success' | 'failed' | 'in_progress';
  recordCount: number;
  errorMessage?: string;
  syncedAt: string;
}

export interface FeishuFile {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'doc' | 'sheet' | 'bitable';
  feishuUrl: string;
  feishuToken?: string;
  sourceType: 'created' | 'linked';
  knowledgeEntryId?: string;
  retrospectiveId?: string;
  metadata?: Record<string, unknown>;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ *
 *  Activity Events & Agent Hooks
 * ------------------------------------------------------------------ */

export type ActivityEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.completed'
  | 'task.deleted'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'knowledge.added'
  | 'knowledge.updated'
  | 'review.generated'
  | 'feishu.synced';

export interface AgentHook {
  id: string;
  userId: string;
  hookType: 'cron' | 'event' | 'manual';
  triggerConfig: Record<string, unknown>;
  targetAction: string;
  enabled: boolean;
}

/* ------------------------------------------------------------------ *
 *  Constants
 * ------------------------------------------------------------------ */

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "待开始",
  in_progress: "进行中",
  done: "已完成",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "紧急",
  high: "高",
  medium: "中",
  low: "低",
};

export const CATEGORIES: { id: ProjectCategory; label: string; icon: string }[] = [
  { id: "work", label: "工作", icon: "💼" },
  { id: "personal", label: "个人", icon: "👤" },
  { id: "study", label: "学习", icon: "📚" },
  { id: "health", label: "健康", icon: "💪" },
  { id: "finance", label: "财务", icon: "💰" },
  { id: "life", label: "生活", icon: "🏠" },
];
