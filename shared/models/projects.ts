import { pgTable, varchar, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  name: varchar("name").notNull(),
  projectData: jsonb("project_data").notNull(),
  taskConfig: jsonb("task_config").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const promptHistory = pgTable("prompt_history", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  projectId: varchar("project_id"),
  mode: varchar("mode").notNull(),
  prompt: text("prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upgradeRequests = pgTable("upgrade_requests", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  requestedPlan: varchar("requested_plan").notNull(),
  status: varchar("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type PromptHistoryEntry = typeof promptHistory.$inferSelect;
export type InsertPromptHistory = typeof promptHistory.$inferInsert;
export type UpgradeRequest = typeof upgradeRequests.$inferSelect;
