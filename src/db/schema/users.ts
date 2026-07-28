import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    email: text("email").notNull().unique(),

    authId: text("auth_id").unique(),

    name: text("name"),
    avatar: text("avatar"),

    timezone: text("timezone").notNull().default("Asia/Shanghai"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    authIdIdx: uniqueIndex("users_auth_id_idx").on(table.authId),
  })
);

export const userSettings = pgTable(
  "user_settings",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    theme: text("theme").notNull().default("system"),
    language: text("language").notNull().default("zh-CN"),
    weekStartsOn: integer("week_starts_on").notNull().default(1),
    defaultView: text("default_view").notNull().default("schedule"),
    enableNotifications: boolean("enable_notifications").notNull().default(true),
    enableSounds: boolean("enable_sounds").notNull().default(true),
    compactMode: boolean("compact_mode").notNull().default(false),
  }
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
