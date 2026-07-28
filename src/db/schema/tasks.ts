import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const tags = pgTable(
  "tags",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: text("name").notNull(),
    color: text("color").notNull().default("#6b7280"),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameUserIdx: uniqueIndex("tags_name_user_idx").on(table.name, table.userId),
    userIdx: index("tags_user_idx").on(table.userId),
  })
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    parentTaskId: uuid("parent_task_id"),

    title: text("title").notNull(),
    description: text("description"),

    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),

    dueDate: timestamp("due_date", { withTimezone: true }),
    startTime: text("start_time"),
    endTime: text("end_time"),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    isRecurring: boolean("is_recurring").notNull().default(false),
    recurrenceRule: text("recurrence_rule"),
    recurrenceEnd: timestamp("recurrence_end", { withTimezone: true }),

    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    reminderSent: boolean("reminder_sent").notNull().default(false),

    estimatedMinutes: integer("estimated_minutes"),

    valueType: text("value_type"),
    valueScore: integer("value_score"),
    valueDescription: text("value_description"),
    expectedOutcome: text("expected_outcome"),

    background: text("background"),
    progressNotes: jsonb("progress_notes").default([]),
    blockers: text("blockers"),
    deadlineReminderStrategy: text("deadline_reminder_strategy").default("on_due_date"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index("tasks_project_idx").on(table.projectId),
    parentIdx: index("tasks_parent_idx").on(table.parentTaskId),
    statusIdx: index("tasks_status_idx").on(table.status),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
    userProjectDueDateIdx: index("tasks_user_project_due_idx").on(
      table.projectId,
      table.status,
      table.dueDate
    ),
  })
);

export const taskTags = pgTable(
  "task_tags",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.tagId] }),
    taskIdx: index("task_tags_task_idx").on(table.taskId),
    tagIdx: index("task_tags_tag_idx").on(table.tagId),
  })
);

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskTag = typeof taskTags.$inferSelect;
export type NewTaskTag = typeof taskTags.$inferInsert;
