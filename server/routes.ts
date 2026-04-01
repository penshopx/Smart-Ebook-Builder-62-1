import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { getChaesaResponse } from "./chaesa";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

  app.post("/api/generate-cover", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, industry, style, colorScheme } = req.body;
      if (!title && !topik) {
        return res.status(400).json({ error: "Title or topik is required" });
      }

      const styleDescriptions: Record<string, string> = {
        minimalis: "minimalist, clean, simple, lots of white space, subtle typography",
        modern: "modern, bold typography, geometric shapes, dynamic composition",
        profesional: "professional, corporate, elegant, sophisticated, business-style",
        creative: "creative, artistic, vibrant, eye-catching, unique",
        academic: "academic, scholarly, formal, authoritative, structured",
      };

      const colorDescriptions: Record<string, string> = {
        biru: "blue and white color palette",
        hijau: "green and white color palette",
        merah: "deep red and gold color palette",
        gelap: "dark navy and gold premium color palette",
        ungu: "purple and lavender gradient color palette",
        oranye: "orange and warm tones color palette",
      };

      const styleDesc = styleDescriptions[style] || styleDescriptions.modern;
      const colorDesc = colorDescriptions[colorScheme] || colorDescriptions.biru;

      const basePrompt = `Abstract visual background for ebook cover representing "${topik || title}". ${industry && industry !== 'general' ? `Industry theme: ${industry}.` : ''} No text, no letters, no words. Professional publishing quality, portrait 2:3 ratio.`;

      const variantPrompts = [
        `${styleDesc} ${colorDesc}. ${basePrompt} Variant: geometric patterns.`,
        `${styleDesc} ${colorDesc}. ${basePrompt} Variant: flowing organic shapes.`,
        `${styleDesc} ${colorDesc}. ${basePrompt} Variant: abstract light and shadow.`,
        `${styleDesc} ${colorDesc}. ${basePrompt} Variant: bold minimal composition.`,
      ];

      const results = await Promise.allSettled(
        variantPrompts.map(p =>
          openai.images.generate({ model: "dall-e-3", prompt: p, size: "1024x1792", quality: "standard", n: 1 })
        )
      );

      const imageUrls = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value.data[0]?.url)
        .filter(Boolean);

      if (imageUrls.length === 0) {
        return res.status(500).json({ error: "Gagal menghasilkan gambar" });
      }

      res.json({ imageUrls });
    } catch (error: any) {
      console.error("Generate cover error:", error);
      res.status(500).json({ 
        error: "Gagal membuat cover. " + (error?.message || "Silakan coba lagi.") 
      });
    }
  });

  app.post("/api/generate-images", isAuthenticated, async (req, res) => {
    try {
      const { context } = req.body;
      if (!context) {
        return res.status(400).json({ error: "Context is required" });
      }

      const cleanContext = context.trim().slice(0, 300);
      const type = req.body.type || 'illustration';

      const variantPrompts = type === 'infographic' ? [
        `Professional data visualization infographic about: "${cleanContext}". Style: clean modern business chart, bar chart or pie chart aesthetic, blue and white corporate colors, minimal flat design. No actual text or labels visible, purely visual elements.`,
        `Business infographic visual about: "${cleanContext}". Style: modern flat icons, flow diagram, circular process steps, teal and orange corporate palette. Purely symbolic, no readable text.`,
        `Statistical visualization about: "${cleanContext}". Style: elegant minimal dashboard, line graph or area chart aesthetic, white background, accent colors. No text or numbers visible.`,
        `Conceptual infographic about: "${cleanContext}". Style: isometric flat illustration, icon-based, professional report aesthetic, navy and gold palette. No readable text.`,
      ] : [
        `Photorealistic illustration depicting: "${cleanContext}". Style: professional, editorial photography style. No text.`,
        `Digital art illustration depicting: "${cleanContext}". Style: modern flat design, vibrant colors. No text.`,
        `Conceptual artwork depicting: "${cleanContext}". Style: abstract, symbolic, artistic. No text.`,
        `Infographic-style visual depicting: "${cleanContext}". Style: clean, minimal, professional business. No text.`,
      ];

      const results = await Promise.allSettled(
        variantPrompts.map(p =>
          openai.images.generate({ model: "dall-e-3", prompt: p, size: "1024x1024", quality: "standard", n: 1 })
        )
      );

      const imageUrls = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value.data[0]?.url)
        .filter(Boolean);

      if (imageUrls.length === 0) {
        return res.status(500).json({ error: "Gagal menghasilkan gambar" });
      }

      res.json({ imageUrls });
    } catch (error: any) {
      console.error("Generate images error:", error);
      res.status(500).json({
        error: "Gagal membuat gambar. " + (error?.message || "Silakan coba lagi.")
      });
    }
  });

  app.post("/api/generate-thumbnail", isAuthenticated, async (req, res) => {
    try {
      const { title, topik } = req.body;
      if (!title && !topik) return res.status(400).json({ error: "Title or topic required" });
      const subject = title || topik;

      const thumbnailPrompts = [
        `YouTube thumbnail design for an ebook titled "${subject}". Bold dramatic text overlay area, cinematic background with vibrant colors, professional clean layout, high contrast, eye-catching, 16:9 ratio thumbnail style, modern typography space, NO actual readable text in image, dramatic lighting`,
        `Professional YouTube thumbnail for ebook "${subject}". Minimalist flat design, bold color blocks, geometric shapes, clean modern aesthetic, striking contrast, space for title text overlay, 16:9 format, corporate clean style`,
        `YouTube thumbnail for ebook "${subject}". Photorealistic scene with dramatic depth of field, bokeh background, professional studio lighting, space for bold text, vibrant saturated colors, thumbnail-optimized composition`,
        `YouTube thumbnail design for "${subject}". Dark moody cinematic style, gradient overlay, glowing accents, futuristic tech aesthetic, space for text, dramatic shadows and highlights, high production quality`,
      ];

      const results = await Promise.allSettled(
        thumbnailPrompts.map(p =>
          openai.images.generate({
            model: "dall-e-3",
            prompt: p,
            n: 1,
            size: "1792x1024",
            quality: "standard",
          })
        )
      );

      const imageUrls = results.map(r =>
        r.status === 'fulfilled' ? (r.value.data[0]?.url || null) : null
      ).filter(Boolean);

      res.json({ imageUrls });
    } catch (error: any) {
      console.error("Thumbnail error:", error);
      res.status(500).json({ error: "Gagal membuat thumbnail. " + (error?.message || '') });
    }
  });

  app.post("/api/suggest-topics", isAuthenticated, async (req, res) => {
    try {
      const { niche, industry } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah market research expert yang ahli menemukan pain point dan topik ebook yang laku dijual di Indonesia.",
          },
          {
            role: "user",
            content: `Generate 10 ide topik ebook PREMIUM yang akan laku keras di Indonesia untuk niche/industri: "${niche || industry || 'bisnis digital'}".

Setiap ide harus:
- Menyentuh "luka berdarah" (masalah mendesak yang orang MATI-MATIAN ingin selesaikan)
- Spesifik dan punya target pembaca jelas
- Menjanjikan hasil nyata dan terukur

Format SETIAP ide seperti ini:
---
🔥 IDE #N: [JUDUL EBOOK MENARIK]
👥 Target: [siapa yang butuh ini]
😣 Pain Point: [masalah mendalam yang dirasakan]
✅ Janji: [hasil spesifik yang dijanjikan]
💡 Angle: [pendekatan unik / hook]
---

Tulis 10 ide yang benar-benar berbeda dan menarik.`,
          },
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate ide" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to suggest topics" });
      }
    }
  });

  app.post("/api/generate-youtube-seo", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, docSummary } = req.body;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah YouTube SEO expert dan content strategist Indonesia. Buat metadata yang dioptimasi untuk viral dan ditemukan di search.",
          },
          {
            role: "user",
            content: `Buat YouTube & Social Media SEO Pack lengkap untuk video promosi ebook berikut:

Judul Ebook: ${title || topik}
Topik: ${topik}
${docSummary ? `Ringkasan: ${docSummary.slice(0, 300)}` : ''}

Buat SEMUA bagian berikut:

===== JUDUL VIDEO =====
5 variasi judul YouTube yang clickbait tapi honest (pakai angka, emosi, atau pertanyaan)

===== DESKRIPSI YOUTUBE =====
Deskripsi lengkap 200-300 kata (hook + value + CTA subscribe + link placeholder + keyword-rich)

===== TAGS YOUTUBE =====
30 tags relevan (mix: broad, medium, long-tail) — pisahkan dengan koma

===== HASHTAG INSTAGRAM/TIKTOK =====
25 hashtag campuran (populer + niche + lokal Indonesia) untuk reels/tiktok

===== HOOK PEMBUKA VIDEO (30 detik) =====
Script hook pembuka yang bikin orang tidak skip (30 detik pertama yang krusial)

===== THUMBNAIL CONCEPT =====
Deskripsi konsep thumbnail yang proven clickable (warna, elemen, teks overlay, ekspresi)

Tulis semuanya dalam Bahasa Indonesia yang powerful dan menjual.`,
          },
        ],
        stream: true,
        max_completion_tokens: 2048,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate SEO pack" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate YouTube SEO" });
      }
    }
  });

  app.post("/api/generate-marketing-kit", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, industry, docSummary } = req.body;
      if (!title && !topik) return res.status(400).json({ error: "Title or topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const systemPrompt = `Kamu adalah copywriter dan marketing strategist profesional Indonesia yang ahli dalam membuat materi pemasaran produk digital (ebook, e-course, info produk). Tulis dengan gaya yang meyakinkan, emosional, dan persuasif khas market Indonesia. Gunakan bahasa yang hangat dan natural.`;

      const userPrompt = `Buat Marketing Kit lengkap untuk ebook/produk digital berikut:

Judul: ${title || topik}
Topik: ${topik}
Target Pembaca: ${target || 'umum'}
Industri/Niche: ${industry || 'umum'}
${docSummary ? `Ringkasan konten: ${docSummary.slice(0, 500)}` : ''}

Buat SEMUA bagian berikut secara lengkap (JANGAN dipersingkat):

===== SALES PAGE COPY =====
Headline utama (powerful, problem-aware)
Sub-headline (promise + timeframe)
3 Pain Points yang dirasakan target pembaca
5 Benefit utama ebook ini (dengan format: BENEFIT → PENJELASAN 1 kalimat)
Social proof placeholder (format testimoni)
Call to Action (CTA utama + urgency)

===== POSTINGAN INSTAGRAM =====
Caption panjang (hook + cerita + value + CTA + hashtag)
Ide 5 konten carousel (judul slide 1-5)

===== POSTINGAN LINKEDIN =====
Post profesional (hook + problem + solusi + value + CTA)

===== EMAIL MARKETING =====
Subject line (5 variasi A/B test)
Email nurturing sequence #1: "Perkenalan" (subjek + body lengkap)
Email nurturing sequence #2: "Value/Tips" (subjek + body lengkap)
Email nurturing sequence #3: "Hard Sell" (subjek + body lengkap)

===== BROADCAST WHATSAPP =====
Pesan WA broadcast pendek (maks 200 kata, personal, CTA jelas)
Pesan WA follow-up (maks 150 kata)

Tulis semuanya dalam Bahasa Indonesia yang natural dan menjual.`;

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_completion_tokens: 4096,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Marketing kit error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal membuat marketing kit" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate marketing kit" });
      }
    }
  });

  app.post("/api/generate-script", isAuthenticated, async (req, res) => {
    try {
      const { title, docContent, duration } = req.body;
      if (!docContent) return res.status(400).json({ error: "Document content required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const systemPrompt = `Kamu adalah scriptwriter profesional yang ahli mengubah konten ebook menjadi script narasi video/podcast yang enak didengar. Gaya penulisannya: conversational, mengalir, mudah dipahami saat dibacakan keras. Seperti gaya dosen atau trainer yang asyik ngobrol dengan peserta.`;

      const userPrompt = `Ubah konten ebook berikut menjadi Script Presentasi Video/Voice-Over yang profesional.

Judul Ebook: ${title || 'Ebook'}
Durasi target: ${duration || '10-15 menit'}

KONTEN EBOOK:
${docContent.slice(0, 3500)}

INSTRUKSI:
- Mulai dengan INTRO yang menarik (sapa penonton, perkenalkan topik, jelaskan apa yang akan dipelajari)
- Ubah setiap bab/bagian menjadi segmen script dengan [SEGMEN X] header
- Gunakan transisi antar segmen yang natural ("Nah, sekarang kita masuk ke bagian berikutnya...", "Menarik bukan? Sekarang...")
- Tambahkan [JEDA] untuk tanda berhenti sejenak
- Tambahkan [PENEKANAN] untuk kata/kalimat yang perlu ditekankan
- Akhiri dengan OUTRO yang kuat (rangkuman + ajakan action + closing)
- Gaya bahasa: santai tapi profesional, seperti ngobrol langsung dengan penonton
- Tulis LENGKAP, bukan ringkasan

Format setiap segmen:
[SEGMEN N: JUDUL SEGMEN]
(Teks script lengkap yang siap dibacakan...)`;

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_completion_tokens: 4096,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Script gen error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal membuat script" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate script" });
      }
    }
  });

  app.post("/api/generate-document", async (req, res) => {
    try {
      const { prompt, mode } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI writing assistant yang ahli membuat konten ebook dan dokumen profesional dalam Bahasa Indonesia. Buat konten yang lengkap, terstruktur, dan berkualitas tinggi sesuai instruksi. Gunakan format yang rapi dengan paragraf yang jelas. Jangan gunakan markdown symbols seperti ### atau ** - gunakan teks biasa yang terstruktur dengan baik.",
          },
          { role: "user", content: prompt },
        ],
        stream: true,
        max_completion_tokens: 4096,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Generate document error:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal membuat dokumen" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate document" });
      }
    }
  });

  return httpServer;
}
