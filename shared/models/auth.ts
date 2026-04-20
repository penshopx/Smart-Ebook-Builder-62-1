import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

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
  // Role hierarchy: 'user' | 'sub_admin' | 'admin' | 'super_admin'
  role: varchar("role").default("user").notNull(),
  // Account access status: 'approved' | 'rejected'
  // All registered users are approved by default — no waiting required to use the app
  accountStatus: varchar("account_status").default("approved").notNull(),
  // Admin role request: null | 'pending' | 'approved' | 'rejected'
  // Users can apply for admin role; only Super Admin can approve
  adminRequestStatus: varchar("admin_request_status"),
  // Registration / onboarding profile
  displayName: varchar("display_name"),
  profession: varchar("profession"),
  organization: varchar("organization"),
  primaryIndustry: varchar("primary_industry"),
  registrationCompleted: boolean("registration_completed").default(false).notNull(),
  // Daily prompt tracking
  promptsUsedToday: integer("prompts_used_today").default(0).notNull(),
  lastPromptDate: varchar("last_prompt_date").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Email whitelist table — pre-approved emails that get auto-approved and optionally a role on first login
export const emailWhitelist = pgTable("email_whitelist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  addedBy: varchar("added_by"),
  note: varchar("note"),
  // If set, the user will be automatically granted this role when they first log in
  // e.g. 'super_admin' or 'admin'
  grantRole: varchar("grant_role"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailWhitelistEntry = typeof emailWhitelist.$inferSelect;
export type InsertEmailWhitelist = typeof emailWhitelist.$inferInsert;

// Plan limits — monetization disabled, all plans have full access
export const PLAN_LIMITS = {
  free: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all' as const,
    exports: ['txt', 'pdf', 'docx', 'md', 'html', 'api'],
    label: 'Free',
    color: 'gray',
  },
  pro: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all' as const,
    exports: ['txt', 'pdf', 'docx', 'md', 'html', 'api'],
    label: 'Pro',
    color: 'blue',
  },
  premium: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all' as const,
    exports: ['txt', 'pdf', 'docx', 'md', 'html', 'api'],
    label: 'Premium',
    color: 'primary',
  },
  advance: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all' as const,
    exports: ['txt', 'pdf', 'docx', 'md', 'html', 'api'],
    label: 'Advance',
    color: 'purple',
  },
  enterprise: {
    promptsPerDay: Infinity,
    maxProjects: Infinity,
    allowedModes: 'all' as const,
    exports: ['txt', 'pdf', 'docx', 'md', 'html', 'api'],
    label: 'Enterprise',
    color: 'amber',
  },
} as const;
