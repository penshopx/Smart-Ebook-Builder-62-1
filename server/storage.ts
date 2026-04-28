import { randomUUID } from "crypto";
import { db } from "./db";
import { projects, promptHistory, upgradeRequests } from "@shared/models/projects";
import { eq, desc, and } from "drizzle-orm";

export interface SavedProject {
  id: string;
  userId: string;
  name: string;
  projectData: {
    topik: string;
    judul: string;
    target: string;
    language: string;
    outputFormat: string;
    tone: string;
    writingStyle: string;
    aiCharacter: string;
    tujuan: string;
    painPoint: string;
    bigIdea: string;
    hasilRiset: string;
    produk: string;
    level: string;
  };
  taskConfig: {
    selectedEbookId: number;
    selectedEbookLabel: string;
    judulBab: string;
    manualJudulBab: string;
    tujuanBab: string;
    fokusLevel: string;
    jenisTemplate: string;
    topikModul: string;
    durasiScript: string;
    judulScript: string;
    botName: string;
    botRole: string;
    botPersonality: string;
    docType: string;
    docContext: string;
    packType: string;
    courseDuration: string;
    courseFormat: string;
    courseGoal: string;
    marketingAsset: string;
    marketingAngle: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PromptHistory {
  id: string;
  userId: string;
  projectId?: string;
  mode: string;
  prompt: string;
  createdAt: string;
}

export interface IStorage {
  getProjects(userId: string): Promise<SavedProject[]>;
  getProject(id: string, userId: string): Promise<SavedProject | undefined>;
  getProjectByName(userId: string, name: string): Promise<SavedProject | undefined>;
  createProject(userId: string, project: Omit<SavedProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SavedProject>;
  updateProject(id: string, userId: string, project: Partial<SavedProject>): Promise<SavedProject | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  countProjects(userId: string): Promise<number>;

  getPromptHistory(userId: string): Promise<PromptHistory[]>;
  addPromptHistory(userId: string, entry: Omit<PromptHistory, 'id' | 'userId' | 'createdAt'>): Promise<PromptHistory>;
  clearPromptHistory(userId: string): Promise<void>;

  createUpgradeRequest(userId: string, requestedPlan: string): Promise<{ id: string }>;
}

class DatabaseStorage implements IStorage {
  async getProjects(userId: string): Promise<SavedProject[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
    return rows.map(this.toProject);
  }

  async getProject(id: string, userId: string): Promise<SavedProject | undefined> {
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return row ? this.toProject(row) : undefined;
  }

  async getProjectByName(userId: string, name: string): Promise<SavedProject | undefined> {
    const [row] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.name, name)));
    return row ? this.toProject(row) : undefined;
  }

  async createProject(userId: string, project: Omit<SavedProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<SavedProject> {
    const id = randomUUID();
    const now = new Date();
    const [row] = await db
      .insert(projects)
      .values({
        id,
        userId,
        name: project.name,
        projectData: project.projectData as any,
        taskConfig: project.taskConfig as any,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return this.toProject(row);
  }

  async updateProject(id: string, userId: string, updates: Partial<SavedProject>): Promise<SavedProject | undefined> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (updates.name) updateData.name = updates.name;
    if (updates.projectData) updateData.projectData = updates.projectData;
    if (updates.taskConfig) updateData.taskConfig = updates.taskConfig;

    const [row] = await db
      .update(projects)
      .set(updateData)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return row ? this.toProject(row) : undefined;
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async countProjects(userId: string): Promise<number> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));
    return rows.length;
  }

  async getPromptHistory(userId: string): Promise<PromptHistory[]> {
    const rows = await db
      .select()
      .from(promptHistory)
      .where(eq(promptHistory.userId, userId))
      .orderBy(desc(promptHistory.createdAt));
    return rows.map(r => ({
      id: r.id,
      userId: r.userId,
      projectId: r.projectId ?? undefined,
      mode: r.mode,
      prompt: r.prompt,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async addPromptHistory(userId: string, entry: Omit<PromptHistory, 'id' | 'userId' | 'createdAt'>): Promise<PromptHistory> {
    const id = randomUUID();
    const [row] = await db
      .insert(promptHistory)
      .values({
        id,
        userId,
        projectId: entry.projectId ?? null,
        mode: entry.mode,
        prompt: entry.prompt,
      })
      .returning();
    return {
      id: row.id,
      userId: row.userId,
      projectId: row.projectId ?? undefined,
      mode: row.mode,
      prompt: row.prompt,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async clearPromptHistory(userId: string): Promise<void> {
    await db.delete(promptHistory).where(eq(promptHistory.userId, userId));
  }

  async createUpgradeRequest(userId: string, requestedPlan: string): Promise<{ id: string }> {
    const id = randomUUID();
    await db.insert(upgradeRequests).values({ id, userId, requestedPlan });
    return { id };
  }

  private toProject(row: any): SavedProject {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      projectData: row.projectData as SavedProject['projectData'],
      taskConfig: row.taskConfig as SavedProject['taskConfig'],
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    };
  }
}

export const storage = new DatabaseStorage();
