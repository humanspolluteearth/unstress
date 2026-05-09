import { pgTable, uuid, varchar, timestamp, integer, real } from "drizzle-orm/pg-core";

/**
 * HABIT_DEFINITIONS Table
 * Defines the recurring habits the user wants to track.
 */
export const habitDefinitions = pgTable("habit_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(), // e.g., 'daily', 'weekly'
  unit: varchar("unit", { length: 20 }).default("rep").notNull(),
  two_min_threshold: integer("two_min_threshold").notNull().default(0),
  normal_threshold: integer("normal_threshold").notNull().default(0),
  hard_threshold: integer("hard_threshold").notNull().default(0),
  impossible_threshold: integer("impossible_threshold").notNull().default(0),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(0),
  goalId: uuid("goal_id"), // Optional reference to a Goals module (decoupled)
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * HABIT_LOGS Table
 * Records instances of habit completion or status updates.
 */
export const habitLogs = pgTable("habit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  habitId: uuid("habit_id")
    .references(() => habitDefinitions.id, { onDelete: "cascade" })
    .notNull(),
  value: real("value").notNull().default(0), // reps or minutes
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});
