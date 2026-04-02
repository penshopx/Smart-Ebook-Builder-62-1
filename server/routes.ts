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
        model: "gpt-4o",
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
        model: "gpt-4o",
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
        model: "gpt-4o",
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
      const { title, topik, target, industry, docSummary, price, authorName: mktAuthor, bonuses: mktBonuses } = req.body;
      if (!title && !topik) return res.status(400).json({ error: "Title or topic required" });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const systemPrompt = `Kamu adalah copywriter dan marketing strategist profesional Indonesia yang ahli dalam membuat materi pemasaran produk digital (ebook, e-course, info produk). Tulis dengan gaya yang meyakinkan, emosional, dan persuasif khas market Indonesia. Gunakan bahasa yang hangat dan natural.`;

      const userPrompt = `Buat Marketing Kit LENGKAP 7 bagian untuk ebook/produk digital berikut:

Judul: ${title || topik}
Topik: ${topik}
Target Pembaca: ${target || 'umum'}
Industri/Niche: ${industry || 'umum'}
${price ? `Harga Produk: ${price}` : ''}
${mktAuthor ? `Nama Penulis/Penjual: ${mktAuthor}` : ''}
${mktBonuses ? `Bonus yang tersedia: ${mktBonuses}` : ''}
${docSummary ? `Ringkasan konten: ${docSummary.slice(0, 500)}` : ''}

Buat SEMUA 7 bagian berikut secara lengkap (JANGAN dipersingkat, JANGAN lewati satu pun):

===== SALES PAGE COPY =====
Headline utama (powerful, problem-aware, max 10 kata)
Sub-headline (promise + timeframe)
3 Pain Points yang dirasakan target pembaca
5 Benefit utama ebook ini (format: BENEFIT → PENJELASAN 1 kalimat)
Social proof placeholder (format 3 testimoni)
Call to Action (CTA utama + urgency copy)

===== POSTINGAN INSTAGRAM =====
Caption panjang (hook + cerita + value + CTA + hashtag 10-15 tagar relevan)
Ide 5 konten carousel (judul slide 1-5 dengan deskripsi singkat)
Story poll idea: 2 opsi yang relevan
Bio link copy yang menarik

===== POSTINGAN LINKEDIN =====
Post profesional (hook + problem + solusi + value + CTA)
Format: paragraf pendek, no bullet, personal tone, 200-300 kata
Hashtag 5 profesional

===== EMAIL MARKETING =====
Subject line (5 variasi A/B test dengan preview text)
Email #1 — "Perkenalan" (subjek + body lengkap 150-200 kata)
Email #2 — "Value/Tips Gratis" (subjek + body lengkap 150-200 kata)
Email #3 — "Hard Sell" (subjek + body lengkap dengan urgensi)

===== BROADCAST WHATSAPP =====
Pesan WA broadcast utama (maks 200 kata, personal, CTA jelas dengan link placeholder)
Pesan WA follow-up hari ke-3 (maks 150 kata)
Pesan WA closing/last chance (maks 120 kata, urgensi tinggi)

===== TIKTOK SCRIPT =====
Script video TikTok pendek (30-60 detik):
• Hook 3 detik pertama (kata pembuka yang bikin orang berhenti scroll)
• Body (nilai utama yang diberikan, 20-40 detik)
• CTA akhir (arahkan ke link bio, 5-10 detik)
• Caption TikTok dengan hashtag trending Indonesia (#bukudigital #ebookgratis #jualan dll)
• Ide 3 variasi hook alternatif untuk A/B test
• Saran audio/sound TikTok yang trending

===== TOKOPEDIA SHOPEE LISTING =====
Judul produk SEO-optimized (maks 70 karakter, sertakan kata kunci utama)
Deskripsi produk lengkap:
• Paragraf pembuka (hook + janji utama)
• Isi/konten ebook (bullet poin 5-7 item)
• Untuk siapa ebook ini (3 profil ideal)
• Apa yang akan didapat pembaca (5 manfaat konkret)
• Spesifikasi produk (format: PDF/digital, jumlah halaman estimasi, bahasa)
• Garansi & cara pengiriman digital
Tag/keyword toko (15-20 kata kunci relevan, pisah dengan koma)
Harga coret suggestion dan strategi bundling

Tulis SEMUA 7 bagian lengkap dalam Bahasa Indonesia yang natural dan menjual.`;

      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
        max_completion_tokens: 6000,
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
        model: "gpt-4o",
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
        model: "gpt-4o",
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
      const { title, topik, target, author, mockupUrl, syllabusSnippet, landingPageStyle, landingPageGoal, landingPagePrice, landingPageBonuses, landingPageCTA, landingPageOutputFormat, docContent } = req.body;
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
        model: "gpt-4o",
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
Penulis/Author: ${author || 'Pakar di bidang ini'}
Harga: ${landingPagePrice || '(belum ditentukan)'}
Tujuan: ${goalMap[landingPageGoal || 'sell']}
Tombol CTA: "${landingPageCTA || 'Beli Sekarang'}"
${bonusList ? `\nBonus Produk:\n${bonusList}` : ''}
${docContent ? `\nReferensi konten ebook:\n${docContent.slice(0, 1500)}` : ''}
${syllabusSnippet ? `\nStruktur E-Course:\n${syllabusSnippet}` : ''}
${mockupUrl ? `\nNote: Tersedia gambar mockup ebook untuk visual produk.` : ''}

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
${author ? `Nama: ${author}\nTulis bio singkat yang membangun kredibilitas ${author} sebagai ahli di bidang ${topik || title}.` : 'Template bio yang bisa dikustomisasi'}

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
        model: "gpt-4o",
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
        model: "gpt-4o",
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
      const { title, author, style } = req.body;
      if (!title) return res.status(400).json({ error: "Title required" });

      const byLine = author ? ` by ${author}` : '';
      const stylePrompts: Record<string, string[]> = {
        book: [
          `Professional 3D book mockup of an Indonesian ebook titled "${title}"${byLine}. Realistic hardcover book floating at 45-degree angle, dramatic studio lighting, shadow on surface, clean white/light gray background, professional product photography style, highly detailed cover with elegant typography, glossy finish, high resolution`,
          `3D rendered ebook cover mockup for "${title}"${byLine}. Softcover book, slight perspective tilt, warm studio light, subtle drop shadow, crisp clean aesthetic, bookstore display style, vibrant professional color palette, Indonesia market professional design`,
        ],
        phone: [
          `Professional 3D mockup of ebook "${title}"${byLine} displayed on a modern smartphone screen. Elegant phone floating at angle with ebook cover visible on screen, soft studio lighting, clean minimal background, app store style product shot, realistic screen reflection, premium look`,
          `Ebook mockup "${title}" on smartphone. Phone screen showing ebook cover, lifestyle flat lay composition on white marble surface, soft natural lighting, Instagram-ready product shot, premium minimalist aesthetic${author ? `, author: ${author}` : ''}`,
        ],
        tablet: [
          `Professional 3D mockup of ebook "${title}"${byLine} displayed on a tablet/iPad. Realistic tablet floating slightly angled, ebook cover visible on screen, soft studio lighting, clean background, premium product photography, digital reading experience visualization`,
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

  // Generate VSL Script (Video Sales Letter)
  app.post("/api/generate-vsl", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, guarantee, painPoint } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah copywriter VSL (Video Sales Letter) profesional Indonesia kelas dunia. 
Spesialisasi: naskah video penjualan yang mengonversi penonton menjadi pembeli dalam 5-10 menit.
Gaya: storytelling emosional, direct response copywriting, bahasa Indonesia conversational, FOMO, urgency.
Struktur wajib VSL: HOOK → MASALAH → AGITASI → SOLUSI → BUKTI → PENAWARAN → BONUS → GARANSI → URGENSI → CTA.`;

      const userPrompt = `Buat VSL Script (Video Sales Letter) lengkap untuk:
- Topik/Produk: ${topikFallback}
- Judul Ebook/Produk: ${judul || topikFallback}
- Target Audiens: ${target || 'Orang Indonesia yang ingin sukses di bidang ini'}
- Harga: ${price || 'Rp297.000'}
- Nama Author/Creator: ${authorName || 'Tim Ahli'}
- Garansi: ${guarantee || 'Garansi uang kembali 30 hari'}
- Pain Point Utama: ${painPoint || 'Susah memulai, tidak tahu caranya'}

Format output dengan LABEL SECTION yang jelas:

===== HOOK (0-15 detik) =====
[Hook kuat yang langsung mengena. Pertanyaan retorik atau statement mengejutkan]

===== MASALAH (15-60 detik) =====
[Identifikasi masalah utama yang dirasakan target audiens secara spesifik dan relatable]

===== AGITASI (60-120 detik) =====
[Perbesar rasa sakit dan konsekuensi jika masalah tidak diatasi. Bangun empati mendalam]

===== KISAH/KREDENSIAL (120-180 detik) =====
[Cerita personal atau kisah klien sukses sebagai bukti sosial. Sertakan angka konkret]

===== SOLUSI (180-240 detik) =====
[Perkenalkan produk/ebook sebagai solusi. Jelaskan CARA KERJA, bukan fitur]

===== APA YANG DIDAPAT (240-300 detik) =====
[Detail konten/materi lengkap yang akan didapat. Breakdown tiap bagian + value-nya]

===== BUKTI & TESTIMONI (300-360 detik) =====
[Social proof: screenshot, angka, hasil nyata, testimonial singkat dari pembeli]

===== PENAWARAN EKSKLUSIF (360-420 detik) =====
[Harga asli → Harga spesial. Breakdown nilai total vs harga yang dibayar. BONUS items]

===== GARANSI (420-450 detik) =====
[Garansi berani yang menghilangkan semua risiko di pihak pembeli]

===== URGENSI & KELANGKAAN (450-480 detik) =====
[Alasan valid kenapa harus beli SEKARANG. Deadline, slot terbatas, harga naik]

===== CTA FINAL (480-500 detik) =====
[Call-to-action kuat dan jelas. Langkah mudah cara membeli/daftar. Ulangi manfaat utama]

===== CATATAN PRODUKSI =====
[Tips delivery: kapan harus pause, penekanan kata, ekspresi, tempo bicara]

Buat selengkap mungkin, natural, persuasif, dan cocok untuk audiens Indonesia.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("VSL error:", error);
      res.status(500).json({ error: "Gagal membuat VSL script. " + (error?.message || '') });
    }
  });

  // Generate Email Drip Sequence (7 emails)
  app.post("/api/generate-email-sequence", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, painPoint } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah email marketing specialist Indonesia dengan keahlian drip campaign dan copywriting konversi tinggi.
Spesialisasi: email sequence yang membangun trust, memberikan value, lalu mengonversi pembaca jadi pembeli.
Gaya: personal, warm, storytelling, tidak terlalu salesy di awal, natural conversation Indonesia.`;

      const userPrompt = `Buat Email Drip Sequence 7 Email untuk promosi:
- Topik/Produk: ${topikFallback}
- Judul: ${judul || topikFallback}
- Target Pembaca: ${target || 'Orang Indonesia yang tertarik dengan topik ini'}
- Harga: ${price || 'Rp297.000'}
- Author: ${authorName || 'Penulis Ahli'}
- Pain Point: ${painPoint || 'Belum punya panduan yang tepat'}

Buat 7 email dengan format:

===== EMAIL 1: WELCOME & HOOK (Hari 1) =====
Subject: [3 pilihan subject line A/B/C]
Preview Text: [Preview text menarik]
---
[Isi email: Perkenalan personal, berikan 1 quick win/value gratis, setting ekspektasi series ini]

===== EMAIL 2: STORY & PROBLEM (Hari 2) =====
Subject: [3 pilihan subject line]
Preview Text: [Preview text]
---
[Isi email: Cerita relatable tentang masalah yang dihadapi target audiens. Empati penuh]

===== EMAIL 3: CONTENT VALUE (Hari 3) =====
Subject: [3 pilihan subject line]
Preview Text: [Preview text]
---
[Isi email: Berikan tip/insight berharga dari ebook. Soft mention produk di akhir]

===== EMAIL 4: SOCIAL PROOF (Hari 5) =====
Subject: [3 pilihan subject line]
Preview Text: [Preview text]
---
[Isi email: Kisah sukses/testimoni, angka konkret, hasil nyata. Mulai singgung solusi]

===== EMAIL 5: THE OFFER (Hari 7) =====
Subject: [3 pilihan subject line]
Preview Text: [Preview text]
---
[Isi email: Perkenalkan produk secara langsung. Full offer dengan harga, bonus, garansi]

===== EMAIL 6: OBJECTION HANDLER (Hari 8) =====
Subject: [3 pilihan subject line]
Preview Text: [Preview text]
---
[Isi email: Jawab 3-5 keberatan/pertanyaan paling umum dengan logika dan empati]

===== EMAIL 7: LAST CHANCE (Hari 9) =====
Subject: [3 pilihan subject line]
Preview Text: [Preview text]
---
[Isi email: Urgency + deadline. Ringkasan semua yang didapat. CTA final yang kuat]

===== TIPS IMPLEMENTASI =====
[Platform yang direkomendasikan: MailChimp, ConvertKit, Brevo, dll. Setup automation flow]

Buat setiap email minimal 200-300 kata, natural, persuasif, tidak spam, cocok untuk audiens Indonesia.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.75,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Email sequence error:", error);
      res.status(500).json({ error: "Gagal membuat email sequence. " + (error?.message || '') });
    }
  });

  // Generate Content Calendar 30 Hari
  app.post("/api/generate-content-calendar", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, platforms } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';
      const platformList = platforms || 'Instagram, TikTok, LinkedIn, Facebook';

      const systemPrompt = `Anda adalah social media strategist Indonesia yang spesialis dalam content marketing untuk produk digital.
Keahlian: content calendar yang seimbang antara edukasi, entertaining, dan selling (80/20 rule).
Output: kalender konten yang actionable, spesifik, dan siap eksekusi.`;

      const userPrompt = `Buat Content Calendar 30 Hari untuk promosi ebook/produk digital:
- Topik/Produk: ${topikFallback}
- Judul: ${judul || topikFallback}
- Target Audiens: ${target || 'Masyarakat Indonesia yang ingin belajar dan berkembang'}
- Platform: ${platformList}

Format kalender dengan tema mingguan:

===== MINGGU 1: AWARENESS & HOOK (Hari 1-7) =====
TEMA: Kenalkan masalah dan bangun awareness

Hari 1 | [Platform]:
- Format: [Reels/Carousel/Thread/Post]
- Hook: [Kalimat pembuka]
- Konten: [Deskripsi isi konten]
- Caption: [Caption siap pakai]
- CTA: [Call to action]
- Hashtag: [5-10 hashtag relevan]

[Hari 2-7 dengan format sama]

===== MINGGU 2: EDUCATION & VALUE (Hari 8-14) =====
TEMA: Berikan nilai, bangun trust

[Hari 8-14]

===== MINGGU 3: SOCIAL PROOF & STORYTELLING (Hari 15-21) =====
TEMA: Bukti, testimoni, dan kisah inspiratif

[Hari 15-21]

===== MINGGU 4: LAUNCH & KONVERSI (Hari 22-30) =====
TEMA: Launching, penawaran, dan urgensi

[Hari 22-30]

===== CATATAN STRATEGI =====
- Jadwal posting optimal per platform
- Tips untuk re-purpose konten lintas platform
- Metrik yang harus dipantau
- Tools gratis yang direkomendasikan

Buat detail, spesifik, dan langsung bisa dieksekusi oleh content creator pemula sekalipun.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Content calendar error:", error);
      res.status(500).json({ error: "Gagal membuat content calendar. " + (error?.message || '') });
    }
  });

  // Generate Meta Ads / FB-IG Ads Copy
  app.post("/api/generate-meta-ads", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, painPoint, objective } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah Meta Ads copywriter Indonesia expert yang sudah menghasilkan ratusan iklan winning dengan ROAS tinggi.
Spesialisasi: Facebook Ads + Instagram Ads untuk produk digital (ebook, kursus, info-produk).
Gaya: Direct response, pattern interrupt, emosi kuat, scroll-stopping, conversational Indonesia.
Insight: Audiens Indonesia sangat responsif terhadap pain point, angka konkret, FOMO, dan kisah sukses nyata.`;

      const userPrompt = `Buat Meta Ads Copy Pack lengkap untuk:
- Produk/Ebook: ${topikFallback}
- Judul: ${judul || topikFallback}  
- Target Audiens: ${target || 'Masyarakat Indonesia 25-45 tahun yang ingin penghasilan tambahan'}
- Harga: ${price || 'Rp97.000'}
- Author: ${authorName || 'Pakar Berpengalaman'}
- Pain Point Utama: ${painPoint || 'Susah cari penghasilan, tidak tahu harus mulai dari mana'}
- Objective: ${objective || 'Konversi — mendorong klik ke landing page'}

Format output:

===== HOOK VARIATIONS (5 pilihan) =====
[5 hook/kalimat pembuka yang scroll-stopping. Masing-masing 1-2 kalimat. Langsung ke pain point atau angka mengejutkan]

===== PRIMARY TEXT — SHORT (100-150 kata) =====
[Copy pendek untuk mobile. Emotional hook + problem + solusi + CTA singkat. Pakai emoji strategis]

===== PRIMARY TEXT — LONG (250-350 kata) =====  
[Copy panjang storytelling. Hook → Story → Pain Agitation → Reveal → Social Proof singkat → Offer → CTA]

===== HEADLINE VARIATIONS (5 pilihan) =====
[Headline 5-10 kata yang clickbait tapi honest. Fokus pada benefit atau angka]

===== DESCRIPTION / LINK DESCRIPTION (3 pilihan) =====
[Teks di bawah headline, 20-30 kata, reinforce CTA]

===== VIDEO HOOK SCRIPT (15 detik) =====
[Script video hook untuk Reels/TikTok Ads. Kalimat pembuka 3-5 detik + inti pesan 10 detik. Visual suggestion]

===== AUDIENCE TARGETING SUGGESTIONS =====
[Rekomendasi interest targeting dan lookalike audience yang relevan untuk Meta Ads]

===== SPLIT TEST MATRIX =====
[3 variasi angle berbeda untuk split testing: 1) Pain-based 2) Result/Aspiration-based 3) Social proof-based. Masing-masing 1 primary text pendek]

===== CATATAN STRATEGIS =====
[Tips bidding, budget split test, waktu optimal publish, pixel event yang direkomendasikan]

Buat semua copy dalam Bahasa Indonesia yang natural, tidak kaku, dan sangat relatable untuk audiens Indonesia.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3500,
        temperature: 0.85,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Meta ads error:", error);
      res.status(500).json({ error: "Gagal membuat Meta Ads copy. " + (error?.message || '') });
    }
  });

  // Generate WA Closing Script (CS WhatsApp Closing)
  app.post("/api/generate-wa-closing", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, guarantee } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah pakar CS (Customer Service) closing WhatsApp untuk produk digital Indonesia dengan conversion rate tinggi.
Spesialisasi: teknik closing via WA chat yang natural, tidak pushy, membangun trust, dan mengonversi leads menjadi pembeli.
Gaya: Bahasa Indonesia conversational, hangat, profesional, empati tinggi, memahami psikologi pembeli Indonesia.`;

      const userPrompt = `Buat WA Closing Script Pack lengkap untuk CS produk digital:
- Produk/Ebook: ${topikFallback}
- Judul: ${judul || topikFallback}
- Target Pembeli: ${target || 'Orang Indonesia yang ingin penghasilan tambahan'}
- Harga: ${price || 'Rp97.000'}
- Author: ${authorName || 'Pakar Berpengalaman'}
- Garansi: ${guarantee || 'Garansi uang kembali jika tidak puas'}

Format output:

===== OPENING SCRIPT (Sambut Leads Baru) =====
[3 variasi pesan sambutan pertama yang hangat dan profesional ketika ada yang DM/chat setelah klik iklan]

===== FOLLOW-UP SEQUENCE (5 Pesan) =====
[Follow-up 1: H+1 (tanya kabar/minat)
Follow-up 2: H+2 (berikan value/info tambahan)
Follow-up 3: H+3 (social proof baru)
Follow-up 4: H+5 (penawaran + urgency)
Follow-up 5: H+7 (last chance)]

===== HANDLING OBJECTIONS =====
[Script untuk 8 keberatan paling umum:]
1. "Mahal" / "Kemahalan"
2. "Nanti dulu" / "Pikir-pikir dulu"
3. "Saya sudah punya ilmunya"
4. "Belum ada waktu"
5. "Apa bedanya dengan yang gratis?"
6. "Takut scam / tidak percaya"
7. "Bayarnya ribet"
8. "Belum yakin hasilnya"

===== CLOSING TECHNIQUES =====
[5 teknik closing berbeda:]
1. Assumptive Close
2. Urgency/Scarcity Close
3. Social Proof Close
4. Guarantee Close
5. Summary/Benefit Close

===== POST-PURCHASE UPSELL SCRIPT =====
[Script untuk tawaran upsell setelah pembeli konfirmasi bayar — tawarkan produk lain atau paket upgrade]

===== BROADCAST TEMPLATE (untuk existing leads) =====
[Template pesan broadcast WA untuk dikirim ke semua leads yang belum convert — 2 variasi]

===== CATATAN CLOSING =====
[Tips waktu terbaik follow up, tone yang tepat, kapan harus stop follow up, etika CS]

Buat semua script dalam Bahasa Indonesia yang sangat natural, seperti obrolan WA sehari-hari.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3500,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("WA closing error:", error);
      res.status(500).json({ error: "Gagal membuat WA closing script. " + (error?.message || '') });
    }
  });

  // Generate Scarcity & Batch Pricing Pack
  app.post("/api/generate-scarcity-pack", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, price, batchNumber, nextBatchPrice, deadline } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah copywriter Indonesia yang ahli dalam menulis copy scarcity dan urgency untuk produk digital.
Spesialisasi: Batch pricing strategy, countdown copy, limited offer messaging yang natural dan tidak terkesan palsu.
Gaya: Honest urgency, FOMO yang logis, bahasa Indonesia yang persuasif tanpa manipulatif berlebihan.`;

      const userPrompt = `Buat Scarcity & Batch Pricing Copy Pack untuk:
- Produk/Ebook: ${topikFallback}
- Harga Batch Saat Ini: ${price || 'Rp97.000'}
- Nomor Batch Saat Ini: ${batchNumber || '4'}
- Harga Batch Berikutnya: ${nextBatchPrice || 'Rp189.000'}
- Deadline/Batas Waktu: ${deadline || '48 jam lagi / slot terbatas'}

Format output:

===== BATCH PRICING ANNOUNCEMENT (3 variasi) =====
[Pengumuman sistem batch pricing. Jelaskan logika kenapa harga naik. Buat calon pembeli paham ini fair, bukan manipulasi]

===== COUNTDOWN COPY (untuk timer di LP) =====
[Copy di atas/bawah countdown timer. 3 variasi: pendek (1 baris), sedang (3 kalimat), panjang (1 paragraf)]

===== SCARCITY COPY — SLOT TERBATAS =====
[Copy untuk limited slots / kuota terbatas. 3 variasi untuk berbagai posisi di LP]

===== HARGA NAIK NOTIFICATION =====
[5 template pesan yang dikirim ke leads ketika harga akan naik besok/sebentar lagi — WA & Email format]

===== LAST CALL COPY (24 JAM TERAKHIR) =====
[Copy untuk 24 jam terakhir sebelum harga naik. Lebih intens, lebih urgent. Untuk LP banner, popup, WA blast]

===== SOCIAL PROOF + SCARCITY COMBO =====
[Kombinasi testimoni singkat + scarcity. Contoh: "X orang sudah bergabung, hanya tersisa Y slot..."]

===== BATCH CLOSING ANNOUNCEMENT =====
[Template pengumuman penutupan batch. Untuk posting sosmed, story IG, caption TikTok]

===== REOPENING WAITLIST COPY =====
[Copy untuk buka waitlist batch berikutnya setelah batch ini tutup. Bangun antisipasi]

===== PSIKOLOGI COPY NOTES =====
[Penjelasan singkat mengapa tiap teknik bekerja + kapan harus pakai masing-masing]

Buat semua copy dalam Bahasa Indonesia yang terasa autentik, bukan robot, dan berempati pada pembeli.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Scarcity pack error:", error);
      res.status(500).json({ error: "Gagal membuat scarcity pack. " + (error?.message || '') });
    }
  });

  // Generate LP Section Kit — per-section landing page copy
  app.post("/api/generate-lp-section-kit", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, section } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const sectionPrompts: Record<string, string> = {
        headline: `Buat 10 HEADLINE + 10 SUB-HEADLINE untuk landing page produk digital.
Format: [HEADLINE] dan [Sub-headline] secara berpasangan.
Gunakan angle berbeda: Pain (3 pasang), Aspiration (3 pasang), Curiosity (2 pasang), Angka/Statistik (2 pasang).
Setiap headline max 12 kata, sub-headline max 20 kata. Langsung ke titik, tidak bertele-tele.`,

        problem: `Buat bagian PROBLEMS & AGITATION untuk landing page — sedang dan kuat.
Format:
1. [Opening empati — 2 kalimat]
2. [Problem List — 5-7 bullet poin masalah yang sangat relatable]
3. [Pain Agitation — 2-3 paragraf mengintensifkan rasa frustasi]
4. [Bridge ke solusi — 1-2 kalimat transisi]
Tulis seolah-olah kamu pernah mengalaminya sendiri.`,

        social_proof: `Buat TEMPLATE SOCIAL PROOF untuk landing page — 4 format berbeda:
1. [Screenshot WA Testimoni — template copy untuk 5 testimoni berbeda dengan emoji reactions]
2. [Video Testimoni Script — 3 template script singkat (30 detik) yang bisa digunakan customer untuk rekam video review]
3. [Angka/Statistik Social Proof — 5 cara menyajikan social proof lewat angka dan data]
4. [Nama + Profesi + Hasil Nyata — 6 format testimoni tertulis yang compelling]
5. [Before-After Story Template — 3 template kisah sebelum-sesudah]`,

        bonus_stack: `Buat BONUS STACK COPY untuk landing page — tunjukkan nilai total lebih besar dari harga.
Format:
1. [Daftar 6-8 bonus dengan value price masing-masing]
2. [Total Value Summary copy — tunjukkan selisih besar antara total value vs harga jual]
3. [Cara Menulis Nama Bonus yang Menarik — 5 formula penamaan bonus]
4. [Bonus Delivery Copy — cara explain cara dapat bonus]
Harga jual: ${price || 'Rp97.000'}. Total bonus harus terasa jauh melebihi harga ini.`,

        cta: `Buat CTA (CALL TO ACTION) PACK untuk landing page.
Format:
1. [CTA Button Text — 10 variasi teks tombol yang lebih menarik dari "Beli Sekarang"]
2. [CTA Section Headline — 5 judul section CTA yang mendesak]
3. [CTA Supporting Copy — 3 paragraf pendek di bawah tombol CTA yang buang keraguan terakhir]
4. [Micro-Commitment Copy — teks kecil di bawah tombol yang reduce anxiety (privasi, garansi, dll)]
5. [Sticky CTA Bar Copy — teks untuk floating bar di atas/bawah halaman]`,

        faq: `Buat FAQ SECTION untuk landing page — 12 pertanyaan paling umum calon pembeli.
Format untuk setiap FAQ:
[Q: Pertanyaan]
[A: Jawaban yang confident, meyakinkan, max 3 kalimat]

Fokus pada: keraguan tentang harga, hasil, keaslian, metode, waktu belajar, garansi, dan cara beli.
Tulis jawaban yang pre-empt keberatan sebelum muncul.`,
      };

      const selectedSection = section || 'headline';
      const systemPrompt = `Anda adalah copywriter landing page Indonesia #1 yang sudah menghasilkan puluhan LP dengan conversion rate di atas 5%.
Spesialisasi: LP untuk produk digital (ebook, kursus online) di pasar Indonesia.
Gaya: Bahasa Indonesia natural, emosi kuat, tidak kaku, sangat relatable untuk target market Indonesia.`;

      const sectionPromptText = sectionPrompts[selectedSection] || sectionPrompts['headline'];

      const userPrompt = `Produk: ${topikFallback}
Judul: ${judul || topikFallback}
Target Audiens: ${target || 'Masyarakat Indonesia 25-45 tahun'}
Harga: ${price || 'Rp97.000'}
Author: ${authorName || 'Pakar'}

${sectionPromptText}

Buat dalam Bahasa Indonesia yang natural, persuasif, dan sangat relatable. Jangan terjemahan kaku.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.82,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("LP section kit error:", error);
      res.status(500).json({ error: "Gagal membuat LP section. " + (error?.message || '') });
    }
  });

  // Generate Sales Funnel Blueprint
  app.post("/api/generate-funnel-blueprint", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, funnelType } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah Digital Marketing Strategist Indonesia dengan spesialisasi sales funnel untuk produk digital.
Pendekatan: Data-driven, practical, telah terbukti menghasilkan ROI tinggi di pasar Indonesia.
Spesialisasi: Meta Ads → Landing Page → WhatsApp → Closing → Upsell funnel untuk info-produk Indonesia.`;

      const userPrompt = `Buat SALES FUNNEL BLUEPRINT lengkap untuk:
- Produk: ${topikFallback}
- Judul: ${judul || topikFallback}
- Target: ${target || 'Masyarakat Indonesia 25-45 tahun'}
- Harga: ${price || 'Rp97.000'}
- Author: ${authorName || 'Expert'}
- Tipe Funnel: ${funnelType || 'Meta Ads → LP → WA Closing → Upsell'}

Format output:

===== OVERVIEW FUNNEL (Diagram Teks) =====
[Gambaran alur lengkap dengan → dan breakdown setiap tahap. Cantumkan estimasi conversion rate tiap tahap]

===== TAHAP 1: TRAFFIC SOURCE (Meta Ads) =====
[Objective iklan, budget rekomendasi, jenis audience, format iklan terbaik, KPI target]

===== TAHAP 2: LANDING PAGE =====
[Elemen wajib, above-the-fold recommendation, estimated load time target, CTA utama, pixel event]

===== TAHAP 3: THANK YOU PAGE / OTO =====
[Copy untuk halaman terima kasih + One-Time Offer jika ada, cara maximize revenue per buyer]

===== TAHAP 4: WHATSAPP CLOSING =====
[Flow CS dari leads masuk sampai closing, waktu response ideal, touchpoint sequence]

===== TAHAP 5: DELIVERY & ONBOARDING =====
[Sistem pengiriman produk digital, pesan onboarding otomatis, cara reduce refund]

===== TAHAP 6: UPSELL / CROSS-SELL =====
[Kapan dan bagaimana tawarkan produk lanjutan, rekomendasi produk komplementer]

===== TAHAP 7: RE-ENGAGEMENT =====
[Strategi untuk leads yang tidak convert: retargeting ads, email sequence, WA broadcast]

===== BUDGET PLAN (Starter) =====
[Alokasi budget realistis untuk mulai dari Rp100.000 - Rp500.000/hari]

===== TOOLS & PLATFORM STACK =====
[Rekomendasi tools Indonesia-friendly: LP builder, WA Business, payment gateway, CRM sederhana]

===== KEY METRICS & TARGETS =====
[CTR target, CPL target, conversion rate LP, closing rate WA, ROAS target, break-even point]

===== COMMON MISTAKES =====
[5 kesalahan fatal yang paling sering dilakukan penjual produk digital Indonesia dan cara hindarinya]

Buat semua dalam Bahasa Indonesia yang praktis dan langsung bisa diimplementasikan.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3500,
        temperature: 0.75,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Funnel blueprint error:", error);
      res.status(500).json({ error: "Gagal membuat funnel blueprint. " + (error?.message || '') });
    }
  });

  // Generate Headline Power Pack
  app.post("/api/generate-headline-pack", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, price, authorName, niche } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Produk Digital';

      const systemPrompt = `Anda adalah copywriter headline Indonesia terbaik yang menulis headline untuk iklan FB, LP, email, dan konten.
Prinsip: Headline adalah 80% faktor penentu apakah orang mau baca konten selanjutnya.
Gaya: Direct, emotional, specific, curiosity-driven — selalu dalam Bahasa Indonesia yang natural dan kuat.`;

      const userPrompt = `Buat HEADLINE POWER PACK lengkap (40+ headline) untuk:
- Produk/Topik: ${topikFallback}
- Niche/Industri: ${niche || 'Digital Marketing / Produk Digital'}
- Target: ${target || 'Orang Indonesia yang ingin penghasilan tambahan'}
- Harga: ${price || 'Rp97.000'}
- Author: ${authorName || 'Pakar'}

Format:

===== HEADLINE — PAIN/PROBLEM ANGLE (8 headline) =====
[Langsung sentuh masalah, frustrasi, atau ketakutan terbesar target market]

===== HEADLINE — ASPIRATION/RESULT ANGLE (8 headline) =====
[Gambarkan hasil impian, pencapaian, transformasi yang ingin mereka capai]

===== HEADLINE — CURIOSITY/MYSTERY ANGLE (6 headline) =====
[Bikin orang penasaran, "cliffhanger effect", knowledge gap]

===== HEADLINE — NUMBER/SPECIFIC ANGLE (6 headline) =====
[Pakai angka spesifik, waktu, persentase, jumlah langkah]

===== HEADLINE — SOCIAL PROOF ANGLE (4 headline) =====
[Referensi pada orang lain yang sudah berhasil, komunitas, jumlah pengguna]

===== HEADLINE — CONTRARIAN/PATTERN INTERRUPT (4 headline) =====
[Lawan ekspektasi, counter-intuitive, challenge common beliefs]

===== HEADLINE — FEAR/LOSS AVERSION (4 headline) =====
[FOMO, takut tertinggal, biaya tidak bertindak]

===== HEADLINE UNTUK EMAIL SUBJECT LINE (8 variasi) =====
[Headline yang work sebagai subject email — pendek, mobile-friendly, open rate tinggi]

===== HEADLINE UNTUK VIDEO THUMBNAIL (6 variasi) =====
[Pendek, bold, 4-6 kata maksimal, terlihat jelas di thumbnail kecil]

===== FORMULA HEADLINE YANG DIGUNAKAN =====
[Jelaskan 5 formula headline yang paling ampuh beserta contohnya]

Semua dalam Bahasa Indonesia. Buat yang benar-benar berbeda, bukan variasi yang sama berkali-kali.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.88,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Headline pack error:", error);
      res.status(500).json({ error: "Gagal membuat headline pack. " + (error?.message || '') });
    }
  });

  // Generate Ebook TOC + Chapter Outline
  app.post("/api/generate-ebook-outline", isAuthenticated, async (req, res) => {
    try {
      const { prompt, topik, judul, target, totalChapters, authorName } = req.body;
      const topikFallback = topik || judul || (prompt || '').split(/[,.:!?]/)[0].slice(0, 80) || 'Topik Ebook';
      const chapterCount = parseInt(totalChapters) || 10;

      const systemPrompt = `Anda adalah editor buku profesional Indonesia dengan pengalaman 15+ tahun menyusun ebook berkualitas tinggi.
Spesialisasi: Struktur ebook yang engaging, logis, dan memberikan value nyata kepada pembaca Indonesia.
Gaya: Sistematis, komprehensif, dengan alur yang natural dari masalah ke solusi ke action.`;

      const userPrompt = `Buat DAFTAR ISI + OUTLINE LENGKAP untuk ebook:
- Topik/Judul: ${topikFallback}
- Target Pembaca: ${target || 'Pemula hingga menengah, masyarakat Indonesia'}
- Author: ${authorName || 'Penulis Expert'}
- Jumlah Bab Utama: ${chapterCount} bab

Format output:

===== METADATA EBOOK =====
Judul Utama: [judul yang menarik dan SEO-friendly]
Sub-Judul: [kalimat penjelas 10-15 kata]
Tagline: [satu kalimat promise utama buku ini]
Target Pembaca: [deskripsi singkat ideal reader]
Estimasi Halaman: [perkiraan jumlah halaman]
USP (Unique Selling Point): [apa yang membedakan ebook ini]

===== PENDAHULUAN =====
[Sinopsis singkat buku 2-3 paragraf — apa yang akan dipelajari dan hasil yang akan dicapai]

===== DAFTAR ISI =====
BAB 0 — PENDAHULUAN / KATA PENGANTAR
  0.1 [judul sub-bab]
  0.2 [judul sub-bab]

BAB 1 — [JUDUL BAB]
  1.1 [judul sub-bab dengan deskripsi singkat 1 kalimat]
  1.2 [judul sub-bab]
  1.3 [judul sub-bab]
  1.4 [judul sub-bab]
  💡 Key Takeaway Bab 1

[ulangi untuk BAB 2 sampai BAB ${chapterCount}]

BAB ${chapterCount + 1} — PENUTUP & LANGKAH BERIKUTNYA
  [sub-bab penutup + CTA/bonus info]

===== RINGKASAN STRUKTUR =====
[Tabel: No. Bab | Judul | Fokus Utama | Est. Halaman | Tingkat Kesulitan]

===== CHAPTER SUMMARY (1 paragraf per bab) =====
[Ringkasan singkat tiap bab — apa yang dibahas dan apa yang pembaca dapatkan]

===== KATA-KATA KUNCI PER BAB =====
[5 keyword/topik utama per bab yang akan dibahas — membantu generate konten nanti]

Buat dalam Bahasa Indonesia yang profesional, bukan terjemahan kaku.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 3500,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Ebook outline error:", error);
      res.status(500).json({ error: "Gagal membuat outline ebook. " + (error?.message || '') });
    }
  });

  // Generate Single Chapter Content
  app.post("/api/generate-chapter", isAuthenticated, async (req, res) => {
    try {
      const { topik, judul, chapterTitle, chapterNumber, subTopics, target, authorName, tone, wordCount } = req.body;
      const topikFallback = topik || judul || 'Topik Ebook';
      const targetWords = parseInt(wordCount) || 800;
      const chapterTone = tone || 'informatif dan mudah dipahami';

      const systemPrompt = `Anda adalah penulis ebook Indonesia profesional yang ahli menulis konten informatif, engaging, dan actionable.
Gaya penulisan: ${chapterTone}, tidak bertele-tele, kaya contoh nyata dari konteks Indonesia, langsung applicable.
Prinsip: Setiap bab harus memberikan insight baru dan tindakan konkret yang bisa langsung dipraktikkan pembaca.`;

      const userPrompt = `Tulis ISI LENGKAP untuk:
- Ebook: "${topikFallback}"
- BAB ${chapterNumber}: ${chapterTitle}
- Sub-topik yang dibahas: ${subTopics || `Konsep dasar, penerapan praktis, contoh nyata, tips & trik, dan kesimpulan`}
- Target Pembaca: ${target || 'Pemula hingga menengah, konteks Indonesia'}
- Panjang target: sekitar ${targetWords} kata
- Tone: ${chapterTone}

Format penulisan bab:

## BAB ${chapterNumber}: ${chapterTitle.toUpperCase()}

### Pembuka Bab
[1-2 paragraf opening yang hook — cerita pendek / statistik / pertanyaan menarik yang relevan]

### [Sub-judul 1]
[Konten substantif 200-300 kata. Gunakan contoh nyata, analogi mudah dipahami]

### [Sub-judul 2]
[Konten substantif. Sertakan tips/checklist/langkah-langkah jika sesuai]

### [Sub-judul 3]
[Konten substantif. Tambahkan studi kasus mini atau contoh dari Indonesia]

> 💡 **Insight Penting:** [satu insight kunci bab ini dalam 2-3 kalimat]

### Langkah Aksi
**Yang bisa kamu lakukan sekarang:**
[3-5 langkah konkret yang bisa langsung dipraktikkan]

### Ringkasan Bab
[Bullet poin 4-6 poin kunci dari bab ini]

---

Tulis konten yang kaya, substantif, dan benar-benar bermanfaat. Bukan teori kosong. Gunakan Bahasa Indonesia natural.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.78,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Chapter generate error:", error);
      res.status(500).json({ error: "Gagal generate bab. " + (error?.message || '') });
    }
  });

  // Generate Ebook Visual HTML Template (Layout Preview)
  app.post("/api/generate-ebook-template", isAuthenticated, async (req, res) => {
    try {
      const { judul, subJudul, authorName, chapters, theme, accentColor, fontStyle } = req.body;
      const themeConfig: Record<string, { bg: string, text: string, accent: string, headerBg: string, chapterBg: string, fontFamily: string }> = {
        professional: {
          bg: '#FFFFFF', text: '#1a1a2e', accent: accentColor || '#1e3a8a',
          headerBg: '#1e3a8a', chapterBg: '#EFF6FF', fontFamily: '"Georgia", serif'
        },
        modern: {
          bg: '#FAFAFA', text: '#111827', accent: accentColor || '#7C3AED',
          headerBg: '#7C3AED', chapterBg: '#F5F3FF', fontFamily: '"Inter", sans-serif'
        },
        warm: {
          bg: '#FFFBF5', text: '#1c1917', accent: accentColor || '#D97706',
          headerBg: '#D97706', chapterBg: '#FFFBEB', fontFamily: '"Merriweather", serif'
        },
        bold: {
          bg: '#0F172A', text: '#F1F5F9', accent: accentColor || '#F59E0B',
          headerBg: '#1E293B', chapterBg: '#1E293B', fontFamily: '"Roboto", sans-serif'
        },
        minimal: {
          bg: '#FFFFFF', text: '#374151', accent: accentColor || '#10B981',
          headerBg: '#10B981', chapterBg: '#F0FDF4', fontFamily: '"Helvetica Neue", sans-serif'
        },
      };

      const cfg = themeConfig[theme || 'professional'];
      const chaptersHtml = Array.isArray(chapters) && chapters.length > 0
        ? chapters.map((ch: { number: string; title: string; preview: string }, i: number) => `
          <div class="chapter-card">
            <div class="chapter-number">BAB ${ch.number || i + 1}</div>
            <div class="chapter-title">${ch.title || 'Judul Bab'}</div>
            ${ch.preview ? `<div class="chapter-preview">${ch.preview.slice(0, 200)}${ch.preview.length > 200 ? '...' : ''}</div>` : ''}
          </div>`).join('\n')
        : `<div class="chapter-card">
            <div class="chapter-number">BAB 1</div>
            <div class="chapter-title">Pendahuluan</div>
            <div class="chapter-preview">Konten bab akan tampil di sini setelah di-generate...</div>
           </div>`;

      const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${judul || 'Ebook Preview'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Merriweather:wght@300;400;700&family=Roboto:wght@300;400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${cfg.bg}; color: ${cfg.text}; font-family: ${cfg.fontFamily}; line-height: 1.7; }
  
  /* COVER PAGE */
  .cover { 
    min-height: 100vh; background: linear-gradient(135deg, ${cfg.headerBg} 0%, ${cfg.accent}dd 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 60px 40px; position: relative; overflow: hidden;
  }
  .cover::before {
    content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
  }
  .cover-badge {
    background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
    color: white; padding: 6px 20px; border-radius: 50px; font-size: 12px;
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 30px;
  }
  .cover h1 { 
    font-size: clamp(28px, 5vw, 52px); color: white; font-weight: 700; 
    line-height: 1.2; margin-bottom: 20px; text-shadow: 0 2px 20px rgba(0,0,0,0.3);
  }
  .cover-subtitle { 
    font-size: clamp(14px, 2vw, 18px); color: rgba(255,255,255,0.85); 
    max-width: 600px; margin-bottom: 40px; font-weight: 300;
  }
  .cover-divider { width: 60px; height: 3px; background: rgba(255,255,255,0.6); margin: 0 auto 30px; border-radius: 2px; }
  .cover-author { color: rgba(255,255,255,0.9); font-size: 16px; font-weight: 600; }
  .cover-author-label { color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 6px; letter-spacing: 1px; text-transform: uppercase; }
  .cover-decoration { 
    position: absolute; bottom: 30px; right: 40px; 
    font-size: 80px; opacity: 0.08;
  }
  
  /* MAIN CONTENT */
  .container { max-width: 800px; margin: 0 auto; padding: 60px 40px; }
  
  /* ABOUT SECTION */
  .about-section { 
    background: ${cfg.chapterBg}; border-left: 4px solid ${cfg.accent}; 
    padding: 30px 35px; border-radius: 8px; margin-bottom: 50px;
  }
  .section-label { 
    color: ${cfg.accent}; font-size: 11px; font-weight: 700; 
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px;
  }
  .about-section h2 { font-size: 22px; margin-bottom: 12px; }
  .about-section p { font-size: 15px; opacity: 0.8; }
  
  /* TOC */
  .toc-header { text-align: center; margin-bottom: 40px; }
  .toc-header h2 { font-size: 28px; color: ${cfg.accent}; margin-bottom: 8px; }
  .toc-header p { font-size: 14px; opacity: 0.6; }
  
  /* CHAPTER CARDS */
  .chapters-grid { display: grid; gap: 20px; margin-bottom: 60px; }
  .chapter-card {
    background: ${cfg.chapterBg}; border: 1px solid ${cfg.accent}22;
    border-radius: 12px; padding: 24px 28px; 
    transition: transform 0.2s, box-shadow 0.2s;
    border-left: 4px solid ${cfg.accent};
  }
  .chapter-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
  .chapter-number { 
    color: ${cfg.accent}; font-size: 11px; font-weight: 700; 
    letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;
  }
  .chapter-title { font-size: 17px; font-weight: 600; margin-bottom: 10px; }
  .chapter-preview { font-size: 13px; opacity: 0.65; line-height: 1.6; }
  
  /* FOOTER */
  .ebook-footer { 
    text-align: center; padding: 40px; background: ${cfg.headerBg}; color: white;
    margin-top: 60px;
  }
  .ebook-footer .author-name { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
  .ebook-footer .footer-note { font-size: 12px; opacity: 0.6; }
  
  /* WATERMARK */
  .watermark {
    text-align: center; padding: 15px; background: ${cfg.chapterBg}; 
    font-size: 11px; opacity: 0.5; border-top: 1px solid ${cfg.accent}22;
  }
  
  @media print {
    .cover { page-break-after: always; }
    .chapter-card { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover">
  <div class="cover-badge">📚 E-Book</div>
  <h1>${judul || 'Judul Ebook Anda'}</h1>
  ${subJudul ? `<div class="cover-subtitle">${subJudul}</div>` : ''}
  <div class="cover-divider"></div>
  <div class="cover-author-label">Ditulis oleh</div>
  <div class="cover-author">${authorName || 'Nama Penulis'}</div>
  <div class="cover-decoration">📖</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="container">
  <div class="toc-header">
    <div class="section-label">Isi Buku</div>
    <h2>Daftar Isi</h2>
    <p>Panduan lengkap yang siap membantu perjalanan Anda</p>
  </div>
  
  <div class="chapters-grid">
    ${chaptersHtml}
  </div>
</div>

<!-- FOOTER -->
<div class="ebook-footer">
  <div class="author-name">${authorName || 'Nama Penulis'}</div>
  <div class="footer-note">${judul || 'Ebook'} · Hak cipta dilindungi undang-undang</div>
</div>

<div class="watermark">Generated with Ebook Builder Pro · AI-Powered Ebook Platform</div>

</body>
</html>`;

      res.json({ html });
    } catch (error: any) {
      console.error("Ebook template error:", error);
      res.status(500).json({ error: "Gagal generate template ebook. " + (error?.message || '') });
    }
  });

  // Perpanjang Isi Bab (Expand Chapter by X words)
  app.post("/api/expand-chapter", isAuthenticated, async (req, res) => {
    try {
      const { existingContent, chapterTitle, chapterNumber, wordCount, tone, topik } = req.body;
      const wordsToAdd = parseInt(wordCount) || 150;

      const systemPrompt = `Anda adalah penulis ebook Indonesia profesional. Tugas Anda adalah memperluas isi bab yang sudah ada dengan menambahkan konten baru yang relevan, mengalir natural, dan memperkaya pembahasan.
Gaya penulisan: ${tone || 'informatif dan mudah dipahami'}.
Aturan: Jangan mengulang konten yang sudah ada. Tambahkan insight baru, contoh nyata, atau penjelasan lebih dalam.`;

      const userPrompt = `Perpanjang isi bab berikut dengan menambahkan sekitar ${wordsToAdd} kata baru:

Konteks Ebook: ${topik || 'Ebook Informatif'}
BAB ${chapterNumber || ''}: ${chapterTitle || 'Bab Ebook'}

KONTEN YANG SUDAH ADA:
---
${existingContent || ''}
---

Tambahkan konten lanjutan yang:
1. Mengalir natural dari konten sebelumnya (jangan buat heading baru yang terputus)
2. Memperdalam pembahasan dengan contoh nyata dari Indonesia
3. Memberikan insight atau perspektif baru
4. Menggunakan bahasa yang sama dengan konten yang ada
5. Sekitar ${wordsToAdd} kata tambahan

Output: Hanya tulis TAMBAHAN konten baru saja (bukan ulang semua konten lama).`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.78,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Expand chapter error:", error);
      res.status(500).json({ error: "Gagal memperpanjang bab. " + (error?.message || '') });
    }
  });

  // Custom Regenerate Chapter (tambahkan poin/tabel/data/contoh)
  app.post("/api/regenerate-chapter-custom", isAuthenticated, async (req, res) => {
    try {
      const { existingContent, chapterTitle, chapterNumber, additions, topik, tone, wordCount } = req.body;
      const addList: string[] = Array.isArray(additions) ? additions : [];
      const targetWords = parseInt(wordCount) || 800;

      const additionsText = addList.length > 0
        ? `\nTambahkan elemen berikut ke dalam bab:\n${addList.map(a => `- ${a}`).join('\n')}`
        : '';

      const systemPrompt = `Anda adalah penulis ebook Indonesia profesional yang ahli membuat konten struktural dan visual dalam teks.
Gaya penulisan: ${tone || 'informatif dan mudah dipahami'}.
Keahlian: menulis bullet point, tabel markdown, data statistik, dan studi kasus yang relevan untuk Indonesia.`;

      const userPrompt = `Tulis ulang dan tingkatkan bab berikut dengan konten yang lebih kaya:

Konteks Ebook: ${topik || 'Ebook Informatif'}
BAB ${chapterNumber || ''}: ${chapterTitle || 'Bab Ebook'}

KONTEN ASLI (sebagai referensi):
---
${existingContent || 'Belum ada konten. Buat dari awal berdasarkan judul bab.'}
---
${additionsText}

Buat versi yang lebih lengkap (sekitar ${targetWords} kata) dengan:
${addList.includes('poin_bullet') ? '✅ Gunakan bullet poin (- poin) untuk list items yang relevan\n' : ''}
${addList.includes('tabel') ? '✅ Sertakan minimal 1 TABEL MARKDOWN yang relevan (| Header | Header |)\n' : ''}
${addList.includes('data_riset') ? '✅ Tambahkan data, angka, statistik, atau fakta riset yang kredibel\n' : ''}
${addList.includes('contoh_kasus') ? '✅ Sertakan minimal 1 contoh kasus nyata atau studi kasus dari Indonesia\n' : ''}
${addList.includes('tips_praktis') ? '✅ Tambahkan bagian "Tips Praktis" dengan langkah-langkah actionable\n' : ''}
${addList.includes('faq_mini') ? '✅ Tambahkan 3 FAQ singkat yang relevan di akhir bab\n' : ''}

Format: Gunakan Markdown headers (##, ###), bold (**teks**), dan struktur yang rapi.
Bahasa: Indonesia natural, bukan terjemahan kaku.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.78,
      });

      const content = response.choices[0]?.message?.content || '';
      res.json({ content });
    } catch (error: any) {
      console.error("Custom regenerate error:", error);
      res.status(500).json({ error: "Gagal regenerate bab. " + (error?.message || '') });
    }
  });

  // Stok Gambar — Openverse free image search (Creative Commons, no API key needed)
  app.get("/api/search-images", isAuthenticated, async (req, res) => {
    try {
      const { q, page } = req.query;
      const query = String(q || 'business').replace(/[^a-zA-Z0-9 ]/g, ' ').trim().slice(0, 100);
      const pageNum = parseInt(String(page || '1'));

      const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=12&page=${pageNum}&license_type=commercial&mature=false`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        headers: { 'User-Agent': 'EbookBuilderPro/1.0 (educational tool)', 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(502).json({ error: 'Gagal mengambil gambar dari Openverse', results: [] });
      }

      const data: any = await response.json();
      const results = (data.results || []).map((img: any) => ({
        id: img.id,
        title: img.title || query,
        thumbnail: img.thumbnail || img.url,
        url: img.url,
        source: img.source,
        creator: img.creator || 'Unknown',
        license: img.license || 'CC',
        width: img.width,
        height: img.height,
      }));

      res.json({ results, total: data.result_count || 0, page: pageNum });
    } catch (error: any) {
      console.error("Image search error:", error);
      res.status(500).json({ error: "Gagal mencari gambar.", results: [] });
    }
  });

  // ========= DISTRIBUSI & MONETISASI PACK =========

  // Platform Listing Pack — Tokopedia, Shopee, Gumroad, WA Catalog, Telegram
  app.post("/api/generate-platform-listing", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, description, price, authorName, monoContent } = req.body;
      const priceInfo = price || monoContent || 'harga kompetitif';
      const systemPrompt = `Anda adalah copywriter dan digital marketing specialist Indonesia yang ahli menulis deskripsi produk digital untuk berbagai marketplace.
Spesialisasi: optimasi SEO marketplace Indonesia, psikologi pembeli, kata kunci yang convert.`;

      const userPrompt = `Buat PLATFORM LISTING PACK lengkap untuk ebook digital berikut:

Judul Ebook: "${title || 'Ebook Digital'}"
Topik/Niche: ${topik || 'bisnis online'}
Info Harga: ${priceInfo}
Penulis: ${authorName || 'Penulis Profesional'}

Buat listing untuk SETIAP platform berikut dengan format yang spesifik:

---
## 🛒 TOKOPEDIA / SHOPEE
**Nama Produk** (max 255 karakter, sertakan keyword SEO):
[nama produk]

**Deskripsi Produk** (500-800 kata, panjang untuk SEO):
[deskripsi lengkap dengan bullet points, keyword organik, manfaat jelas, cara pembelian/download]

**Tag/Keyword** (20 kata kunci, pisah koma):
[tag1, tag2, ...]

**Kategori yang Tepat:** [kategori]

---
## 💚 GUMROAD (English International)
**Product Title:**
[title]

**Product Description** (300-400 words, benefit-driven):
[description]

**Short Pitch** (1 kalimat untuk social media):
[short pitch]

---
## 📱 WHATSAPP CATALOG
**Nama Produk** (max 100 karakter):
[nama]

**Deskripsi WA** (max 500 karakter, casual + CTA):
[deskripsi singkat yang convert di WA]

---
## 📢 TELEGRAM CHANNEL POST
**Teks Promosi** (informal, emoji, max 500 karakter):
[teks telegram dengan emoji yang engaging]

---
## 🔗 BIO LINK (Instagram/TikTok Bio)
**Teks CTA** (max 150 karakter):
[teks CTA untuk bio]

---
## 📊 HASHTAG PACK
**Instagram** (30 hashtag relevan):
[#hashtag1 #hashtag2 ...]

**TikTok** (5 hashtag trending):
[#hashtag1 #hashtag2 ...]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 2500,
        temperature: 0.75,
      });
      res.json({ content: response.choices[0]?.message?.content || '' });
    } catch (error: any) {
      console.error("Platform listing error:", error);
      res.status(500).json({ error: "Gagal generate platform listing. " + (error?.message || '') });
    }
  });

  // Reseller & Afiliasi Kit — Sistem komisi, pitch, welcome message, materi rekrut
  app.post("/api/generate-reseller-kit", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, price, authorName, monoContent } = req.body;
      const priceInfo = price || monoContent || '';
      const systemPrompt = `Anda adalah ahli sistem bisnis digital dan network marketing Indonesia. Anda pakar dalam membuat program reseller dan afiliasi yang menguntungkan semua pihak.`;

      const userPrompt = `Buat RESELLER & AFILIASI KIT lengkap untuk ebook digital berikut:

Judul Ebook: "${title || 'Ebook Digital'}"
Topik/Niche: ${topik || 'bisnis online'}  
Info Harga: ${priceInfo || 'Rp 97.000'}
Penulis: ${authorName || 'Penulis'}

Buat sistem reseller/afiliasi yang lengkap:

---
## 💰 STRUKTUR KOMISI
[Buat 3 tier komisi yang menarik — Reseller Biasa, Reseller Silver, Reseller Gold — dengan persentase, syarat, dan benefit tiap tier. Sertakan kalkulasi contoh penghasilan nyata.]

---
## 📢 PITCH REKRUT RESELLER
### Versi WhatsApp (informal, 150-200 kata):
[pesan WA rekrut reseller yang friendly dan enticing]

### Versi Instagram Caption (formal sedikit, dengan emoji):
[caption IG untuk merekrut reseller]

---
## 📋 WELCOME KIT RESELLER BARU
[Pesan selamat datang + panduan quick start + tips closing pertama — 200-300 kata. Format template WA yang bisa langsung dikirim]

---
## 💬 SCRIPT CLOSING UNTUK RESELLER
[5 template jawaban untuk 5 objeksi umum calon pembeli:
1. "Mahal..."
2. "Ntar aja..."
3. "Apa bedanya sama yang gratis?"
4. "Gimana cara downloadnya?"
5. "Ada jaminannya ga?"]

---
## 📊 MATERI PROMOSI SIAP PAKAI (untuk reseller bagikan ke pembeli)
### Caption 1 — Story (persuasi ringan):
[caption]

### Caption 2 — Feed (bukti hasil + CTA):
[caption]

### Caption 3 — WA Broadcast:
[pesan broadcast yang tidak spam]

---
## 📈 KALKULASI PASSIVE INCOME
[Tabel kalkulasi: Jika jual 5/10/20/50 ebook per bulan → penghasilan reseller per tier]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 3000,
        temperature: 0.78,
      });
      res.json({ content: response.choices[0]?.message?.content || '' });
    } catch (error: any) {
      console.error("Reseller kit error:", error);
      res.status(500).json({ error: "Gagal generate reseller kit. " + (error?.message || '') });
    }
  });

  // Content Repurposing Pack — 1 Ebook → 6 format konten multi-platform
  app.post("/api/generate-content-repurposing", isAuthenticated, async (req, res) => {
    try {
      const { title, topik, outlineContent, chapterSummary, authorName } = req.body;
      const context = outlineContent || chapterSummary || topik || 'konten ebook';
      const systemPrompt = `Anda adalah content strategist dan copywriter multi-platform terbaik Indonesia. Anda ahli mengubah satu sumber konten menjadi berbagai format yang viral dan engaging di setiap platform.`;

      const userPrompt = `Buat CONTENT REPURPOSING PACK lengkap dari ebook berikut:

Judul Ebook: "${title || 'Ebook Digital'}"
Topik/Niche: ${topik || 'bisnis dan pengembangan diri'}
Konteks Konten: ${context.slice(0, 1500)}
Penulis: ${authorName || 'Penulis'}

Repurpose menjadi 6 format konten:

---
## 📸 1. INSTAGRAM CAROUSEL (10 Slide)
Format: Judul slide → Isi slide (max 50 kata per slide)

**Slide 1 — Hook (Cover):**
Judul: [judul menarik yang bikin orang stop scroll]
Subtitle: [subtitle]

**Slide 2-9 — Konten Utama:**
[8 slide dengan insight/tips terbaik dari ebook, format: "💡 [nomor]. [heading]\n[isi 2-3 kalimat]"]

**Slide 10 — CTA:**
[slide penutup dengan CTA + info ebook]

**Caption Post:**
[caption instagram 100-150 kata dengan hook + storytelling + CTA soft sell]

---
## 🧵 2. TWITTER/X THREAD (10 Tweet)
[10 tweet yang mengalir, mulai dari hook yang viral, isi value, ending dengan CTA. Format: "Tweet 1/10: [isi tweet max 280 karakter]"]

---
## 💼 3. LINKEDIN ARTIKEL
**Judul:** [judul profesional SEO-friendly]
**Intro Hook** (100 kata):
[pembuka yang engaging untuk profesional]
**3 Poin Utama** (200 kata masing-masing):
[3 insight dari ebook dengan contoh bisnis nyata]
**Kesimpulan + CTA** (80 kata):
[penutup + soft plug ebook]

---
## 📧 4. EMAIL NEWSLETTER
**Subject Line:** [subject line yang bikin penasaran, max 60 karakter]
**Preview Text:** [preview text 90 karakter]
**Body Email** (300-400 kata):
[email value-first dengan storytelling, 3 insight, dan CTA gentle di akhir]

---
## 🎙️ 5. PODCAST / VIDEO OUTLINE
**Judul Episode:** [judul podcast yang menarik]
**Durasi Target:** 15-20 menit
**Outline:**
[Opening hook 2 menit → 5 segmen konten dengan waktu → Closing + CTA]

---
## 📊 6. INFOGRAFIK (Deskripsi Visual)
**Judul Infografik:** [judul]
**Layout:** [deskripsikan tata letak visual — header, 5 seksi, footer]
**Data Points:** [6-8 fakta/statistik/insight yang bisa dijadikan visual]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 3500,
        temperature: 0.82,
      });
      res.json({ content: response.choices[0]?.message?.content || '' });
    } catch (error: any) {
      console.error("Content repurposing error:", error);
      res.status(500).json({ error: "Gagal generate content repurposing. " + (error?.message || '') });
    }
  });

  // ========= EDUKAZO-INSPIRED FEATURES =========

  // AI Text Assist — expand/shorten/humanize/tone/translate existing text (like Edukazo's inline AI assist)
  app.post("/api/ai-text-assist", isAuthenticated, async (req, res) => {
    try {
      const { text, operation, tone, targetLanguage, topik } = req.body;
      if (!text?.trim()) return res.status(400).json({ error: 'Teks tidak boleh kosong' });

      const operations: Record<string, { system: string; user: string }> = {
        expand_detail: {
          system: `Anda adalah penulis Indonesia profesional. Perluas teks berikut dengan menambahkan detail, contoh nyata, dan penjelasan yang lebih mendalam. Pertahankan gaya bahasa yang sama. Output HANYA teks yang sudah diperluas, tanpa komentar.`,
          user: `Perluas teks ini dengan lebih banyak detail dan contoh nyata dari konteks ${topik || 'bisnis Indonesia'}:\n\n${text}`,
        },
        expand_extended: {
          system: `Anda adalah penulis Indonesia profesional. Perluas teks berikut secara signifikan — 2-3x lebih panjang — dengan sub-poin, penjelasan komprehensif, dan insight tambahan. Pertahankan gaya bahasa asli. Output HANYA teks, tanpa komentar.`,
          user: `Perluas teks ini menjadi versi yang jauh lebih panjang dan komprehensif:\n\n${text}`,
        },
        expand_with_table: {
          system: `Anda adalah penulis Indonesia profesional. Perluas teks berikut dan tambahkan minimal 1 TABEL MARKDOWN yang relevan untuk memperkaya informasinya. Pertahankan gaya bahasa asli. Output HANYA teks, tanpa komentar.`,
          user: `Perluas teks ini dan tambahkan tabel markdown yang relevan:\n\n${text}`,
        },
        shorten: {
          system: `Anda adalah editor Indonesia profesional. Persingkat teks berikut menjadi sekitar 40-50% dari panjang aslinya, pertahankan semua poin penting, hilangkan redundansi. Output HANYA teks yang sudah dipersingkat, tanpa komentar.`,
          user: `Persingkat teks ini tanpa menghilangkan poin penting:\n\n${text}`,
        },
        humanize: {
          system: `Anda adalah penulis Indonesia. Ubah teks berikut menjadi terdengar lebih manusiawi, natural, dan tidak kelihatan seperti ditulis AI. Gunakan variasi kalimat, ungkapan natural, dan nada percakapan yang hangat. Output HANYA teks, tanpa komentar.`,
          user: `Buat teks ini terdengar lebih manusiawi dan natural:\n\n${text}`,
        },
        tone_professional: {
          system: `Anda adalah editor bahasa Indonesia profesional. Ubah nada/gaya teks berikut menjadi PROFESIONAL dan formal — cocok untuk laporan bisnis, materi pelatihan, atau konten korporat. Output HANYA teks, tanpa komentar.`,
          user: `Ubah gaya bahasa teks ini menjadi profesional:\n\n${text}`,
        },
        tone_casual: {
          system: `Anda adalah penulis konten Indonesia. Ubah nada/gaya teks berikut menjadi CASUAL dan santai — seperti ngobrol dengan teman, menggunakan kata-kata sehari-hari. Output HANYA teks, tanpa komentar.`,
          user: `Ubah gaya bahasa teks ini menjadi casual dan santai:\n\n${text}`,
        },
        tone_friendly: {
          system: `Anda adalah penulis konten Indonesia. Ubah nada/gaya teks berikut menjadi FRIENDLY dan hangat — ramah, empatik, mendukung pembaca. Output HANYA teks, tanpa komentar.`,
          user: `Ubah gaya bahasa teks ini menjadi friendly dan hangat:\n\n${text}`,
        },
        translate_en: {
          system: `You are a professional Indonesian-English translator. Translate the following Indonesian text to natural, fluent English. Output ONLY the translated text, no comments.`,
          user: `Translate to English:\n\n${text}`,
        },
        translate_id: {
          system: `Anda adalah penerjemah profesional Inggris-Indonesia. Terjemahkan teks berikut ke bahasa Indonesia yang natural dan mengalir. Output HANYA teks terjemahan, tanpa komentar.`,
          user: `Terjemahkan ke bahasa Indonesia:\n\n${text}`,
        },
      };

      const op = operations[operation];
      if (!op) return res.status(400).json({ error: 'Operasi tidak valid' });

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: op.system }, { role: "user", content: op.user }],
        max_tokens: 2000,
        temperature: 0.72,
      });

      res.json({ result: response.choices[0]?.message?.content || '' });
    } catch (error: any) {
      console.error("AI Text Assist error:", error);
      res.status(500).json({ error: "Gagal memproses teks. " + (error?.message || '') });
    }
  });

  // Social Media Pilar Plan — angle × content per angle with ide visual + caption + hashtag + CTA
  app.post("/api/generate-social-pilar", isAuthenticated, async (req, res) => {
    try {
      const { topik, title, brandInfo, numAngles, contentPerAngle, authorName } = req.body;
      const angles = Math.min(parseInt(numAngles) || 4, 8);
      const perAngle = Math.min(parseInt(contentPerAngle) || 4, 7);
      const brand = brandInfo?.trim() || '';

      const systemPrompt = `Anda adalah social media strategist Indonesia terbaik. Anda ahli membuat rencana konten pilar yang terstruktur, variatif, dan siap dieksekusi oleh tim konten.`;

      const userPrompt = `Buat SOCIAL MEDIA PILAR PLAN lengkap untuk topik berikut:

Topik/Niche: ${topik || 'bisnis online'}
Judul/Produk: ${title || 'Brand Digital'}
${brand ? `Info Brand: ${brand}` : ''}
Penulis/Author: ${authorName || ''}

Buat PERSIS ${angles} PILAR KONTEN (ANGLE), masing-masing berisi ${perAngle} konten berbeda:

Format untuk SETIAP konten (wajib semua diisi):
\`\`\`
💡 Ide Visual: [deskripsi visual konten yang menarik — warna, layout, elemen grafis]
📝 Caption: [caption lengkap dengan hook di baris pertama, body storytelling/value, CTA di akhir — min 3 paragraf]
#️⃣ Hashtag: [15-20 hashtag relevan mix populer + niche, dipisah spasi]
📣 CTA: [Call-to-action spesifik yang kuat — bukan "klik link di bio" saja]
\`\`\`

Gunakan format ini dengan KETAT untuk SETIAP pilar dan konten:

---
## 🎯 PILAR 1: [Nama Pilar — tema/angle]
**Tujuan Pilar:** [satu kalimat tujuan]

### Konten 1.1 — [Tipe: tips/quotes/edukasi/meme/behind-scene/dll]
[format di atas]

### Konten 1.2 — [...]
[format di atas]
...
---
## 🎯 PILAR 2: [Nama Pilar]
...

(ulangi untuk semua ${angles} pilar)

---
## 📊 OVERVIEW
Total konten: ${angles * perAngle} konten
Estimasi: ${Math.ceil((angles * perAngle) / 4)} minggu konten (posting 4x/minggu)`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 4000,
        temperature: 0.8,
      });
      res.json({ content: response.choices[0]?.message?.content || '' });
    } catch (error: any) {
      console.error("Social pilar error:", error);
      res.status(500).json({ error: "Gagal generate Social Media Pilar Plan. " + (error?.message || '') });
    }
  });

  // Thread Content — FB/Twitter/X storytelling threads
  app.post("/api/generate-thread-content", isAuthenticated, async (req, res) => {
    try {
      const { topik, title, brandInfo, contentType, numAngles, contentPerAngle, authorName } = req.body;
      const angles = Math.min(parseInt(numAngles) || 3, 6);
      const perAngle = Math.min(parseInt(contentPerAngle) || 3, 5);
      const brand = brandInfo?.trim() || '';

      const systemPrompt = `Anda adalah copywriter Indonesia spesialis storytelling konten untuk Facebook, Twitter/X, dan LinkedIn. Anda ahli menulis thread yang viral, engaging, dan menggerakkan audiens.`;

      const contentTypeLabel = contentType || 'storytelling, edukasi, promosi';

      const userPrompt = `Buat THREAD CONTENT PLAN untuk platform Facebook/Twitter/X:

Topik/Niche: ${topik || 'bisnis online'}
Judul/Produk: ${title || 'Konten Digital'}
${brand ? `Info Brand: ${brand}` : ''}
Tipe Konten: ${contentTypeLabel}
Author: ${authorName || ''}

Buat PERSIS ${angles} ANGLE/PILAR THREAD, masing-masing berisi ${perAngle} thread berbeda:

Format untuk SETIAP thread:
- Thread ini adalah konten TEKS STORYTELLING (bukan carousel/gambar) untuk FB/Twitter/X
- Mulai dengan HOOK kalimat pembuka yang powerful (bikin penasaran/stop scroll)
- Lanjut dengan 3-5 "tweet" atau paragraf pendek yang mengalir
- Akhiri dengan CTA yang spesifik

---
## 📌 ANGLE 1: [Nama Angle]

### Thread 1.1 — [Sub-tipe: kisah/tips/motivasi/edukasi/promo/dll]
**🔥 Hook:**
[kalimat pembuka yang viral dan bikin penasaran — max 2 kalimat]

**📖 Thread:**
Tweet 1: [isi — max 250 karakter per tweet/paragraf]
Tweet 2: [isi]
Tweet 3: [isi]
Tweet 4: [isi]
Tweet 5: [isi + soft sell jika relevan]

**📣 CTA:**
[call-to-action spesifik yang kuat]

**💬 Engagement Trigger:**
[pertanyaan atau isi untuk memancing komentar]

---
(ulangi untuk semua ${angles} angle, masing-masing ${perAngle} thread)

---
## 📊 SUMMARY
Total thread: ${angles * perAngle} thread
Format: Teks storytelling untuk FB/Twitter/X
Estimasi posting: ${Math.ceil((angles * perAngle) / 5)} minggu (5 thread/minggu)`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        max_tokens: 4000,
        temperature: 0.82,
      });
      res.json({ content: response.choices[0]?.message?.content || '' });
    } catch (error: any) {
      console.error("Thread content error:", error);
      res.status(500).json({ error: "Gagal generate Thread Content. " + (error?.message || '') });
    }
  });

  return httpServer;
}
