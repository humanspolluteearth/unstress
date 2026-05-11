import { pgTable, uuid, varchar, text, boolean, jsonb } from "drizzle-orm/pg-core";

/**
 * GOALS Table
 * Defines hierarchical goals with attributes aligned with SQLAlchemy models.
 */
export const goals = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  markdown_content: text("markdown_content").default(""),
  priority: varchar("priority", { length: 20 }), // critical, high, medium, low
  category: varchar("category", { length: 100 }),
  time_frame: varchar("time_frame", { length: 20 }), // weekly, monthly, yearly
  deadline: varchar("deadline", { length: 50 }),
  label_color: varchar("label_color", { length: 20 }).default("#ffffff"),
  assignee_initials: varchar("assignee_initials", { length: 10 }).default("--"),
  tags: jsonb("tags").default([]),
  links: jsonb("links").default([]),
  references: jsonb("references").default([]),
  internal_tasks: jsonb("internal_tasks").default([]),
  is_current_focus: boolean("is_current_focus").default(false),
});
