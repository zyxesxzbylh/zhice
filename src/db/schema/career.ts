import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const careerProfile = pgTable('career_profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id).unique(),
  careerPath: text('career_path'),
  currentLevel: text('current_level'),
  targetLevel: text('target_level'),
  skillTags: jsonb('skill_tags').default([]),
  reviewBaseDate: timestamp('review_base_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type CareerProfile = typeof careerProfile.$inferSelect;
export type NewCareerProfile = typeof careerProfile.$inferInsert;
