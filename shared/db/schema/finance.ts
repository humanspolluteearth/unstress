import { pgTable, uuid, varchar, doublePrecision, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * FINANCE_TRANSACTIONS Table
 * Simplified transaction ledger aligned with SQLAlchemy models.
 */
export const finance_transactions = pgTable("finance_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  amount: doublePrecision("amount").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'income', 'expense'
  category: varchar("category", { length: 100 }),
  tags: jsonb("tags").default([]),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  description: varchar("description", { length: 1000 }).notNull(),
});

/**
 * FINANCE_NET_WORTH Table
 * Snapshots of financial status over time.
 */
export const finance_net_worth = pgTable("finance_net_worth", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
  assets: doublePrecision("assets").default(0.0),
  liabilities: doublePrecision("liabilities").default(0.0),
  total: doublePrecision("total").default(0.0),
});
