import { pgTable, uuid, varchar, integer, timestamp, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * ACCOUNTS Table
 * Represents the Chart of Accounts (Assets, Liabilities, Equity, Income, Expenses).
 */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // e.g., 'asset', 'liability', 'equity', 'revenue', 'expense'
  description: varchar("description", { length: 1000 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * TRANSACTIONS Table
 * The header for a financial event. 
 * Double-entry integrity is enforced by ensuring the sum of related postings is zero.
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: varchar("description", { length: 1000 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  metadata: varchar("metadata", { length: 2000 }), // For external IDs or JSON-like strings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * POSTINGS Table
 * Individual entries (debits/credits) belonging to a transaction.
 * Amount is stored in cents (Integer) to prevent floating point issues.
 */
export const postings = pgTable("postings", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id)
    .notNull(),
  amount: integer("amount").notNull(), // Positive for debit, negative for credit (or vice versa depending on logic)
  memo: varchar("memo", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
