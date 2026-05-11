import { pgTable, uuid, varchar, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { goals } from "./goals";

/**
 * TASKS Table
 * Represents user-defined tasks and project milestones.
 */
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: integer("priority").default(0).notNull(),
  status: varchar("status", { length: 50 }).default("Todo").notNull(),
  tags: jsonb("tags").default([]),
  deadline: varchar("deadline", { length: 50 }),
  project_link: varchar("project_link", { length: 500 }),
  goal_id: uuid("goal_id").references(() => goals.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
