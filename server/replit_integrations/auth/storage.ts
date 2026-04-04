import { users, emailWhitelist, type User, type UpsertUser, type EmailWhitelistEntry } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql, desc, ilike, or } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPlan(id: string, plan: string): Promise<User | undefined>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  updateAccountStatus(id: string, status: 'approved' | 'rejected'): Promise<User | undefined>;
  completeRegistration(id: string, data: { displayName: string; profession: string; organization?: string; primaryIndustry?: string }): Promise<User | undefined>;
  trackPromptUsage(id: string): Promise<{ allowed: boolean; used: number; limit: number }>;
  getAllUsers(search?: string, planFilter?: string, roleFilter?: string): Promise<User[]>;
  countAdmins(): Promise<number>;
  getUserStats(): Promise<{ total: number; byPlan: Record<string, number>; byRole: Record<string, number> }>;
  // Admin role requests
  requestAdminAccess(userId: string, reason?: string): Promise<User | undefined>;
  getAdminRequests(): Promise<User[]>;
  processAdminRequest(userId: string, approve: boolean): Promise<User | undefined>;
  // Email whitelist
  getWhitelist(): Promise<EmailWhitelistEntry[]>;
  addToWhitelist(email: string, addedBy?: string, note?: string, grantRole?: string): Promise<EmailWhitelistEntry>;
  removeFromWhitelist(email: string): Promise<void>;
  isEmailWhitelisted(email: string): Promise<boolean>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if user already exists (returning user)
    const existing = await db.select().from(users).where(eq(users.id, userData.id as string)).limit(1);
    const isReturning = existing.length > 0;

    // All new users are approved by default — app is free to use for registered users
    // Check whitelist only to potentially grant a role (super_admin / admin)
    let grantedRole: string | undefined;
    if (!isReturning && userData.email) {
      const [whitelistEntry] = await db
        .select()
        .from(emailWhitelist)
        .where(eq(emailWhitelist.email, userData.email.toLowerCase().trim()))
        .limit(1);
      if (whitelistEntry?.grantRole) grantedRole = whitelistEntry.grantRole;
    }

    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        accountStatus: 'approved',
        ...(grantedRole ? { role: grantedRole } : {}),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPlan(id: string, plan: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ plan, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async completeRegistration(id: string, data: { displayName: string; profession: string; organization?: string; primaryIndustry?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        displayName: data.displayName,
        profession: data.profession,
        organization: data.organization ?? null,
        primaryIndustry: data.primaryIndustry ?? null,
        registrationCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(search?: string, planFilter?: string, roleFilter?: string): Promise<User[]> {
    let query = db.select().from(users).orderBy(desc(users.createdAt)).$dynamic();
    const conditions = [];
    if (search) {
      conditions.push(or(
        ilike(users.email, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`),
      ));
    }
    if (planFilter && planFilter !== 'all') {
      conditions.push(eq(users.plan, planFilter));
    }
    if (roleFilter && roleFilter !== 'all') {
      conditions.push(eq(users.role, roleFilter));
    }
    if (conditions.length > 0) {
      const { and } = await import("drizzle-orm");
      query = query.where(and(...conditions));
    }
    return query;
  }

  async updateAccountStatus(id: string, status: 'approved' | 'rejected'): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ accountStatus: status, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // ====== Admin Role Requests ======

  async requestAdminAccess(userId: string, _reason?: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ adminRequestStatus: 'pending', updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAdminRequests(): Promise<User[]> {
    return db.select().from(users)
      .where(eq(users.adminRequestStatus, 'pending'))
      .orderBy(desc(users.createdAt));
  }

  async processAdminRequest(userId: string, approve: boolean): Promise<User | undefined> {
    const newRole = approve ? 'admin' : undefined;
    const [user] = await db
      .update(users)
      .set({
        adminRequestStatus: approve ? 'approved' : 'rejected',
        ...(newRole ? { role: newRole } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // ====== Email Whitelist ======
  async getWhitelist(): Promise<EmailWhitelistEntry[]> {
    return db.select().from(emailWhitelist).orderBy(desc(emailWhitelist.createdAt));
  }

  async addToWhitelist(email: string, addedBy?: string, note?: string, grantRole?: string): Promise<EmailWhitelistEntry> {
    const normalized = email.toLowerCase().trim();
    const [entry] = await db
      .insert(emailWhitelist)
      .values({ email: normalized, addedBy, note, grantRole })
      .onConflictDoUpdate({ target: emailWhitelist.email, set: { note, addedBy, grantRole } })
      .returning();
    // If existing user with this email: approve and optionally promote role
    await db.update(users)
      .set({
        accountStatus: 'approved',
        ...(grantRole ? { role: grantRole } : {}),
        updatedAt: new Date(),
      })
      .where(eq(users.email, normalized));
    return entry;
  }

  async removeFromWhitelist(email: string): Promise<void> {
    await db.delete(emailWhitelist).where(eq(emailWhitelist.email, email.toLowerCase().trim()));
  }

  async isEmailWhitelisted(email: string): Promise<boolean> {
    const [entry] = await db.select().from(emailWhitelist).where(eq(emailWhitelist.email, email.toLowerCase().trim())).limit(1);
    return !!entry;
  }

  async countAdmins(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, 'admin'));
    return Number(result[0]?.count ?? 0);
  }

  async getUserStats(): Promise<{ total: number; byPlan: Record<string, number>; byRole: Record<string, number> }> {
    const allUsers = await db.select({ plan: users.plan, role: users.role }).from(users);
    const byPlan: Record<string, number> = {};
    const byRole: Record<string, number> = {};
    for (const u of allUsers) {
      byPlan[u.plan] = (byPlan[u.plan] ?? 0) + 1;
      byRole[u.role ?? 'user'] = (byRole[u.role ?? 'user'] ?? 0) + 1;
    }
    return { total: allUsers.length, byPlan, byRole };
  }

  async trackPromptUsage(id: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return { allowed: false, used: 0, limit: 5 };

    const isStaff = user.role === 'super_admin' || user.role === 'admin' || user.role === 'sub_admin';
    if (isStaff) return { allowed: true, used: 0, limit: Infinity };

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = user.lastPromptDate !== today;

    if (user.plan === 'pro' || user.plan === 'premium' || user.plan === 'advance' || user.plan === 'enterprise') {
      if (isNewDay) {
        await db.update(users)
          .set({ promptsUsedToday: 1, lastPromptDate: today, updatedAt: new Date() })
          .where(eq(users.id, id));
      } else {
        await db.update(users)
          .set({ promptsUsedToday: (user.promptsUsedToday ?? 0) + 1, updatedAt: new Date() })
          .where(eq(users.id, id));
      }
      return { allowed: true, used: (user.promptsUsedToday ?? 0) + 1, limit: Infinity };
    }

    const DAILY_LIMIT = 5;
    const currentUsed = isNewDay ? 0 : (user.promptsUsedToday ?? 0);

    if (currentUsed >= DAILY_LIMIT) {
      return { allowed: false, used: currentUsed, limit: DAILY_LIMIT };
    }

    await db.update(users)
      .set({
        promptsUsedToday: currentUsed + 1,
        lastPromptDate: today,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return { allowed: true, used: currentUsed + 1, limit: DAILY_LIMIT };
  }
}

export const authStorage = new AuthStorage();
