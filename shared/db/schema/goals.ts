import { pgTable, uuid, varchar, text, boolean, primaryKey } from "drizzle-orm/pg-core";
import { tasks } from "./tasks";

/**
 * GOALS Table
 * Defines hierarchical goals with self-referencing relationships.
 */
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(), // 'weekly', 'monthly', 'yearly'
  is_current_focus: boolean("is_current_focus").default(false).notNull(),
  parent_id: uuid("parent_id").references(() => goals.id),
});

/**
 * GOAL_TASKS Join Table
 * Links goals to tasks for automated progress tracking.
 */
export const goal_tasks = pgTable("goal_tasks", {
  goal_id: uuid("goal_id").references(() => goals.id, { onDelete: "cascade" }).notNull(),
  task_id: uuid("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.goal_id, t.task_id] }),
}));
