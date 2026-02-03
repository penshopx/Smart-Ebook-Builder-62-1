import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// --- INDUSTRY TEMPLATES (Fokus: Teknik, Konstruksi, Migas, Pertambangan, Kelistrikan, Manufaktur, UMKM) ---
export const INDUSTRIES = [
  { 
    id: 'engineering', 
    name: 'Keteknikan & Engineering', 
    icon: 'Wrench',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    description: 'Teknik sipil, mesin, elektro, industri',
    keywords: ['teknik', 'engineering', 'desain', 'kalkulasi', 'spesifikasi'],
    recommendedTone: 'Technical',
    recommendedStyle: 'Technical',
    aiModel: 'claude'
  },
  { 
    id: 'construction', 
    name: 'Konstruksi & Infrastruktur', 
    icon: 'Building2',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    description: 'Pembangunan, kontraktor, manajemen proyek',
    keywords: ['konstruksi', 'proyek', 'pembangunan', 'infrastruktur', 'kontraktor'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Process-Oriented',
    aiModel: 'chatgpt'
  },
  { 
    id: 'mining', 
    name: 'Pertambangan & Mineral', 
    icon: 'Mountain',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    description: 'Eksplorasi, eksploitasi, pengolahan mineral',
    keywords: ['tambang', 'mineral', 'eksplorasi', 'eksploitasi', 'geologi'],
    recommendedTone: 'Authoritative',
    recommendedStyle: 'Technical',
    aiModel: 'claude'
  },
  { 
    id: 'oil_gas', 
    name: 'Minyak & Gas (Migas)', 
    icon: 'Flame',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    description: 'Upstream, midstream, downstream, HSE',
    keywords: ['migas', 'oil', 'gas', 'petroleum', 'HSE', 'upstream', 'downstream'],
    recommendedTone: 'Authoritative',
    recommendedStyle: 'Technical',
    aiModel: 'claude'
  },
  { 
    id: 'electricity', 
    name: 'Ketenagalistrikan & Energi', 
    icon: 'Zap',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    description: 'Pembangkit, transmisi, distribusi, renewable',
    keywords: ['listrik', 'energi', 'power', 'renewable', 'solar', 'pembangkit'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Technical',
    aiModel: 'chatgpt'
  },
  { 
    id: 'manufacturing', 
    name: 'Manufaktur & Produksi', 
    icon: 'Factory',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-800',
    description: 'Proses produksi, quality control, lean manufacturing',
    keywords: ['manufaktur', 'produksi', 'pabrik', 'quality', 'lean', 'six sigma'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Process-Oriented',
    aiModel: 'chatgpt'
  },
  { 
    id: 'umkm', 
    name: 'UMKM & Bisnis Kecil', 
    icon: 'Store',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    description: 'Usaha mikro, kecil, menengah',
    keywords: ['umkm', 'bisnis', 'usaha kecil', 'wirausaha', 'entrepreneur'],
    recommendedTone: 'Friendly',
    recommendedStyle: 'Conversational',
    aiModel: 'chatgpt'
  },
  { 
    id: 'wealth', 
    name: 'Kekayaan & Kebebasan Finansial', 
    icon: 'Wallet',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    description: 'Investasi, passive income, financial freedom',
    keywords: ['kekayaan', 'finansial', 'investasi', 'passive income', 'kebebasan finansial', 'uang', 'wealth'],
    recommendedTone: 'Motivational',
    recommendedStyle: 'Conversational',
    aiModel: 'chatgpt'
  },
  { 
    id: 'family', 
    name: 'Keluarga & Parenting', 
    icon: 'Users',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    description: 'Parenting, hubungan keluarga, pendidikan anak',
    keywords: ['keluarga', 'parenting', 'anak', 'pendidikan', 'rumah tangga', 'hubungan'],
    recommendedTone: 'Warm',
    recommendedStyle: 'Conversational',
    aiModel: 'chatgpt'
  },
  { 
    id: 'spirituality', 
    name: 'Kerohanian & Spiritualitas', 
    icon: 'Heart',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    description: 'Pertumbuhan spiritual, keagamaan, inner peace',
    keywords: ['rohani', 'spiritual', 'agama', 'iman', 'doa', 'meditasi', 'inner peace'],
    recommendedTone: 'Inspirational',
    recommendedStyle: 'Reflective',
    aiModel: 'chatgpt'
  },
  { 
    id: 'health', 
    name: 'Kebugaran & Kesehatan', 
    icon: 'Dumbbell',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 dark:bg-rose-950',
    description: 'Fitness, nutrisi, wellness, gaya hidup sehat',
    keywords: ['kesehatan', 'fitness', 'olahraga', 'nutrisi', 'diet', 'wellness', 'kebugaran'],
    recommendedTone: 'Energetic',
    recommendedStyle: 'Practical',
    aiModel: 'chatgpt'
  },
  { 
    id: 'hobby', 
    name: 'Hobi & Kreativitas', 
    icon: 'Palette',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    description: 'Hobi, kerajinan, seni, koleksi, DIY',
    keywords: ['hobi', 'hobby', 'kreativitas', 'seni', 'kerajinan', 'DIY', 'koleksi', 'musik', 'fotografi'],
    recommendedTone: 'Playful',
    recommendedStyle: 'Conversational',
    aiModel: 'chatgpt'
  },
  { 
    id: 'general', 
    name: 'Umum / Lainnya', 
    icon: 'Sparkles',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    description: 'Topik umum dan fleksibel',
    keywords: [],
    recommendedTone: 'Default',
    recommendedStyle: 'Default',
    aiModel: 'dokumentender'
  },
] as const;

// --- AI MODEL RECOMMENDATIONS ---
export const AI_MODEL_RECOMMENDATIONS = [
  { 
    id: 'dokumentender', 
    name: 'DokumenTender AI', 
    url: 'https://chat.dokumentender.com',
    icon: 'Bot',
    color: 'bg-gradient-to-r from-primary to-purple-600',
    textColor: 'text-white',
    description: 'Whitelabel LLM terbaik untuk eksekusi prompt. Dioptimalkan untuk industri Indonesia.',
    recommended: true,
    strengths: ['Bahasa Indonesia', 'Dokumen Teknis', 'Industri Lokal', 'Tender & Proposal'],
    bestFor: ['Semua topik', 'Dokumen formal', 'Industri teknik', 'Proposal tender']
  },
  { 
    id: 'chatgpt', 
    name: 'ChatGPT (OpenAI)', 
    url: 'https://chatgpt.com',
    icon: 'MessageCircle',
    color: 'bg-emerald-500',
    textColor: 'text-white',
    description: 'Model versatile dengan kemampuan reasoning yang kuat.',
    recommended: false,
    strengths: ['Versatile', 'Reasoning', 'Coding', 'Kreativitas'],
    bestFor: ['Brainstorming', 'Content marketing', 'Scripting', 'Kursus online']
  },
  { 
    id: 'claude', 
    name: 'Claude (Anthropic)', 
    url: 'https://claude.ai',
    icon: 'Brain',
    color: 'bg-orange-500',
    textColor: 'text-white',
    description: 'Unggul dalam analisis mendalam dan dokumen teknis panjang.',
    recommended: false,
    strengths: ['Long-form', 'Analisis', 'Teknis', 'Akurasi'],
    bestFor: ['Dokumen teknis', 'SOP kompleks', 'Analisis mendalam', 'Engineering']
  },
  { 
    id: 'gemini', 
    name: 'Gemini (Google)', 
    url: 'https://gemini.google.com',
    icon: 'Sparkles',
    color: 'bg-blue-500',
    textColor: 'text-white',
    description: 'Multimodal dengan akses data terkini.',
    recommended: false,
    strengths: ['Multimodal', 'Data terkini', 'Research', 'Faktual'],
    bestFor: ['Riset pasar', 'Data statistik', 'Konten berbasis fakta']
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    url: 'https://chat.deepseek.com',
    icon: 'Search',
    color: 'bg-cyan-600',
    textColor: 'text-white',
    description: 'Model efisien dengan kemampuan teknis tinggi.',
    recommended: false,
    strengths: ['Efisien', 'Teknis', 'Coding', 'Matematis'],
    bestFor: ['Kalkulasi teknis', 'Coding', 'Dokumen matematis']
  },
  { 
    id: 'perplexity', 
    name: 'Perplexity AI', 
    url: 'https://www.perplexity.ai',
    icon: 'Globe',
    color: 'bg-teal-500',
    textColor: 'text-white',
    description: 'Search-powered AI dengan sumber referensi.',
    recommended: false,
    strengths: ['Search', 'Referensi', 'Akurat', 'Up-to-date'],
    bestFor: ['Research', 'Fact-checking', 'Sitasi sumber']
  },
] as const;

// --- INDUSTRY-SPECIFIC DOCUMENT TEMPLATES ---
export const INDUSTRY_DOCUMENT_TEMPLATES: Record<string, string[]> = {
  engineering: [
    'Technical Specification Document',
    'Design Calculation Report',
    'Engineering Drawing Index',
    'Material Take-Off (MTO)',
    'Method Statement',
    'Technical Proposal',
    'Inspection Test Plan (ITP)',
    'Commissioning Procedure',
  ],
  construction: [
    'Construction Method Statement',
    'Project Execution Plan (PEP)',
    'Quality Assurance Plan',
    'HSE Plan',
    'Progress Report',
    'Variation Order Request',
    'Site Instruction',
    'Work Breakdown Structure (WBS)',
  ],
  mining: [
    'Mining Plan Document',
    'Feasibility Study Report',
    'Environmental Impact Assessment',
    'Ore Reserve Statement',
    'Mine Closure Plan',
    'Blasting Procedure',
    'Reclamation Plan',
    'Geotechnical Report',
  ],
  oil_gas: [
    'Process Flow Diagram (PFD) Description',
    'P&ID Legend Document',
    'HSE Management Plan',
    'Emergency Response Plan',
    'Work Permit Procedure',
    'PTW (Permit to Work) SOP',
    'HAZOP Study Report',
    'Management of Change (MOC)',
  ],
  electricity: [
    'Power System Study Report',
    'Load Flow Analysis',
    'Protection Coordination Study',
    'Electrical Single Line Diagram Spec',
    'Cable Schedule',
    'Grounding System Design',
    'Maintenance Schedule',
    'Energy Audit Report',
  ],
  manufacturing: [
    'Standard Operating Procedure (SOP)',
    'Work Instruction (WI)',
    'Quality Control Plan',
    'Process Flow Chart',
    'FMEA Document',
    'Preventive Maintenance Schedule',
    'OEE Calculation Template',
    'Lean Manufacturing Guide',
  ],
  umkm: [
    'Business Plan Sederhana',
    'Proposal Pengajuan Modal',
    'SOP Operasional Usaha',
    'Katalog Produk',
    'Price List Template',
    'Laporan Keuangan Sederhana',
    'Panduan Customer Service',
    'Marketing Plan UMKM',
  ],
  wealth: [
    'Rencana Keuangan Pribadi',
    'Panduan Investasi Pemula',
    'Passive Income Blueprint',
    'Budget Planner Template',
    'Strategi Menabung',
    'Analisis Portofolio',
    'Financial Goal Setting',
    'Debt Management Plan',
  ],
  family: [
    'Panduan Parenting Positif',
    'Jadwal Aktivitas Keluarga',
    'Panduan Komunikasi Keluarga',
    'Child Development Milestone',
    'Homeschooling Curriculum',
    'Family Budget Planner',
    'Panduan Pendidikan Anak',
    'Quality Time Activity Guide',
  ],
  spirituality: [
    'Panduan Meditasi Harian',
    'Jurnal Syukur',
    'Panduan Doa & Refleksi',
    'Spiritual Growth Planner',
    'Panduan Puasa & Ibadah',
    'Mindfulness Exercises',
    'Panduan Kajian Kitab',
    'Inner Peace Workbook',
  ],
  health: [
    'Workout Plan Template',
    'Meal Prep Guide',
    'Panduan Diet Sehat',
    'Fitness Tracking Log',
    'Panduan Nutrisi Harian',
    'Mental Health Checklist',
    'Sleep Optimization Guide',
    'Wellness Assessment Template',
  ],
  hobby: [
    'Panduan Memulai Hobi Baru',
    'Project Tracker Template',
    'Panduan DIY Step-by-Step',
    'Collection Catalog Template',
    'Skill Progress Tracker',
    'Creative Journal Template',
    'Hobby Budget Planner',
    'Community Building Guide',
  ],
  general: [],
};

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
  { name: 'DokumenTender AI', url: 'https://ai.dokumentender.com', color: 'text-primary' },
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
  industry: z.string().default('general'),
  selectedAiModel: z.string().default('dokumentender'),
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
