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
  appType: z.string().optional().default('web'),
  appComplexity: z.string().optional().default('simple'),
  quizFocus: z.string().optional().default('komprehensif'),
  podcastHost: z.string().optional().default('Andi'),
  podcastGuest: z.string().optional().default('Sari'),
  podcastStyle: z.string().optional().default('interview'),
  podcastEpisodeLength: z.string().optional().default('15-20 menit'),
  podcastSegments: z.string().optional().default('5'),
  audiobookNarrator: z.string().optional().default(''),
  audiobookTone: z.string().optional().default('conversational'),
  audiobookPace: z.string().optional().default('medium'),
  audiobookChapterFocus: z.string().optional().default('full'),
  audiobookEmphasis: z.string().optional().default('moderate'),
  landingPageStyle: z.string().optional().default('long-form'),
  landingPageGoal: z.string().optional().default('sell'),
  landingPagePrice: z.string().optional().default(''),
  landingPageBonuses: z.string().optional().default(''),
  landingPageCTA: z.string().optional().default('Beli Sekarang'),
  landingPageOutputFormat: z.string().optional().default('copy'),
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

  app.post("/api/review-document", isAuthenticated, async (req, res) => {
    try {
      const { title, docContent } = req.body;
      if (!docContent) return res.status(400).json({ error: "Document content required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah editor dan quality reviewer konten ebook profesional Indonesia. Tugasmu mengevaluasi kualitas dokumen secara objektif dan memberikan skor serta saran perbaikan yang actionable.",
          },
          {
            role: "user",
            content: `Evaluasi kualitas ebook/dokumen berikut secara komprehensif:

Judul: ${title || 'Dokumen Ebook'}

KONTEN (${docContent.split(/\s+/).length} kata):
${docContent.slice(0, 4000)}

Berikan evaluasi dalam format PERSIS seperti ini (jangan ubah format):

===SKOR===
STRUKTUR: [0-100]
KEDALAMAN: [0-100]
KETERBACAAN: [0-100]
KELENGKAPAN: [0-100]
NILAI_JUAL: [0-100]
TOTAL: [rata-rata dari 5 dimensi]
===AKHIR_SKOR===

===RINGKASAN===
[2-3 kalimat penilaian keseluruhan yang jujur]
===AKHIR_RINGKASAN===

===KELEBIHAN===
✅ [kelebihan utama 1]
✅ [kelebihan utama 2]
✅ [kelebihan utama 3]
===AKHIR_KELEBIHAN===

===PERBAIKAN===
🔧 [masalah spesifik 1] → [saran perbaikan konkret]
🔧 [masalah spesifik 2] → [saran perbaikan konkret]
🔧 [masalah spesifik 3] → [saran perbaikan konkret]
🔧 [masalah spesifik 4] → [saran perbaikan konkret]
===AKHIR_PERBAIKAN===

===REKOMENDASI===
[Langkah konkret berikutnya yang harus dilakukan penulis untuk meningkatkan kualitas dokumen ini]
===AKHIR_REKOMENDASI===`,
          },
        ],
        stream: true,
        max_completion_tokens: 1500,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal review dokumen" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to review document" });
      }
    }
  });

  app.post("/api/text-to-speech", isAuthenticated, async (req, res) => {
    try {
      const { text, voice = "nova" } = req.body;
      if (!text) return res.status(400).json({ error: "Text required" });

      // Limit text length for TTS (OpenAI max ~4096 chars per request)
      const truncated = text.slice(0, 4000);

      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
        input: truncated,
        response_format: "mp3",
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Disposition", "inline; filename=narasi.mp3");
      res.send(buffer);
    } catch (error: any) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Gagal membuat audio. " + (error?.message || '') });
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

  app.post("/api/chat-demo", isAuthenticated, async (req, res) => {
    try {
      const { systemPrompt, messages } = req.body;
      if (!systemPrompt) return res.status(400).json({ error: "System prompt required" });
      if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10).map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        stream: true,
        max_completion_tokens: 800,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal memulai chat" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Chat demo failed" });
      }
    }
  });

  app.post("/api/generate-course-syllabus", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, courseDuration, courseFormat, courseGoal } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah instructional designer dan curriculum developer profesional Indonesia yang ahli dalam merancang e-course berkualitas tinggi. Kamu memahami teori belajar, desain modul, dan cara membuat kurikulum yang engaging dan hasil nyata.",
          },
          {
            role: "user",
            content: `Rancang silabus e-course LENGKAP dan DETAIL dari ebook berikut:

Judul Ebook: ${title || topik}
Topik: ${topik}
Target Peserta: ${target || 'umum'}
Durasi Kursus: ${courseDuration || '4 Minggu'}
Format: ${courseFormat || 'Video + Worksheet'}
Tujuan Kursus: ${courseGoal || 'peserta bisa mengaplikasikan semua materi dalam kehidupan nyata'}

Buat silabus dalam format PERSIS ini:

===OVERVIEW===
🎓 NAMA KURSUS: [nama menarik]
📋 DESKRIPSI: [2-3 kalimat positioning kursus]
🎯 HASIL BELAJAR UTAMA: [3-5 bullet point konkret, terukur]
👥 TARGET PESERTA: [deskripsi spesifik]
⏱️ TOTAL DURASI: [estimasi jam belajar]
📦 YANG DIDAPAT PESERTA: [list bonus & deliverables]
===AKHIR_OVERVIEW===

===MODUL===
[Buat 8 modul dengan format per modul sebagai berikut:]

## MODUL [N]: [JUDUL MODUL]
⏱️ Durasi: [X jam]
🎯 Learning Outcome: [Apa yang bisa peserta lakukan setelah modul ini]
📚 Materi:
- Sesi 1: [judul + deskripsi singkat]
- Sesi 2: [judul + deskripsi singkat]
- Sesi 3: [judul + deskripsi singkat]
🛠️ Aktivitas: [tugas/latihan spesifik]
📝 Asesmen: [cara mengukur pemahaman peserta]
💎 Bonus/Resource: [template, worksheet, atau resource pendukung]
===AKHIR_MODUL===

===WORKSHEET===
Template worksheet untuk MODUL 1 yang bisa langsung digunakan peserta:
[Buat worksheet nyata dengan tabel, pertanyaan refleksi, dan space untuk latihan]
===AKHIR_WORKSHEET===

===SERTIFIKAT===
Kriteria kelulusan dan teks sertifikat:
[Buat teks sertifikat yang profesional dan motivatif]
===AKHIR_SERTIFIKAT===`,
          },
        ],
        stream: true,
        max_completion_tokens: 3000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate silabus" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate syllabus" });
      }
    }
  });

  app.post("/api/generate-mini-app", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, docContent } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah product manager dan app designer yang ahli dalam merancang mini web apps berbasis AI untuk pasar Indonesia. Kamu bisa merancang blueprint aplikasi yang spesifik, buildable, dan bernilai bisnis.",
          },
          {
            role: "user",
            content: `Rancang blueprint MINI WEB APP yang lahir dari ebook berikut:

Judul Ebook: ${title || topik}
Topik: ${topik}
Target Pengguna App: ${target || 'pembaca ebook'}
${docContent ? `Ringkasan konten ebook:\n${docContent.slice(0, 1000)}` : ''}

Buat blueprint dalam format PERSIS ini:

===KONSEP===
📱 NAMA APP: [nama yang catchy & relevan]
🎯 TAGLINE: [1 kalimat value proposition]
💡 KONSEP: [2-3 kalimat: apa yang dilakukan app ini dan kenapa orang butuh ini]
🔥 PROBLEM SOLVED: [masalah spesifik yang diselesaikan — dari sudut pandang pengguna]
===AKHIR_KONSEP===

===FITUR===
[5 fitur utama dengan format:]
🔧 FITUR [N]: [Nama Fitur]
Deskripsi: [apa yang bisa dilakukan pengguna]
User Value: [mengapa pengguna butuh fitur ini]
Tech Behind: [teknologi/API yang digunakan]
===AKHIR_FITUR===

===SCREENS===
[5 halaman utama dengan deskripsi wireframe detail:]
📱 HALAMAN [N]: [Nama Halaman]
Layout: [deskripsi elemen UI yang ada]
Aksi Pengguna: [apa yang bisa dilakukan]
Data Ditampilkan: [informasi apa yang muncul]
===AKHIR_SCREENS===

===USERFLOW===
🗺️ USER FLOW (Step by step dari install sampai hasil):
[Langkah 1-10 yang jelas dan konkret]
===AKHIR_USERFLOW===

===TECHSTACK===
⚙️ TECH STACK REKOMENDASI:
Frontend: [framework + library UI]
Backend: [framework/BaaS]
Database: [pilihan + alasan]
AI/API: [AI API yang diintegrasikan]
Hosting: [platform deployment]
Build Time Estimasi: [dengan AI coding tools]
Biaya Bulanan Estimasi: [server + API cost]
===AKHIR_TECHSTACK===

===PROMPT_BUILD===
🤖 PROMPT SIAP PAKAI UNTUK BUILD DI CURSOR/LOVABLE/BOLT:

"[Tulis prompt lengkap dan detail yang bisa langsung di-paste ke AI coding tool untuk memulai build app ini. Min 200 kata, sangat spesifik tentang fitur, UI, tech stack, dan behavior yang diinginkan]"
===AKHIR_PROMPT_BUILD===

===MONETISASI===
💰 STRATEGI MONETISASI:
Model: [freemium / one-time / subscription]
Free Tier: [apa yang gratis]
Paid Tier: [apa yang berbayar + harga dalam IDR]
Revenue Estimasi: [proyeksi realistis per bulan]
===AKHIR_MONETISASI===

===LAUNCH===
🚀 LAUNCH CHECKLIST (10 langkah):
[Langkah 1-10 dari development sampai live]
===AKHIR_LAUNCH===`,
          },
        ],
        stream: true,
        max_completion_tokens: 3000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate blueprint mini app" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate mini app blueprint" });
      }
    }
  });

  app.post("/api/generate-quiz", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, docContent, level } = req.body;
      if (!topik && !title && !docContent) return res.status(400).json({ error: "Topic or content required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah instructional designer dan assessment expert Indonesia yang ahli dalam membuat soal evaluasi yang berkualitas, valid, dan relevan. Soal yang kamu buat selalu kontekstual, tidak ambigu, dan mengukur pemahaman yang sesungguhnya.",
          },
          {
            role: "user",
            content: `Buat SOAL KUIS & ASESMEN LENGKAP untuk ebook berikut:

Judul: ${title || topik}
Topik: ${topik}
Target Pembaca: ${target || 'umum'}
Level: ${level || 'Intermediate'}
${docContent ? `Konten ebook (referensi soal):\n${docContent.slice(0, 2000)}` : ''}

Buat dalam format PERSIS ini:

===MCQ===
BAGIAN A — PILIHAN GANDA (10 Soal)

1. [Pertanyaan yang jelas dan spesifik]
A) [Pilihan]
B) [Pilihan]
C) [Pilihan]
D) [Pilihan]
✅ Jawaban: [Huruf] | [Penjelasan singkat kenapa ini benar]

[Ulangi untuk soal 2-10]
===AKHIR_MCQ===

===TF===
BAGIAN B — BENAR / SALAH (5 Soal)

1. [Pernyataan yang bisa dinilai benar atau salah]
→ [BENAR / SALAH] | Alasan: [penjelasan]

[Ulangi untuk soal 2-5]
===AKHIR_TF===

===ESSAY===
BAGIAN C — ESAI PENDEK (3 Soal)

1. [Pertanyaan terbuka yang mengukur kemampuan analisis/aplikasi]
💡 Kunci Jawaban: [poin-poin yang harus ada dalam jawaban ideal, min 4 poin]

[Ulangi untuk soal 2-3]
===AKHIR_ESSAY===

===CASESTUDY===
BAGIAN D — STUDI KASUS

Skenario:
[Cerita/situasi nyata 3-4 kalimat yang relevan dengan topik]

Pertanyaan:
1. [Pertanyaan analisis]
2. [Pertanyaan solusi]
3. [Pertanyaan evaluasi]

Panduan Penilaian: [Rubrik singkat untuk menilai jawaban peserta]
===AKHIR_CASESTUDY===`,
          },
        ],
        stream: true,
        max_completion_tokens: 3000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate kuis" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate quiz" });
      }
    }
  });

  app.post("/api/generate-monetization", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, industry, pageCount } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah business strategist dan digital product expert Indonesia yang ahli dalam monetisasi ebook, e-course, dan produk digital. Kamu memahami market Indonesia, perilaku konsumen digital, platform jual beli, dan strategi pricing yang efektif. Berikan saran yang spesifik, realistis, dan actionable.",
          },
          {
            role: "user",
            content: `Buat Strategi Monetisasi lengkap untuk ebook berikut:

Judul: ${title || topik}
Topik/Niche: ${topik}
Target Pembaca: ${target || 'umum'}
Niche Industri: ${industry || 'umum'}
${pageCount ? `Estimasi halaman: ${pageCount}` : ''}

Buat strategi LENGKAP dalam format PERSIS ini:

===HARGA===
🏷️ PAKET BASIC — Rp [harga] 
Isi: [apa saja yang termasuk]
Target: [siapa yang cocok beli paket ini]

🏷️ PAKET STANDAR — Rp [harga] ← Rekomendasi Terlaris
Isi: [apa saja yang termasuk — versi lengkap]
Target: [siapa yang cocok]

🏷️ PAKET PREMIUM — Rp [harga]
Isi: [apa saja yang termasuk — dengan bonus eksklusif]
Target: [high-value buyer]

💡 Tips Pricing: [saran konkret tentang psikologi harga, anchor pricing, dll]
===AKHIR_HARGA===

===PLATFORM===
[Ranking 5 platform terbaik untuk jual ebook ini, dengan penjelasan kenapa dan tips spesifik per platform. Contoh: Tokopedia, Gumroad, WhatsApp direct, Telegram group, Instagram DM, Linktree, dll]
===AKHIR_PLATFORM===

===PEMBELI===
🎯 PROFIL PEMBELI IDEAL

Nama Persona: [nama fiktif representatif]
Usia: [range]
Pekerjaan: [profesi umum]
Pain Point Utama: [masalah terbesar yang mendorong pembelian]
Motivasi Beli: [apa yang mereka harapkan]
Channel Temukan Produk: [di mana mereka biasa menemukan produk digital]
Kata yang Beresonansi: [7-10 kata/frasa yang membuat mereka klik]
Red Flag yang Bikin Kabur: [apa yang membuat mereka tidak jadi beli]
===AKHIR_PEMBELI===

===LAUNCH===
🚀 STRATEGI LAUNCH 30 HARI

PRAE-LAUNCH (Hari 1-7):
[langkah konkret]

SOFT LAUNCH (Hari 8-14):
[langkah konkret]

MAIN LAUNCH (Hari 15-21):
[langkah konkret + taktik flash sale/early bird]

POST-LAUNCH (Hari 22-30):
[langkah konkret + follow-up & testimoni]
===AKHIR_LAUNCH===

===UPSELL===
📦 EKOSISTEM PRODUK

Downsell (lebih murah — untuk yang tidak beli):
[ide produk]

Upsell 1 (level berikutnya):
[ide produk + harga estimasi]

Upsell 2 (premium/VIP):
[ide produk + harga estimasi]

Cross-sell (produk pendamping):
[ide produk]

Bundle Idea:
[ide bundle kreatif]
===AKHIR_UPSELL===`,
          },
        ],
        stream: true,
        max_completion_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate strategi monetisasi" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate monetization strategy" });
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

  // ── PODCAST SCRIPT GENERATOR ──────────────────────────────────────────────
  app.post("/api/generate-podcast-script", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, podcastHost, podcastGuest, podcastStyle, podcastEpisodeLength, podcastSegments, docContent } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const styleDesc: Record<string, string> = {
        interview: 'format tanya-jawab mendalam antara Host dan narasumber',
        debate: 'format debat dengan dua sudut pandang berbeda',
        storytelling: 'format bercerita berdasarkan pengalaman nyata',
        educational: 'format edukasi step-by-step yang mudah dipahami',
        casual: 'format obrolan santai namun informatif',
      };

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah penulis script podcast profesional Indonesia yang ahli membuat konten audio yang natural, engaging, dan informatif. Kamu memahami ritme percakapan, cara membuat dialog yang terasa nyata, dan teknik storytelling dalam format audio.`,
          },
          {
            role: "user",
            content: `Buatkan SCRIPT PODCAST LENGKAP DAN SIAP REKAM tentang topik: "${topik}"

Detail Produksi:
- Judul Episode: ${title || topik}
- Host: ${podcastHost || 'Andi'}
- Guest/Narasumber: ${podcastGuest || 'Sari'}
- Format: ${styleDesc[podcastStyle || 'interview']}
- Durasi Target: ${podcastEpisodeLength || '15-20 menit'}
- Jumlah Segmen: ${podcastSegments || '5'} segmen
- Target Pendengar: ${target || 'umum'}
${docContent ? `\nReferensi konten ebook:\n${docContent.slice(0, 1500)}` : ''}

Format script yang WAJIB digunakan:
- Dialog ditulis: **[NAMA HOST/GUEST]:** Teks dialog...
- Notasi produksi dalam kurung siku: [INTRO MUSIK — FADE IN], [JEDA], [TRANSISI], [OUTRO MUSIK]
- Setiap segmen diberi judul: === SEGMEN N: JUDUL SEGMEN ===

Buat script dengan ${podcastSegments || '5'} segmen. Setiap segmen minimal 200-300 kata dialog.
Dialog harus terasa NATURAL, tidak kaku, seperti percakapan nyata.
Gunakan filler words yang wajar: "iya betul", "wah menarik", "hmm", "nah jadi..."`,
          },
        ],
        stream: true,
        max_completion_tokens: 4000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate podcast script" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate podcast script" });
      }
    }
  });

  // ── AUDIOBOOK SCRIPT GENERATOR ────────────────────────────────────────────
  app.post("/api/generate-audiobook-script", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, audiobookNarrator, audiobookTone, audiobookPace, audiobookChapterFocus, audiobookEmphasis, docContent } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const toneDesc: Record<string, string> = {
        conversational: 'santai dan hangat seperti berbicara langsung kepada pendengar',
        authoritative: 'tegas dan meyakinkan seperti seorang pakar',
        warm: 'penuh kehangatan dan empati',
        dramatic: 'dramatis dan penuh penghayatan',
        academic: 'formal dan ilmiah',
        motivational: 'penuh semangat dan energi mendorong tindakan',
      };
      const paceDesc: Record<string, string> = {
        slow: 'lambat dan tenang — banyak [JEDA PENDEK] dan [JEDA PANJANG]',
        medium: 'sedang — standar audiobook profesional',
        fast: 'cepat dan ringkas — langsung ke poin utama',
      };
      const focusDesc: Record<string, string> = {
        full: 'seluruh buku dari awal hingga akhir',
        intro: 'hanya pendahuluan dan bab pertama',
        summary: 'ringkasan setiap bab: poin utama saja',
        highlights: 'highlight terbaik: kutipan dan insight paling impactful',
      };

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah penulis script audiobook profesional Indonesia yang ahli membuat narasi yang enak didengar, mengalir natural, dan mudah dipahami. Kamu mengerti teknik pacing, intonasi, dan cara menulis untuk telinga — bukan untuk mata.`,
          },
          {
            role: "user",
            content: `Buatkan SCRIPT AUDIOBOOK PROFESIONAL DAN SIAP REKAM untuk buku bertema: "${topik}"

Detail Produksi:
- Judul Buku: ${title || topik}
- Narator: ${audiobookNarrator || 'Narator'}
- Gaya Narasi: ${toneDesc[audiobookTone || 'conversational']}
- Pacing: ${paceDesc[audiobookPace || 'medium']}
- Fokus: ${focusDesc[audiobookChapterFocus || 'full']}
- Penekanan Emosi: ${audiobookEmphasis || 'moderate'}
- Target Pendengar: ${target || 'umum'}
${docContent ? `\nReferensi konten ebook:\n${docContent.slice(0, 2000)}` : ''}

NOTASI PRODUKSI yang WAJIB digunakan dalam script:
- [JEDA PENDEK] → jeda 1-2 detik
- [JEDA PANJANG] → jeda 3-5 detik (antar bab/bagian penting)
- [PENEKANAN] → kata berikutnya dibaca lebih pelan dan berat
- [NADA NAIK] / [NADA TURUN] → variasi intonasi
- [MUSIK INTRO] / [MUSIK OUTRO] → transisi antar bab
- [NAPAS] → jeda napas natural narator
- (huruf miring) → baca lebih lambat/ditekankan

FORMAT setiap BAB:
[MUSIK INTRO — FADE IN]
BAB [N]: [JUDUL BAB] (Estimasi durasi: X menit)
[Kalimat pembuka hook yang kuat]
[JEDA PANJANG]
[Narasi isi bab]
Ringkasan bab: "Dalam bab ini kita telah mempelajari..."
[JEDA PANJANG]
"Selanjutnya di bab berikutnya..."
[MUSIK OUTRO — FADE OUT]

Tulis dalam bahasa Indonesia yang natural untuk DIDENGAR — kalimat pendek, max 20-25 kata per kalimat. Gunakan "Anda" (formal).`,
          },
        ],
        stream: true,
        max_completion_tokens: 4000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate audiobook script" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate audiobook script" });
      }
    }
  });

  // ── LANDING PAGE GENERATOR ────────────────────────────────────────────────
  app.post("/api/generate-landing-page", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, landingPageStyle, landingPageGoal, landingPagePrice, landingPageBonuses, landingPageCTA, landingPageOutputFormat, docContent } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const styleMap: Record<string, string> = {
        'long-form': 'Long-Form Sales Letter yang persuasif dengan formula AIDA+PAS',
        'short': 'Short Copy yang ringkas dan langsung ke manfaat utama',
        'vsl': 'VSL Landing Page dengan focus pada video sales letter',
        'webinar': 'Webinar Registration Page untuk mendorong pendaftaran',
      };
      const goalMap: Record<string, string> = {
        'sell': 'arahkan pembaca untuk membeli langsung',
        'lead': 'kumpulkan email/WhatsApp sebagai lead magnet',
        'webinar': 'daftarkan ke webinar/kelas gratis',
        'waitlist': 'masukkan ke waitlist pre-launch',
      };
      const outputInstr: Record<string, string> = {
        'copy': 'Tulis sebagai COPY BERSIH tanpa HTML — teks siap paste ke builder.',
        'html': 'Tulis sebagai HTML LENGKAP dengan inline CSS — siap upload. Gunakan desain modern dengan warna, tombol, dan layout yang menarik.',
        'sections': 'Pisahkan setiap seksi dengan header yang jelas: ===HERO===, ===PROBLEM===, ===SOLUTION===, ===FEATURES===, ===TESTIMONIAL===, ===PRICING===, ===FAQ===, ===CTA===',
      };

      const bonusList = landingPageBonuses?.trim()
        ? landingPageBonuses.split('\n').filter(Boolean).map((b: string, i: number) => `${i + 1}. ${b.trim()}`).join('\n')
        : '';

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah copywriter profesional Indonesia yang ahli dalam direct response marketing, sales letter, dan conversion optimization. Kamu menguasai framework AIDA, PAS, dan teknik copywriting lainnya untuk pasar Indonesia.`,
          },
          {
            role: "user",
            content: `Buatkan LANDING PAGE ${styleMap[landingPageStyle || 'long-form']} untuk ebook berikut:

Judul Ebook: ${title || topik}
Topik: ${topik}
Target Pembaca: ${target || 'umum'}
Harga: ${landingPagePrice || '(belum ditentukan)'}
Tujuan: ${goalMap[landingPageGoal || 'sell']}
Tombol CTA: "${landingPageCTA || 'Beli Sekarang'}"
${bonusList ? `\nBonus Produk:\n${bonusList}` : ''}
${docContent ? `\nReferensi konten ebook:\n${docContent.slice(0, 1500)}` : ''}

FORMAT OUTPUT:
${outputInstr[landingPageOutputFormat || 'copy']}

STRUKTUR WAJIB (sesuaikan dengan gaya ${landingPageStyle || 'long-form'}):

1. HERO SECTION
- Headline utama: benefit-driven, max 10 kata, langsung menyentuh masalah
- Subheadline: perjelas proposisi nilai (1-2 kalimat)
- CTA pertama: "${landingPageCTA || 'Beli Sekarang'}"

2. PROBLEM AGITATION  
- 3-5 masalah konkret yang dirasakan target pembaca
- Gunakan teknik "Sebelum vs Sesudah" atau PAS

3. SOLUSI & UNIQUE VALUE PROPOSITION
- Kenalkan ebook sebagai solusi terbaik
- Apa yang membuatnya berbeda dari solusi lain

4. ISI EBOOK / FITUR
- Daftar bab/materi (dengan manfaat, bukan sekadar nama bab)
- Format: "Di bab ini kamu akan: [manfaat konkret]"

5. UNTUK SIAPA
- ✅ Cocok untuk: (3-5 profil ideal)
- ❌ Bukan untuk: (1-2 yang tidak cocok)

6. TESTIMONI (3 contoh template realistis)
Format: "[Kutipan] — Nama, Pekerjaan"

7. TENTANG PENULIS
Template bio yang bisa dikustomisasi

${bonusList ? `8. SEKSI BONUS
Tampilkan setiap bonus dengan nilai yang dirasakan\n` : ''}

${bonusList ? '9' : '8'}. HARGA & PENAWARAN
- Harga: ${landingPagePrice || '(isi harga Anda)'}
- Urgency copy (stok/waktu terbatas)
- CTA utama: "${landingPageCTA || 'Beli Sekarang'}"

${bonusList ? '10' : '9'}. GARANSI
Template garansi uang kembali

${bonusList ? '11' : '10'}. FAQ (5 pertanyaan + jawaban meyakinkan)

${bonusList ? '12' : '11'}. CLOSING CTA FINAL
Rangkum nilai + CTA akhir yang kuat

Gunakan bahasa yang natural dan conversational — bukan bahasa brosur.
Sertakan angka/data konkret untuk meningkatkan kredibilitas.`,
          },
        ],
        stream: true,
        max_completion_tokens: 4000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate landing page" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate landing page" });
      }
    }
  });

  // Cover HTML Template Generator
  app.post("/api/generate-cover-template", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, target, author, industry, colorScheme, style } = req.body;
      if (!topik && !title) return res.status(400).json({ error: "Topic required" });

      const ebookTitle = title || topik;
      const colorMap: Record<string, string> = {
        professional: '#1a1a2e, #16213e, #0f3460, #e94560',
        warm: '#2d1b69, #11998e, #38ef7d',
        corporate: '#1f2937, #374151, #6366f1, #ffffff',
        energetic: '#f12711, #f5af19',
        nature: '#134e5e, #71b280',
        luxury: '#2c1810, #c9a227, #f5f5dc',
      };
      const paletteName = colorScheme || 'professional';

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah web designer profesional yang ahli membuat landing page dan ebook cover dalam HTML+CSS. Kamu menghasilkan HTML yang indah, modern, dan siap digunakan.`,
          },
          {
            role: "user",
            content: `Buatkan COVER EBOOK sebagai HALAMAN HTML LENGKAP dengan inline CSS yang indah dan profesional.

Detail Ebook:
- Judul: ${ebookTitle}
- Topik: ${topik}
- Target Pembaca: ${target || 'Profesional Indonesia'}
- Penulis/Brand: ${author || 'Ebook Builder Pro'}
- Industri: ${industry || 'Umum'}
- Gaya: ${style || 'Modern & Profesional'}

INSTRUKSI TEKNIS:
- Buat file HTML lengkap dengan <!DOCTYPE html>, <head>, <style>, <body>
- Gunakan HANYA inline CSS dan CSS dalam tag <style> — tidak ada eksternal stylesheet
- Ukuran canvas: 800px lebar × 1131px tinggi (A4 portrait)
- Desain cover harus: gradient background yang menarik, typography hierarchy jelas, ornamen/geometri dekoratif
- Wajib ada: Judul besar (font 52-72px), Subtitle/topik (font 20-28px), nama penulis (font 16-18px), ornamen visual
- Tambahkan badge/label relevan (contoh: "Panduan Lengkap", "Edisi 2025", "Industri Indonesia")
- Gunakan Google Fonts via link (pilih 1-2 font premium: Playfair Display, Montserrat, Inter, Raleway, dll)
- Pastikan ada elemen visual: garis dekoratif, shape geometri, ikon sederhana (unicode/emoji OK)
- Footer cover: website/brand, tahun
- JANGAN tambahkan JavaScript
- Hasil harus SANGAT INDAH dan siap cetak/publish

Gunakan palet warna yang elegan dan sesuai industri ${industry || 'umum'}. Buat desain yang benar-benar WOW dan profesional setara Canva.

Output: HANYA kode HTML lengkap, tidak ada teks lain di luar HTML.`,
          },
        ],
        stream: true,
        max_completion_tokens: 3000,
      });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal generate cover" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to generate cover template" });
      }
    }
  });

  // Riset Ebook - AI Research from keyword/website/youtube topic
  app.post("/api/research-ebook", isAuthenticated, async (req, res) => {
    try {
      const { type, query, industry } = req.body;
      if (!query) return res.status(400).json({ error: "Query required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const typeLabel = type === 'website' ? `analisis konten website: ${query}` :
                        type === 'youtube' ? `topik YouTube/video: ${query}` :
                        `kata kunci: ${query}`;

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Kamu adalah AI market research specialist yang ahli menemukan peluang ebook di pasar Indonesia. Gunakan data tren pasar Indonesia, platform Tokopedia/Shopee, dan kebutuhan pembaca Indonesia.",
          },
          {
            role: "user",
            content: `Lakukan riset mendalam untuk membuat ebook yang laku di Indonesia berdasarkan ${typeLabel}.
${industry ? `Industri fokus: ${industry}` : ''}

Berikan analisis lengkap dengan format berikut:

## 🔍 ANALISIS POTENSI PASAR

**Tren Saat Ini:** [analisis tren topik ini di Indonesia]
**Target Pembeli:** [profil pembeli ideal di Indonesia]
**Platform Terbaik:** [Tokopedia/Shopee/Gumroad/WhatsApp]
**Potensi Harga:** [estimasi harga dalam Rupiah yang realistis]

---

## 💡 5 IDE EBOOK TERBAIK

Untuk setiap ide, format seperti ini:

### 🔥 IDE #N: [JUDUL EBOOK MENARIK]
**Target Pembaca:** [siapa yang butuh ini]
**Pain Point:** [masalah mendalam yang dirasakan]
**Janji:** [hasil spesifik yang dijanjikan]
**Angle Unik:** [kenapa ini berbeda dari yang lain]
**Estimasi Harga:** Rp [angka] - Rp [angka]
**Potensi Platform:** [platform terbaik untuk jual ini]

---

## 📊 REKOMENDASI TERBAIK

**Pilihan Utama:** [judul ide yang paling potensial]
**Alasan:** [kenapa ini paling marketable]
**Langkah Pertama:** [apa yang harus dilakukan user sekarang]

Buat analisis yang sangat spesifik dan actionable untuk pasar Indonesia!`,
          },
        ],
        stream: true,
        max_completion_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Gagal melakukan riset" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to research ebook" });
      }
    }
  });

  // Generate 3D Ebook Mockup - DALL-E 3
  app.post("/api/generate-mockup", isAuthenticated, async (req, res) => {
    try {
      const { title, style } = req.body;
      if (!title) return res.status(400).json({ error: "Title required" });

      const stylePrompts: Record<string, string[]> = {
        book: [
          `Professional 3D book mockup of an Indonesian ebook titled "${title}". Realistic hardcover book floating at 45-degree angle, dramatic studio lighting, shadow on surface, clean white/light gray background, professional product photography style, highly detailed cover with elegant typography, glossy finish, high resolution`,
          `3D rendered ebook cover mockup for "${title}". Softcover book, slight perspective tilt, warm studio light, subtle drop shadow, crisp clean aesthetic, bookstore display style, vibrant professional color palette, Indonesia market professional design`,
        ],
        phone: [
          `Professional 3D mockup of ebook "${title}" displayed on a modern smartphone screen. Elegant phone floating at angle with ebook cover visible on screen, soft studio lighting, clean minimal background, app store style product shot, realistic screen reflection, premium look`,
          `Ebook mockup "${title}" on smartphone. Phone screen showing ebook cover, lifestyle flat lay composition, white marble surface background, soft natural lighting, Instagram-ready product shot, premium minimalist aesthetic`,
        ],
        tablet: [
          `Professional 3D mockup of ebook "${title}" displayed on a tablet/iPad. Realistic tablet floating slightly angled, ebook cover visible on screen, soft studio lighting, clean background, premium product photography, digital reading experience visualization`,
          `Ebook "${title}" on modern tablet screen mockup. Elegant tablet at angle, ebook cover prominently displayed, coffee shop lifestyle background blur, premium look, professional product visualization for marketing`,
        ],
      };

      const prompts = stylePrompts[style || 'phone'] || stylePrompts.phone;

      const results = await Promise.allSettled(
        prompts.map(p =>
          openai.images.generate({
            model: "dall-e-3",
            prompt: p,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          })
        )
      );

      const imageUrls = results.map(r =>
        r.status === 'fulfilled' ? (r.value.data[0]?.url || null) : null
      ).filter(Boolean);

      res.json({ imageUrls });
    } catch (error: any) {
      console.error("Mockup error:", error);
      res.status(500).json({ error: "Gagal membuat mockup. " + (error?.message || '') });
    }
  });

  return httpServer;
}
