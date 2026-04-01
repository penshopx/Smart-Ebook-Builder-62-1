import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPlan(id: string, plan: string): Promise<User | undefined>;
  trackPromptUsage(id: string): Promise<{ allowed: boolean; used: number; limit: number }>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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

  async trackPromptUsage(id: string): Promise<{ allowed: boolean; used: number; limit: number }> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user) return { allowed: false, used: 0, limit: 5 };

    const today = new Date().toISOString().split('T')[0];
    const isNewDay = user.lastPromptDate !== today;

    // Pro/Enterprise: unlimited
    if (user.plan === 'pro' || user.plan === 'enterprise') {
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

    // Free: 5 per day
    const DAILY_LIMIT = 5;
    const currentUsed = isNewDay ? 0 : (user.promptsUsedToday ?? 0);

    if (currentUsed >= DAILY_LIMIT) {
      return { allowed: false, used: currentUsed, limit: DAILY_LIMIT };
    }

    // Allow and track
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
