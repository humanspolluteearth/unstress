import { pgTable, uuid, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

/**
 * TASKS Table
 * Represents user-defined tasks and project milestones.
 */
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  status: varchar("status", { length: 50 }).default("Todo").notNull(),
  priority: varchar("priority", { length: 20 }).default("0").notNull(),
  tags: varchar("tags", { length: 255 }), // Stored as comma-separated or similar for simplicity
  deadline: timestamp("deadline", { withTimezone: true }),
  projectLink: varchar("project_link", { length: 500 }),
  goalId: uuid("goal_id"), // Optional reference to a Goal
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
