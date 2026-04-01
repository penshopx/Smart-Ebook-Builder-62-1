import { z } from "zod";
import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Re-export auth models
export * from "./models/auth";

// Chat/Conversation tables for chatbot
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

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
    id: 'perijinan_usaha', 
    name: 'Perijinan Usaha', 
    icon: 'FileCheck',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    description: 'NIB, SIUP, izin lingkungan, OSS, PTSP',
    keywords: ['perizinan', 'izin usaha', 'NIB', 'OSS', 'SIUP', 'legalitas', 'PTSP'],
    recommendedTone: 'Formal',
    recommendedStyle: 'Process-Oriented',
    aiModel: 'dokumentender'
  },
  { 
    id: 'tender', 
    name: 'Tender & Pengadaan', 
    icon: 'ClipboardList',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    description: 'Dokumen penawaran, pengadaan barang/jasa, LPSE',
    keywords: ['tender', 'pengadaan', 'LPSE', 'penawaran', 'procurement', 'RKS', 'bill of quantity'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Technical',
    aiModel: 'dokumentender'
  },
  { 
    id: 'sbu', 
    name: 'Sertifikasi (SBU)', 
    icon: 'Award',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    description: 'Sertifikat Badan Usaha, klasifikasi, kualifikasi',
    keywords: ['SBU', 'sertifikat badan usaha', 'klasifikasi', 'kualifikasi', 'LPJK', 'IUJK'],
    recommendedTone: 'Formal',
    recommendedStyle: 'Technical',
    aiModel: 'dokumentender'
  },
  { 
    id: 'skk', 
    name: 'Sertifikasi (SKK)', 
    icon: 'GraduationCap',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    description: 'Sertifikat Kompetensi Kerja, ujian SKK, portofolio',
    keywords: ['SKK', 'sertifikat kompetensi', 'SKA', 'SKT', 'LPJK', 'portofolio', 'ujian kompetensi'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Instructive',
    aiModel: 'dokumentender'
  },
  { 
    id: 'manajemen_proyek', 
    name: 'Manajemen Proyek', 
    icon: 'Kanban',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950',
    description: 'Perencanaan, monitoring, kontrol proyek',
    keywords: ['manajemen proyek', 'project management', 'WBS', 'gantt chart', 'PMP', 'PMBOK', 'milestone'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Process-Oriented',
    aiModel: 'claude'
  },
  { 
    id: 'erp', 
    name: 'ERP & Sistem Informasi', 
    icon: 'Database',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50 dark:bg-violet-950',
    description: 'SAP, Oracle, Odoo, implementasi ERP, digitalisasi',
    keywords: ['ERP', 'SAP', 'Oracle', 'Odoo', 'implementasi', 'sistem informasi', 'modul', 'digitalisasi'],
    recommendedTone: 'Technical',
    recommendedStyle: 'Technical',
    aiModel: 'claude'
  },
  { 
    id: 'bim', 
    name: 'BIM & Desain Digital', 
    icon: 'Box',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950',
    description: 'Building Information Modeling, Revit, AutoCAD',
    keywords: ['BIM', 'building information modeling', 'Revit', 'AutoCAD', 'LOD', 'BEP', 'clash detection'],
    recommendedTone: 'Technical',
    recommendedStyle: 'Technical',
    aiModel: 'claude'
  },
  { 
    id: 'pub', 
    name: 'Pengembangan Usaha Berkelanjutan', 
    icon: 'Leaf',
    color: 'text-green-700',
    bgColor: 'bg-green-50 dark:bg-green-950',
    description: 'ESG, sustainability, CSR, green business, SDGs',
    keywords: ['ESG', 'sustainability', 'CSR', 'green', 'keberlanjutan', 'PUB', 'lingkungan', 'SDGs'],
    recommendedTone: 'Authoritative',
    recommendedStyle: 'Analytical',
    aiModel: 'chatgpt'
  },
  { 
    id: 'pkb', 
    name: 'Pengembangan Keprofesian Berkelanjutan', 
    icon: 'BookOpen',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 dark:bg-sky-950',
    description: 'CPD, portofolio profesi, pengembangan karir',
    keywords: ['PKB', 'CPD', 'pengembangan keprofesian', 'portofolio', 'pelatihan', 'kompetensi profesional'],
    recommendedTone: 'Professional',
    recommendedStyle: 'Instructive',
    aiModel: 'chatgpt'
  },
  { 
    id: 'iso', 
    name: 'Sertifikasi Sistem Manajemen (ISO)', 
    icon: 'ShieldCheck',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    description: 'ISO 9001, 14001, 45001, SMK3, audit, sertifikasi',
    keywords: ['ISO', 'ISO 9001', 'ISO 14001', 'ISO 45001', 'SMK3', 'audit', 'sertifikasi sistem manajemen'],
    recommendedTone: 'Authoritative',
    recommendedStyle: 'Process-Oriented',
    aiModel: 'claude'
  },
  { 
    id: 'kpk', 
    name: 'Pancek KPK', 
    icon: 'Scale',
    color: 'text-red-700',
    bgColor: 'bg-red-50 dark:bg-red-950',
    description: 'Pencegahan korupsi, gratifikasi, WBS, integritas',
    keywords: ['KPK', 'korupsi', 'gratifikasi', 'whistleblowing', 'integritas', 'LHKPN', 'GCG'],
    recommendedTone: 'Formal',
    recommendedStyle: 'Analytical',
    aiModel: 'dokumentender'
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
  perijinan_usaha: [
    'Panduan Pengurusan NIB (Nomor Induk Berusaha)',
    'Checklist Persyaratan Izin Usaha',
    'SOP Pengajuan Perizinan OSS',
    'Panduan PTSP (Pelayanan Terpadu Satu Pintu)',
    'Template Surat Permohonan Izin',
    'Panduan Izin Lingkungan (AMDAL/UKL-UPL)',
    'Checklist Dokumen Legalitas Perusahaan',
    'Panduan Perpanjangan Izin Usaha',
  ],
  tender: [
    'Dokumen Penawaran Teknis',
    'Dokumen Penawaran Harga (BQ)',
    'Metode Pelaksanaan Pekerjaan',
    'Rencana Keselamatan Konstruksi (RKK)',
    'Jadwal Pelaksanaan Proyek (Kurva S)',
    'Kualifikasi Perusahaan & Pengalaman',
    'Surat Jaminan Penawaran',
    'Analisa Harga Satuan Pekerjaan',
  ],
  sbu: [
    'Panduan Permohonan SBU Konstruksi',
    'Checklist Dokumen Kualifikasi SBU',
    'Template Daftar Pengalaman Pekerjaan',
    'Panduan Klasifikasi & Sub-Klasifikasi SBU',
    'SOP Perpanjangan SBU',
    'Template Neraca Keuangan Perusahaan',
    'Panduan SBU Konsultan (INKINDO)',
    'Template Penilaian Kemampuan Dasar (PKD)',
  ],
  skk: [
    'Panduan Permohonan SKK (Sertifikat Kompetensi Kerja)',
    'Template Portofolio Pekerjaan SKK',
    'Modul Persiapan Ujian SKK',
    'Checklist Dokumen Persyaratan SKK',
    'Panduan Uji Kompetensi (Asesi)',
    'Template Surat Keterangan Pengalaman Kerja',
    'Panduan Perpanjangan SKK',
    'Rangkuman Materi Kompetensi per Bidang',
  ],
  manajemen_proyek: [
    'Project Charter & Scope of Work',
    'Work Breakdown Structure (WBS)',
    'Project Schedule (Gantt Chart)',
    'Risk Register & Mitigation Plan',
    'Communication Management Plan',
    'Project Monitoring & Control Report',
    'Change Management Log',
    'Project Closure Report & Lesson Learned',
  ],
  erp: [
    'User Manual ERP (per Modul)',
    'SOP Implementasi ERP',
    'Dokumen Business Process Mapping',
    'Data Migration Plan',
    'Training Material ERP',
    'Go-Live Checklist ERP',
    'Technical Specification ERP',
    'Panduan Troubleshooting & Helpdesk ERP',
  ],
  bim: [
    'BIM Execution Plan (BEP)',
    'Model Coordination Protocol',
    'LOD (Level of Development) Specification',
    'BIM Standards & Guidelines',
    'Clash Detection Report',
    'Panduan Penggunaan Revit untuk Proyek',
    '4D BIM Schedule Integration Guide',
    'As-Built BIM Model Delivery Protocol',
  ],
  pub: [
    'Laporan Keberlanjutan (Sustainability Report)',
    'CSR Program Plan',
    'ESG Assessment Framework',
    'Carbon Footprint Calculation Guide',
    'Green Building Certification Guide',
    'Rencana Pengelolaan Lingkungan (RKL)',
    'SDGs Alignment Report',
    'Panduan Pengembangan Usaha Berkelanjutan',
  ],
  pkb: [
    'Rencana Pengembangan Keprofesian (CPD Plan)',
    'Template Portofolio Profesional',
    'Panduan Penyusunan Logbook PKB',
    'Modul Pelatihan Keprofesian',
    'Template Sertifikat & Bukti Pelatihan',
    'Panduan Registrasi PKB Online',
    'Rencana Mentoring & Coaching',
    'Self-Assessment Kompetensi Profesional',
  ],
  iso: [
    'Gap Analysis ISO (9001/14001/45001)',
    'Manual Mutu (Quality Manual) ISO 9001',
    'Prosedur Audit Internal',
    'Dokumentasi Tinjauan Manajemen',
    'Corrective Action Report (CAR)',
    'Panduan Penerapan SMK3',
    'Risk & Opportunity Register (ISO)',
    'Panduan Sertifikasi Sistem Manajemen Terintegrasi',
  ],
  kpk: [
    'Panduan Pencegahan Korupsi & Gratifikasi',
    'SOP Pelaporan Gratifikasi',
    'Panduan Whistleblowing System (WBS)',
    'Kode Etik & Perilaku Integritas',
    'Template LHKPN (Laporan Harta Kekayaan)',
    'Panduan Benturan Kepentingan (Conflict of Interest)',
    'Modul Pelatihan Anti Korupsi',
    'Panduan GCG (Good Corporate Governance)',
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

export const EBOOK_LEVELS = ["Single Ebook", "Trilogi Simple (3 Ebook)", "Modul Kompleks (3 Trilogi = 9 Ebook)"] as const;

export const EBOOK_SERIES_DATA: Record<string, Array<{ id: number; label: string; level?: string }>> = {
  "Single Ebook": [
    { id: 1, label: "Ebook Utama (Single)" }
  ],
  "Trilogi Simple (3 Ebook)": [
    { id: 1, label: "Buku 1: Basic (Dasar & Fondasi)", level: "Basic" },
    { id: 2, label: "Buku 2: Intermediate (Strategi & Implementasi)", level: "Intermediate" },
    { id: 3, label: "Buku 3: Advance (Pengembangan & Scaling)", level: "Advance" }
  ],
  "Modul Kompleks (3 Trilogi = 9 Ebook)": [
    { id: 1, label: "Trilogi 1 - Buku 1: Mindset & Dasar", level: "Basic" },
    { id: 2, label: "Trilogi 1 - Buku 2: Validasi Market", level: "Basic" },
    { id: 3, label: "Trilogi 1 - Buku 3: Persiapan Produk", level: "Basic" },
    { id: 4, label: "Trilogi 2 - Buku 1: Strategi Marketing", level: "Intermediate" },
    { id: 5, label: "Trilogi 2 - Buku 2: Funnel & Sales", level: "Intermediate" },
    { id: 6, label: "Trilogi 2 - Buku 3: Operasional", level: "Intermediate" },
    { id: 7, label: "Trilogi 3 - Buku 1: Tim & Delegasi", level: "Advance" },
    { id: 8, label: "Trilogi 3 - Buku 2: Automasi Sistem", level: "Advance" },
    { id: 9, label: "Trilogi 3 - Buku 3: Ekspansi & Exit", level: "Advance" }
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
  { id: 'MINI_APP_BUILDER', label: 'Mini App Builder', icon: 'Smartphone', description: 'Rancang blueprint mini app dari konten ebook' },
  { id: 'QUIZ_MAKER', label: 'Quiz Maker', icon: 'ClipboardList', description: 'Buat soal kuis & asesmen dari ebook' },
  { id: 'PODCAST_GENERATOR', label: 'Podcast Generator', icon: 'Mic2', description: 'Generate script podcast 2 orang (Host + Guest)' },
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
  appType: z.string().default('web'),
  appComplexity: z.string().default('simple'),
  quizFocus: z.string().default('komprehensif'),
  jumlahIde: z.string().default('5'),
  brainstormAngle: z.string().default('Problem-Solution'),
  bigIdeaAngle: z.string().default('Unik & Berbeda'),
  jumlahBab: z.string().default('7'),
  outlineDepth: z.string().default('Standard'),
  podcastHost: z.string().default('Andi'),
  podcastGuest: z.string().default('Sari'),
  podcastStyle: z.string().default('interview'),
  podcastEpisodeLength: z.string().default('15-20 menit'),
  podcastSegments: z.string().default('5'),
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
