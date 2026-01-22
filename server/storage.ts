import { randomUUID } from "crypto";

export interface SavedProject {
  id: string;
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
  projectId?: string;
  mode: string;
  prompt: string;
  createdAt: string;
}

export interface IStorage {
  getProjects(): Promise<SavedProject[]>;
  getProject(id: string): Promise<SavedProject | undefined>;
  createProject(project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedProject>;
  updateProject(id: string, project: Partial<SavedProject>): Promise<SavedProject | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  getPromptHistory(): Promise<PromptHistory[]>;
  addPromptHistory(entry: Omit<PromptHistory, 'id' | 'createdAt'>): Promise<PromptHistory>;
  clearPromptHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, SavedProject>;
  private promptHistory: Map<string, PromptHistory>;

  constructor() {
    this.projects = new Map();
    this.promptHistory = new Map();
  }

  async getProjects(): Promise<SavedProject[]> {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getProject(id: string): Promise<SavedProject | undefined> {
    return this.projects.get(id);
  }

  async createProject(
    project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SavedProject> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const savedProject: SavedProject = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.set(id, savedProject);
    return savedProject;
  }

  async updateProject(
    id: string,
    updates: Partial<SavedProject>
  ): Promise<SavedProject | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;

    const updated: SavedProject = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getPromptHistory(): Promise<PromptHistory[]> {
    return Array.from(this.promptHistory.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async addPromptHistory(
    entry: Omit<PromptHistory, 'id' | 'createdAt'>
  ): Promise<PromptHistory> {
    const id = randomUUID();
    const historyEntry: PromptHistory = {
      ...entry,
      id,
      createdAt: new Date().toISOString(),
    };
    this.promptHistory.set(id, historyEntry);
    return historyEntry;
  }

  async clearPromptHistory(): Promise<void> {
    this.promptHistory.clear();
  }
}

export const storage = new MemStorage();
