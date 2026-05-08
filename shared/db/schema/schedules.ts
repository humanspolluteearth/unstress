import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

/**
 * EVENTS Table
 * Represents scheduled events in the system.
 */
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  goalId: uuid("goal_id"), // Optional reference to the Goals module
});

/**
 * TIME_BLOCKS Table
 * Represents reserved blocks of time (e.g., Deep Work, Rest).
 */
export const timeBlocks = pgTable("time_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
});
