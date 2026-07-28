import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: text("name").notNull(),
    description: text("description"),

    flowTemplateId: uuid("flow_template_id").references(
      () => flowTemplates.id,
      { onDelete: "set null" }
    ),

    currentStage: text("current_stage"),
    category: text("category"),
    color: text("color"),
    dueDate: text("due_date"),

    progressStatus: text("progress_status")
      .notNull()
      .default("in_progress"),

    status: text("status").notNull().default("active"),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("projects_user_idx").on(table.userId),
    statusIdx: index("projects_status_idx").on(table.status),
    flowTemplateIdx: index("projects_flow_template_idx").on(table.flowTemplateId),
  })
);

export const flowTemplates = pgTable(
  "flow_templates",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: text("name").notNull(),
    description: text("description"),

    stages: text("stages").notNull(),

    deadline: text("deadline"),

    isDefault: boolean("is_default").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    defaultIdx: index("flow_templates_default_idx").on(table.isDefault),
  })
);

export const flowInstances = pgTable(
  "flow_instances",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    templateId: uuid("template_id")
      .notNull()
      .references(() => flowTemplates.id, { onDelete: "cascade" }),

    stageChecklistStatus: text("stage_checklist_status").notNull(),

    stageTimeLimits: text("stage_time_limits"),

    currentStageIndex: integer("current_stage_index").notNull().default(0),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index("flow_instances_project_idx").on(table.projectId),
    templateIdx: index("flow_instances_template_idx").on(table.templateId),
  })
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type FlowTemplate = typeof flowTemplates.$inferSelect;
export type NewFlowTemplate = typeof flowTemplates.$inferInsert;
export type FlowInstance = typeof flowInstances.$inferSelect;
export type NewFlowInstance = typeof flowInstances.$inferInsert;
