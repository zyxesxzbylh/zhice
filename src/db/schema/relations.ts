import { pgTable, uuid, text, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const taskKnowledge = pgTable('task_knowledge', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull(),
  knowledgeId: uuid('knowledge_id').notNull(),
  relationType: text('relation_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniq: uniqueIndex('tk_unique').on(table.taskId, table.knowledgeId),
}));

export const taskPersonnel = pgTable('task_personnel', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').notNull(),
  name: text('name').notNull(),
  role: text('role'),
  contactInfo: text('contact_info'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const agentHooks = pgTable('agent_hooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  hookType: text('hook_type').notNull(),
  triggerConfig: jsonb('trigger_config').notNull().default({}),
  targetAction: text('target_action').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
