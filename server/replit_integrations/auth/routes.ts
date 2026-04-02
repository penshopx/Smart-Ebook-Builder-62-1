import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { PLAN_LIMITS } from "@shared/models/auth";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user (with plan info)
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Calculate today's usage
      const today = new Date().toISOString().split('T')[0];
      const isNewDay = user.lastPromptDate !== today;
      const promptsUsedToday = isNewDay ? 0 : (user.promptsUsedToday ?? 0);
      const plan = user.plan ?? 'free';
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
      const dailyLimit = limits.promptsPerDay === Infinity ? null : limits.promptsPerDay;

      res.json({
        ...user,
        promptsUsedToday,
        dailyLimit,
        plan,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get plan usage details
  app.get("/api/user/plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const today = new Date().toISOString().split('T')[0];
      const isNewDay = user.lastPromptDate !== today;
      const promptsUsedToday = isNewDay ? 0 : (user.promptsUsedToday ?? 0);
      const plan = user.plan ?? 'free';
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
      const dailyLimit = limits.promptsPerDay === Infinity ? null : limits.promptsPerDay;

      res.json({
        plan,
        promptsUsedToday,
        dailyLimit,
        allowedModes: limits.allowedModes,
        exports: limits.exports,
        label: limits.label,
      });
    } catch (error) {
      console.error("Error fetching plan:", error);
      res.status(500).json({ message: "Failed to fetch plan" });
    }
  });

  // Track prompt usage (called after generating a prompt)
  app.post("/api/user/track-prompt", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const result = await authStorage.trackPromptUsage(userId);
      res.json(result);
    } catch (error) {
      console.error("Error tracking prompt:", error);
      res.status(500).json({ message: "Failed to track prompt" });
    }
  });

  // Request plan upgrade (manual flow — sends contact intent)
  app.post("/api/user/upgrade-request", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetPlan } = req.body;
      if (!['pro', 'enterprise'].includes(targetPlan)) {
        return res.status(400).json({ message: "Invalid plan" });
      }
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Return WhatsApp/email contact info for manual upgrade
      const contactInfo = {
        whatsapp: "https://wa.me/6281234567890?text=Halo%20Chaesa%2C%20saya%20ingin%20upgrade%20ke%20paket%20" + targetPlan + "%20untuk%20akun%20" + encodeURIComponent(user.email || userId),
        email: "upgrade@chaesaai.com",
        subject: `Upgrade ke ${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)} - ${user.email || userId}`,
      };

      res.json({ success: true, contactInfo, requestedPlan: targetPlan });
    } catch (error) {
      console.error("Error processing upgrade request:", error);
      res.status(500).json({ message: "Failed to process upgrade request" });
    }
  });

  // Admin: manually set user plan (for manual verification)
  app.post("/api/admin/set-plan", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, plan } = req.body;
      if (!userId || !['free', 'pro', 'enterprise'].includes(plan)) {
        return res.status(400).json({ message: "Invalid userId or plan" });
      }
      const user = await authStorage.updateUserPlan(userId, plan);
      res.json({ success: true, user });
    } catch (error) {
      console.error("Error setting plan:", error);
      res.status(500).json({ message: "Failed to set plan" });
    }
  });
}
