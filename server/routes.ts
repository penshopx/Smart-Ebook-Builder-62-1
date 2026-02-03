import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { getChaesaResponse } from "./chaesa";

const projectDataSchema = z.object({
  topik: z.string(),
  judul: z.string(),
  target: z.string(),
  language: z.string(),
  outputFormat: z.string(),
  tone: z.string(),
  writingStyle: z.string(),
  aiCharacter: z.string(),
  tujuan: z.string(),
  painPoint: z.string(),
  bigIdea: z.string(),
  hasilRiset: z.string(),
  produk: z.string(),
  level: z.string(),
});

const taskConfigSchema = z.object({
  selectedEbookId: z.number(),
  selectedEbookLabel: z.string(),
  judulBab: z.string(),
  manualJudulBab: z.string(),
  tujuanBab: z.string(),
  fokusLevel: z.string(),
  jenisTemplate: z.string(),
  topikModul: z.string(),
  durasiScript: z.string(),
  judulScript: z.string(),
  botName: z.string(),
  botRole: z.string(),
  botPersonality: z.string(),
  docType: z.string(),
  docContext: z.string(),
  packType: z.string(),
  courseDuration: z.string(),
  courseFormat: z.string(),
  courseGoal: z.string(),
  marketingAsset: z.string(),
  marketingAngle: z.string(),
});

const createProjectSchema = z.object({
  name: z.string().min(1),
  projectData: projectDataSchema,
  taskConfig: taskConfigSchema,
});

const promptHistorySchema = z.object({
  projectId: z.string().optional(),
  mode: z.string(),
  prompt: z.string(),
});

const chatMessageSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional().default([])
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication (BEFORE other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/projects", isAuthenticated, async (_req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id as string);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid project data", details: parsed.error.issues });
      }
      const project = await storage.createProject(parsed.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = createProjectSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid project data", details: parsed.error.issues });
      }
      const project = await storage.updateProject(req.params.id as string, parsed.data);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id as string);
      if (!deleted) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  app.get("/api/history", async (_req, res) => {
    try {
      const history = await storage.getPromptHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const parsed = promptHistorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid history data", details: parsed.error.issues });
      }
      const entry = await storage.addPromptHistory(parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to add history entry" });
    }
  });

  app.delete("/api/history", async (_req, res) => {
    try {
      await storage.clearPromptHistory();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear history" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const parsed = chatMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      }
      
      const { message, history } = parsed.data;
      const response = await getChaesaResponse(message, history);
      res.json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to get response from Chaesa" });
    }
  });

  return httpServer;
}
