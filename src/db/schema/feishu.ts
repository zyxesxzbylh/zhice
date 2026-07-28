import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const feishuConfig = pgTable('feishu_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  appId: text('app_id'),
  appSecret: text('app_secret'),
  spreadsheetToken: text('spreadsheet_token'),
  syncEnabled: boolean('sync_enabled').default(false).notNull(),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const feishuSyncLog = pgTable('feishu_sync_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  configId: uuid('config_id').notNull(),
  syncType: text('sync_type').notNull(),
  status: text('status').notNull(),
  recordCount: integer('record_count').default(0),
  errorMessage: text('error_message'),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
});

/** 飞书文件记录 —— 跟踪 FlowSync 创建或关联的飞书文件 */
export const feishuFiles = pgTable('feishu_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  /** 本地显示名称 */
  fileName: text('file_name').notNull(),
  /** 文件类型: doc | sheet | bitable | mindnote */
  fileType: text('file_type').notNull(),
  /** 飞书文件完整 URL */
  feishuUrl: text('feishu_url').notNull(),
  /** 飞书文件 token */
  feishuToken: text('feishu_token'),
  /** 来源: created (本系统创建) | linked (外部链接) */
  sourceType: text('source_type').notNull().default('created'),
  /** 关联的知识库条目 ID（如果保存到知识库） */
  knowledgeEntryId: uuid('knowledge_entry_id'),
  /** 关联的复盘 ID */
  retrospectiveId: uuid('retrospective_id'),
  /** 额外元数据（JSON） */
  metadata: jsonb('metadata').default({}),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type FeishuConfig = typeof feishuConfig.$inferSelect;
export type NewFeishuConfig = typeof feishuConfig.$inferInsert;
export type FeishuSyncLog = typeof feishuSyncLog.$inferSelect;
export type FeishuFile = typeof feishuFiles.$inferSelect;
export type NewFeishuFile = typeof feishuFiles.$inferInsert;
