import { z } from "zod";

// --- CONSTANTS FOR DROPDOWNS ---
export const LANGUAGES = ["Bahasa Indonesia", "English"] as const;

export const OUTPUT_FORMATS = [
  "Default", "Concise", "Step-by-step", "Extreme Detail", "ELI5", "Essay", "Report", "Summary", 
  "Table", "FAQ", "Listicle", "Interview", "Review", "News", "Opinion", "Tutorial", "Case Study", 
  "Profile", "Blog", "Poem", "Script", "Whitepaper", "eBook", "Press Release", "Infographic", 
  "Webinar", "Podcast Script", "Email Campaign", "Social Media Post", "Proposal", "Brochure", 
  "Newsletter", "Presentation", "Product Description", "Research Paper", "Speech", "Memo", 
  "Policy Document", "User Guide", "Technical Documentation", "Q&A", "Tutorial Video", 
  "Case Study Example", "Flowchart", "Interactive Guide", "Checklist", "System Prompt (GPTs)",
  "Formal Document", "JSON Sequence", "Markdown List", "Course Curriculum", "Marketing Copy", "Visual Prompt"
] as const;

export const TONES = [
  "Default", "Authoritative", "Clinical", "Cold", "Confident", "Cynical", "Emotional", "Empathetic", 
  "Formal", "Friendly", "Humorous", "Informal", "Ironic", "Optimistic", "Pessimistic", "Playful", 
  "Sarcastic", "Serious", "Sympathetic", "Tentative", "Warm", "Persuasive", "Nostalgic", 
  "Assertive", "Encouraging", "Inspirational", "Urgent", "Professional"
] as const;

export const WRITING_STYLES = [
  "Default", "Academic", "Analytical", "Argumentative", "Conversational", "Creative", "Critical", 
  "Descriptive", "Epigrammatic", "Epistolary", "Expository", "Informative", "Instructive", 
  "Journalistic", "Metaphorical", "Narrative", "Persuasive", "Poetic", "Satirical", "Technical", 
  "Reflective", "Storytelling", "Process-Oriented", "Abstract", "Review", "Direct Response", "StoryBrand"
] as const;

export const AI_CHARACTERS = [
  "Agentic Strategist (Attentive & Proactive)",
  "Standard Assistant (Helpful & Direct)",
  "Socratic Mentor (Guide by Questioning)",
  "Creative Visionary (Out of the Box)",
  "Strict Professional (Formal & Concise)",
  "Data-Driven Analyst (Logical & Factual)"
] as const;

export const PACK_TYPES = [
  "The Ebook Author Kit (Ide -> Outline -> Bab -> Editing)",
  "Social Media 30-Day Calendar (Ide -> Caption -> Hashtag)",
  "Product Launch Sequence (Email 1 -> Email 3 -> Sales Page)",
  "Online Course Creator (Kurikulum -> Skrip -> Slide)",
  "SEO Blog Post Workflow (Keyword -> Outline -> Artikel -> Meta)",
  "Business Starter Pack (Nama -> Tagline -> Business Model -> Plan)",
  "Personal Branding Kit (Bio -> Content Pillars -> Story)"
] as const;

export const DOCUMENT_TYPES = [
  "Standard Operating Procedure (SOP)",
  "Kebijakan Perusahaan (Policy)",
  "Kerangka Acuan Kerja (KAK / ToR)",
  "Surat Keputusan (SK)",
  "Berita Acara (Minutes of Meeting)",
  "Job Description (Uraian Jabatan)",
  "Key Performance Indicators (KPI)",
  "Surat Perjanjian Kerjasama (SPK)",
  "Non-Disclosure Agreement (NDA)",
  "Proposal Proyek",
  "Laporan Bulanan/Tahunan",
  "Memo Internal",
  "Surat Penawaran Harga",
  "Formulir Evaluasi Kinerja",
  "Kuesioner Survei",
  "Rencana Anggaran Biaya (RAB - Struktur)",
  "Risk Register (Daftar Risiko)",
  "Audit Checklist",
  "Panduan Onboarding Karyawan",
  "Press Release (Siaran Pers)"
] as const;

export const MARKETING_ASSETS = [
  "Landing Page Copy (Long Form)",
  "Sales Page Headline & Hook",
  "Email Sales Sequence (3-5 Emails)",
  "Facebook / Instagram Ads Copy",
  "LinkedIn Authority Post",
  "Twitter / X Thread",
  "Flyer / Brosur Content",
  "Banner Text (Taglines)",
  "Video Script (Shorts/Reels/TikTok) - Promosi",
  "Prompt Gambar (Untuk Midjourney/DALL-E)",
  "Prompt Video (Untuk Runway/Sora)"
] as const;

export const EBOOK_LEVELS = ["Single Ebook", "3 Ebook (Trilogi Simple)", "9 Ebook (Trilogi Lengkap)"] as const;

export const EBOOK_SERIES_DATA: Record<string, Array<{ id: number; label: string }>> = {
  "Single Ebook": [
    { id: 1, label: "Ebook Utama (Single)" }
  ],
  "3 Ebook (Trilogi Simple)": [
    { id: 1, label: "Buku 1: Fundamental (Mindset & Konsep)" },
    { id: 2, label: "Buku 2: Strategi & Implementasi (Teknis)" },
    { id: 3, label: "Buku 3: Advanced & Scaling (Pengembangan)" }
  ],
  "9 Ebook (Trilogi Lengkap)": [
    { id: 1, label: "Ebook 1: Mindset & Dasar (Basic)" },
    { id: 2, label: "Ebook 2: Validasi Market (Basic)" },
    { id: 3, label: "Ebook 3: Persiapan Produk (Basic)" },
    { id: 4, label: "Ebook 4: Strategi Marketing (Inter)" },
    { id: 5, label: "Ebook 5: Funnel & Sales (Inter)" },
    { id: 6, label: "Ebook 6: Operasional (Inter)" },
    { id: 7, label: "Ebook 7: Tim & Delegasi (Adv)" },
    { id: 8, label: "Ebook 8: Automasi Sistem (Adv)" },
    { id: 9, label: "Ebook 9: Ekspansi & Exit (Adv)" }
  ]
};

export const CHAPTER_TEMPLATES = [
  "Bab 1: Pendahuluan & Latar Belakang",
  "Bab 2: Identifikasi Masalah (Pain Point)",
  "Bab 3: Analisis & Akar Masalah",
  "Bab 4: Konsep Utama / Solusi",
  "Bab 5: Langkah Implementasi 1",
  "Bab 6: Langkah Implementasi 2",
  "Bab 7: Studi Kasus / Contoh Nyata",
  "Bab 8: Tantangan & Cara Mengatasinya",
  "Bab 9: Kesimpulan & Penutup",
  "Custom / Tulis Judul Sendiri..."
] as const;

export const AI_MODELS = [
  { name: 'ChatGPT', url: 'https://chatgpt.com', color: 'text-green-500' },
  { name: 'Claude', url: 'https://claude.ai', color: 'text-orange-500' },
  { name: 'Gemini', url: 'https://gemini.google.com', color: 'text-blue-500' },
  { name: 'DeepSeek', url: 'https://chat.deepseek.com', color: 'text-cyan-500' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', color: 'text-teal-500' },
  { name: 'Grok', url: 'https://x.com/i/grok', color: 'text-purple-500' },
] as const;

export const MODES = [
  { id: 'BRAINSTORM', label: 'Brainstorm Ide', icon: 'Lightbulb', description: 'Generate ide ebook dari keyword/referensi' },
  { id: 'BIG_IDEA', label: 'Big Idea', icon: 'Sparkles', description: 'Pertajam positioning & konsep' },
  { id: 'OUTLINE', label: 'Outline', icon: 'Layers', description: 'Susun daftar isi lengkap' },
  { id: 'DRAFT_BAB', label: 'Draft Bab', icon: 'FileText', description: 'Tulis konten bab per bab' },
  { id: 'VIDEO_SCRIPT', label: 'Video Script', icon: 'Video', description: 'Buat script video/podcast' },
  { id: 'ECOURSE_BUILDER', label: 'E-Course Builder', icon: 'GraduationCap', description: 'Ubah ebook jadi kurikulum kursus' },
  { id: 'DOC_GENERATOR', label: 'Document Generator', icon: 'FilePlus', description: 'Buat SOP, Policy, KAK, dll' },
  { id: 'PROMPT_PACK', label: 'Prompt Pack', icon: 'Package', description: 'Generate rangkaian prompt workflow' },
  { id: 'GPT_BUILDER', label: 'GPT Builder', icon: 'Bot', description: 'Buat system prompt chatbot' },
  { id: 'MARKETING_KIT', label: 'Marketing Kit', icon: 'Megaphone', description: 'Buat materi marketing & promosi' },
  { id: 'EXTEND_TEXT', label: 'Extend Text', icon: 'Wand2', description: 'Kembangkan/perluas teks pendek' },
] as const;

// Project data schema
export const projectDataSchema = z.object({
  topik: z.string(),
  judul: z.string(),
  target: z.string(),
  language: z.string().default('Bahasa Indonesia'),
  outputFormat: z.string().default('eBook'),
  tone: z.string().default('Authoritative'),
  writingStyle: z.string().default('Instructive'),
  aiCharacter: z.string().default('Agentic Strategist (Attentive & Proactive)'),
  tujuan: z.string(),
  painPoint: z.string(),
  bigIdea: z.string(),
  hasilRiset: z.string(),
  produk: z.string(),
  level: z.string().default('Single Ebook'),
});

export const taskConfigSchema = z.object({
  selectedEbookId: z.number().default(1),
  selectedEbookLabel: z.string().default(''),
  judulBab: z.string().default(''),
  manualJudulBab: z.string().default(''),
  tujuanBab: z.string().default(''),
  fokusLevel: z.string().default('Basic'),
  jenisTemplate: z.string().default('SOP'),
  topikModul: z.string().default(''),
  durasiScript: z.string().default('5-10 menit'),
  judulScript: z.string().default(''),
  botName: z.string().default(''),
  botRole: z.string().default('Mentor Pribadi'),
  botPersonality: z.string().default('Ramah, Suportif, dan Berbasis Data'),
  docType: z.string().default('Standard Operating Procedure (SOP)'),
  docContext: z.string().default(''),
  packType: z.string().default('The Ebook Author Kit (Ide -> Outline -> Bab -> Editing)'),
  courseDuration: z.string().default('4 Minggu'),
  courseFormat: z.string().default('Video + Worksheet'),
  courseGoal: z.string().default(''),
  marketingAsset: z.string().default('Landing Page Copy (Long Form)'),
  marketingAngle: z.string().default(''),
});

export const extendConfigSchema = z.object({
  teksAwal: z.string().default(''),
  targetPanjang: z.string().default('300-500 kata'),
});

export const savedProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  projectData: projectDataSchema,
  taskConfig: taskConfigSchema,
  createdAt: z.string(),
});

export type ProjectData = z.infer<typeof projectDataSchema>;
export type TaskConfig = z.infer<typeof taskConfigSchema>;
export type ExtendConfig = z.infer<typeof extendConfigSchema>;
export type SavedProject = z.infer<typeof savedProjectSchema>;

export type UploadedFile = {
  name: string;
  type: string;
  size: string;
};
