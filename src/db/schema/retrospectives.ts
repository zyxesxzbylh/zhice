import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const retrospectives = pgTable(
  "retrospectives",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: text("type").notNull().default("daily"),
    projectId: uuid("project_id"),
    taskIds: jsonb("task_ids").default([]),

    date: text("date").notNull(),

    energyLevel: integer("energy_level").notNull().default(5),
    focusLevel: integer("focus_level").notNull().default(5),
    satisfaction: integer("satisfaction").notNull().default(5),

    tomorrowPriority: text("tomorrow_priority"),

    biggestWin: text("biggest_win"),
    biggestChallenge: text("biggest_challenge"),
    lessonLearned: text("lesson_learned"),

    skillUsed: text("skill_used"),
    newInsight: text("new_insight"),

    aiSummary: text("ai_summary"),
    aiSuggestions: text("ai_suggestions"),
    trendAnalysis: text("trend_analysis"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userDateIdx: index("retrospectives_user_date_idx").on(table.userId, table.date),
    dateIdx: index("retrospectives_date_idx").on(table.date),
    userCreatedIdx: index("retrospectives_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
  })
);

export type Retrospective = typeof retrospectives.$inferSelect;
export type NewRetrospective = typeof retrospectives.$inferInsert;
