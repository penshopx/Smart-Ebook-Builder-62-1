import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Subscription plan: 'free' | 'pro' | 'premium' | 'advance' | 'enterprise'
  plan: varchar("plan").default("free").notNull(),
  // Daily prompt tracking
  promptsUsedToday: integer("prompts_used_today").default(0).notNull(),
  lastPromptDate: varchar("last_prompt_date").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Plan limits
export const PLAN_LIMITS = {
  free: {
    promptsPerDay: 5,
    maxProjects: 1,
    allowedModes: ['BRAINSTORM', 'BIG_IDEA', 'OUTLINE'],
    exports: ['txt'],
    label: 'Free',
    color: 'gray',
  },
  pro: {
    promptsPerDay: 25,
    maxProjects: 5,
    allowedModes: ['BRAINSTORM', 'BIG_IDEA', 'OUTLINE', 'DRAFT_BAB', 'VIDEO_SCRIPT', 'QUIZ_MAKER', 'EXTEND_TEXT', 'MARKETING_KIT'],
    exports: ['txt', 'pdf'],
    label: 'Pro',
    color: 'blue',
  },
  premium: {
    promptsPerDay: 75,
    maxProjects: 20,
    allowedModes: ['BRAINSTORM', 'BIG_IDEA', 'OUTLINE', 'DRAFT_BAB', 'VIDEO_SCRIPT', 'QUIZ_MAKER', 'EXTEND_TEXT', 'MARKETING_KIT', 'E_COURSE', 'GPT_BUILDER', 'DOCUMENT_GENERATOR', 'MINI_APP'],
    exports: ['txt', 'pdf', 'docx', 'md'],
    label: 'Premium',
    color: 'primary',
  },
  advance: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all',
    exports: ['txt', 'pdf', 'docx', 'md', 'html'],
    label: 'Advance',
    color: 'purple',
  },
  enterprise: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all',
    exports: ['txt', 'pdf', 'docx', 'md', 'html', 'api'],
    label: 'Enterprise',
    color: 'amber',
  },
} as const;
