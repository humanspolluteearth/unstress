import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * HABIT_DEFINITIONS Table
 * Defines the recurring habits the user wants to track.
 */
export const habitDefinitions = pgTable("habit_definitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(), // e.g., 'daily', 'weekly'
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
  status: varchar("status", { length: 50 }).notNull(), // e.g., 'completed', 'missed', 'skipped'
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});
