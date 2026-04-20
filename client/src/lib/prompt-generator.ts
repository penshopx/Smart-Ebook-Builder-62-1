import type { ProjectData, TaskConfig, ExtendConfig, UploadedFile } from '@shared/schema';
import { EBOOK_SERIES_DATA, INDUSTRIES, INDUSTRY_DOCUMENT_TEMPLATES } from '@shared/schema';

function getIndustryContext(industryId: string): string {
  const industry = INDUSTRIES.find(i => i.id === industryId);
  if (!industry || industryId === 'general') {
    return '';
  }
  
  const templates = INDUSTRY_DOCUMENT_TEMPLATES[industryId] || [];
  const templatesText = templates.length > 0 
    ? `\n   Dokumen industri yang relevan: ${templates.slice(0, 5).join(', ')}`
    : '';
  
  return `
=== KONTEKS INDUSTRI SPESIFIK ===
Ebook ini ditujukan untuk industri: **${industry.name}**
- Deskripsi: ${industry.description}
- Kata kunci industri: ${industry.keywords.join(', ')}
- Tone yang disarankan: ${industry.recommendedTone}
- Gaya penulisan yang disarankan: ${industry.recommendedStyle}${templatesText}

PENTING: Sesuaikan terminologi, contoh kasus, dan referensi dengan standar industri ${industry.name}.
Gunakan istilah teknis yang umum digunakan di sektor ini.
`;
}

function getMultiIndustryContext(industryValue: string): { context: string; displayName: string } {
  const ids = industryValue ? industryValue.split(',').filter(Boolean) : ['general'];
  const nonGeneral = ids.filter(id => id !== 'general');

  if (nonGeneral.length === 0) {
    return { context: '', displayName: 'Umum' };
  }

  if (nonGeneral.length === 1) {
    const ind = INDUSTRIES.find(i => i.id === nonGeneral[0]);
    return {
      context: getIndustryContext(nonGeneral[0]),
      displayName: ind?.name || 'Umum',
    };
  }

  const industries = nonGeneral
    .map(id => INDUSTRIES.find(i => i.id === id))
    .filter(Boolean) as typeof INDUSTRIES[number][];

  const names = industries.map(i => i.name).join(', ');
  const keywords = [...new Set(industries.flatMap(i => i.keywords))].slice(0, 12).join(', ');
  const allTemplates = [...new Set(
    nonGeneral.flatMap(id => INDUSTRY_DOCUMENT_TEMPLATES[id] || [])
  )].slice(0, 6);
  const templatesText = allTemplates.length > 0
    ? `\n   Dokumen relevan lintas sektor: ${allTemplates.join(', ')}`
    : '';

  const context = `
=== KONTEKS MULTI-INDUSTRI ===
Ebook ini mencakup persilangan beberapa industri: **${names}**
- Kata kunci gabungan: ${keywords}${templatesText}

PENTING: Integrasikan perspektif dari SEMUA sektor tersebut. Gunakan contoh kasus nyata dari masing-masing industri dan tunjukkan bagaimana topik ini relevan di setiap sektor. Hindari hanya fokus pada satu industri saja.
`;

  return { context, displayName: names };
}

export function generatePrompt(
  activeMode: string,
  projectData: ProjectData,
  taskConfig: TaskConfig,
  extendConfig: ExtendConfig,
  uploadedFiles: UploadedFile[]
): string {
  // Resolve effective style: per-ebook override (if set) takes priority over global
  const perEbookStyle = projectData.ebookStyles?.[taskConfig.selectedEbookId.toString()];
  const effectiveTone = perEbookStyle?.tone || projectData.tone;
  const effectiveStyle = perEbookStyle?.writingStyle || projectData.writingStyle;
  const effectiveCharacter = perEbookStyle?.aiCharacter || projectData.aiCharacter;
  const hasPerEbookOverride = !!perEbookStyle && (
    perEbookStyle.tone !== projectData.tone ||
    perEbookStyle.writingStyle !== projectData.writingStyle ||
    perEbookStyle.aiCharacter !== projectData.aiCharacter
  );

  const agenticLogic = effectiveCharacter.includes("Agentic") 
    ? `
=== AGENTIC THOUGHT PROCESS (ATTENTIVE MODE) ===
Anda adalah **Agentic AI yang Cerdas & Attentive**. Sebelum memberikan jawaban akhir, lakukan langkah berikut di dalam "pikiran" Anda:
1. **Analisis Niat:** Apa yang *sebenarnya* diinginkan user di balik perintah ini?
2. **Cek Kelengkapan:** Apakah data user sudah cukup? Jika kurang, gunakan asumsi logis terbaik (jangan hanya bertanya balik).
3. **Antisipasi:** Apa langkah selanjutnya yang mungkin dibutuhkan user? Sertakan dalam jawaban.
4. **Self-Critique:** Apakah jawaban ini terlalu generik? Jika ya, buat lebih spesifik dan *actionable*.
` 
    : `
=== KARAKTER AI ===
Berperanlah sebagai: **${effectiveCharacter}**.
`;

  const { context: industryContext, displayName: industryDisplayName } = getMultiIndustryContext(projectData.industry || 'general');

  const systemPrompt = `
Anda adalah "Chaesa AI Studio", mesin pembuat ekosistem ebook profesional yang dirancang untuk menangani **BERBAGAI TOPIK (Generik)**.
Aplikasi ini fleksibel dan tidak terbatas pada satu industri tertentu.

${agenticLogic}
${industryContext}
=== DATA UTAMA DARI FORM ===
- Topik/Kata Kunci: ${projectData.topik || '[Belum diisi]'}
- Judul Ebook (Utama): ${projectData.judul || '[Belum diisi]'}
- Target Pembaca: ${projectData.target || '[Belum diisi]'}
- Level Ebook: ${projectData.level}
- Pain Point/Masalah: ${projectData.painPoint || '[Belum diisi]'}
- Industri/Sektor: ${industryDisplayName}

=== PENGATURAN GAYA & FORMAT (WAJIB DIIKUTI) ===
Instruksi di bawah ini bersifat MANDATORI:
1. BAHASA OUTPUT: Gunakan **${projectData.language}** sepenuhnya.
2. FORMAT STRUKTUR: **${projectData.outputFormat}**.
3. NADA BICARA (TONE): **${effectiveTone}**${hasPerEbookOverride ? ' *(kustom untuk ebook ini)*' : ''}.
4. GAYA PENULISAN (STYLE): **${effectiveStyle}**${hasPerEbookOverride ? ' *(kustom untuk ebook ini)*' : ''}.

=== REKOMENDASI EKSEKUSI ===
Setelah prompt ini selesai, disarankan untuk mengeksekusi di **chat.dokumentender.com** 
untuk hasil optimal dalam Bahasa Indonesia dan dokumen teknis industri.

=== INSTRUKSI UMUM ===
Kerjakan tugas di bawah ini dengan output yang TERSTRUKTUR, MENDALAM, dan SIAP PAKAI.
`;

  let taskInstruction = "";
  const styleReminder = `
[PENTING: Pastikan Output menggunakan format: ${projectData.outputFormat}, Tone: ${effectiveTone}, Style: ${effectiveStyle}, Bahasa: ${projectData.language}]
`;

  const finalJudulBab = taskConfig.judulBab === "Custom / Tulis Judul Sendiri..." ? taskConfig.manualJudulBab : taskConfig.judulBab;
  
  const currentSeriesList = EBOOK_SERIES_DATA[projectData.level] || [];
  const currentEbookObj = currentSeriesList.find(e => e.id.toString() === taskConfig.selectedEbookId.toString());
  const currentEbookTitle = currentEbookObj ? currentEbookObj.label : "Ebook Utama";

  switch (activeMode) {
    case 'BRAINSTORM':
      const hasFiles = uploadedFiles.length > 0;
      const isAutoGenerate = !projectData.painPoint && !projectData.bigIdea && !projectData.hasilRiset;
      
      taskInstruction = `
MODE TUGAS: BRAINSTORMING IDE & POSITIONING (DARI REFERENSI & KEYWORD)
${styleReminder}

Saya ingin mencari ide ebook yang kuat.

DATA INPUT:
1. Topik/Kata Kunci Utama: **"${projectData.topik || '[Isi Topik Anda]'}"**
2. Angle/Pendekatan: **${taskConfig.brainstormAngle || 'Problem-Solution'}**
3. Level Kedalaman: **${taskConfig.fokusLevel || 'Intermediate'}**
${hasFiles ? `
4. FILE REFERENSI YANG DILAMPIRKAN:
   (Saya telah mengupload file ke dalam chat ini. Tolong baca dan analisis kontennya)
   Daftar File:
   ${uploadedFiles.map(f => `- [${f.name}]`).join('\n   ')}
` : ''}
${!isAutoGenerate ? `
5. Data Tambahan User:
   - Masalah: ${projectData.painPoint}
   - Konsep Awal: ${projectData.bigIdea}
   - Data Riset: ${projectData.hasilRiset}
` : ''}

TUGAS ANDA:
${hasFiles ? `
1. **Analisis Mendalam File:** Baca seluruh konten file yang saya lampirkan (Transkrip Video/Audio, Isi PDF, Data Excel, atau Visual Gambar).
2. **Ekstraksi Insight:** Cari pola, masalah tersembunyi, atau metode unik dari file tersebut yang berkaitan dengan Kata Kunci "${projectData.topik}".
3. **Sintesis Ide:** Gabungkan insight dari file tersebut dengan tren pasar saat ini.
` : `
1. Lakukan riset pasar simulasi berdasarkan topik "${projectData.topik}".
`}

OUTPUT YANG DIMINTA (${taskConfig.jumlahIde || '5'} OPSI IDE EBOOK dengan pendekatan ${taskConfig.brainstormAngle || 'Problem-Solution'}):
Untuk setiap opsi, berikan:
- **Judul Ebook yang Menjual**
- **Target Spesifik & Niche** (Level: ${taskConfig.fokusLevel || 'Intermediate'})
- **Analisis Masalah (Pain Point):** (Jika ada file, tunjukkan bagaimana file tersebut memvalidasi masalah ini).
- **Big Idea & Positioning:** (Jelaskan "Why" ebook ini berbeda berdasarkan referensi yang ada).
- **Data Pendukung:** (Kutip poin penting dari file referensi atau pengetahuan umum).
`;
      break;

    case 'ECOURSE_BUILDER':
      taskInstruction = `
MODE TUGAS: E-COURSE BLUEPRINT GENERATOR (DARI EBOOK KE KURSUS)
${styleReminder}

Saya ingin mengubah materi ebook ini menjadi sebuah **E-Course (Kursus Online)** yang komprehensif.
Anda bertindak sebagai **Instructional Designer** yang ahli dalam membuat kurikulum pembelajaran.

=== DATA KURSUS ===
1. **Sumber Materi:** Ebook "${projectData.judul}" (Topik: ${projectData.topik})
2. **Durasi Kursus:** ${taskConfig.courseDuration || '4 Minggu (Standard)'}
3. **Format Delivery:** ${taskConfig.courseFormat || 'Video + Worksheet'}
4. **Tujuan Akhir Siswa (Goal):** ${taskConfig.courseGoal || 'Menguasai skill praktis dari topik ini'}

=== TUGAS ANDA ===
Buatkan Blueprint Kurikulum Lengkap yang memecah materi ebook menjadi paket pembelajaran yang mudah dicerna.

Struktur Output yang Diminta:
1. **Nama E-Course:** (Buat nama yang lebih "Action-Oriented" dibanding judul ebook).
2. **Transformasi Siswa:** (Before vs After mengikuti kursus).
3. **Struktur Modul (Curriculum Roadmap):**
   - Bagi materi menjadi Modul/Minggu (sesuai durasi).
   - Untuk SETIAP Modul, rincikan:
     - **Judul Modul:**
     - **Learning Objective:** (Apa yang dipelajari).
     - **Daftar Lesson (Video/Materi):** (Topik video 1, Topik video 2, dst).
     - **Action Item / Tugas:** (Apa yang harus siswa kerjakan).
     - **Aset Pendukung:** (Sebutkan worksheet/template yang dibutuhkan, ambil dari ebook).
4. **Bonus Ideas:** Ide bonus modul atau webinar untuk menambah nilai jual kursus.
`;
      break;

    case 'DOC_GENERATOR': {
      const docList = taskConfig.docType
        ? taskConfig.docType.split('|||').map(s => s.trim()).filter(Boolean)
        : ['Standard Operating Procedure (SOP)'];
      const isMultiDoc = docList.length > 1;
      taskInstruction = `
MODE TUGAS: DOCUMENT GENERATOR (DOKUMEN KERJA)
${styleReminder}

Saya membutuhkan dokumen kerja profesional yang berkaitan dengan topik ebook ini.
Anda bertindak sebagai **Technical Writer / Legal Drafter Profesional**.

=== SPESIFIKASI DOKUMEN ===
1. **Jenis Dokumen${isMultiDoc ? ' (Paket ' + docList.length + ' Dokumen)' : ''}:**
${docList.map((d, i) => `   ${i + 1}. ${d}`).join('\n')}
2. **Konteks Spesifik:** ${taskConfig.docContext || `Terkait dengan penerapan materi dari ebook "${projectData.judul || projectData.topik}"`}
3. **Target Pengguna Dokumen:** ${projectData.target || 'Karyawan/Tim Internal'}

=== INSTRUKSI PENULISAN ===
${isMultiDoc
  ? `Buat SEMUA ${docList.length} dokumen di atas secara LENGKAP, FORMAL, dan SIAP PAKAI.\nTampilkan setiap dokumen dalam blok terpisah dengan judul dokumen yang jelas (misalnya: "## DOKUMEN 1: ${docList[0]}").\nJangan hanya memberikan outline, tapi berikan ISI SEBENARNYA untuk setiap dokumen.`
  : 'Buat dokumen ini secara LENGKAP, FORMAL, dan SIAP PAKAI (Ready to use).\nJangan hanya memberikan outline, tapi berikan ISI SEBENARNYA.'
}

Struktur Wajib untuk setiap dokumen (Sesuaikan dengan jenis dokumen):
- **Header:** (Nama Dokumen, No. Dokumen [Placeholder], Tanggal).
- **Tujuan/Purpose:** Mengapa dokumen ini dibuat.
- **Ruang Lingkup/Scope:** Siapa yang terlibat.
- **Isi Utama:** (Pasal-pasal untuk Kebijakan, Langkah-langkah detail untuk SOP, Butir kesepakatan untuk SPK, dll).
- **Kolom Tanda Tangan:** (Dibuat, Diperiksa, Disetujui).

Pastikan bahasa yang digunakan baku dan sesuai standar industri.
`;
      break;
    }

    case 'MARKETING_KIT':
      const isVisualPrompt = taskConfig.marketingAsset.includes('Prompt Gambar') || taskConfig.marketingAsset.includes('Prompt Video');
      
      taskInstruction = `
MODE TUGAS: MARKETING KIT GENERATOR — INDONESIA EDITION
${styleReminder}

Saya membutuhkan materi pemasaran yang persuasif untuk menjual ebook/produk ini di pasar INDONESIA.
Anda bertindak sebagai **Expert Copywriter Indonesia** dan **Digital Marketing Strategist**.

=== DATA PRODUK ===
- Produk: Ebook "${projectData.judul}"
- Target: ${projectData.target}
- Masalah yang diselesaikan: ${projectData.painPoint}
- Topik: ${projectData.topik}
- Angle/Hook Khusus: ${taskConfig.marketingAngle || 'Fokus pada Transformasi & Kemudahan'}

=== INSTRUKSI ===
${isVisualPrompt ? `
**TUGAS: GENERATE AI IMAGE/VIDEO PROMPT**
Buatlah **Prompt Teknis dalam Bahasa Inggris** untuk Midjourney/DALL-E/Runway.
Struktur: Subject + Environment + Style + Parameters (--ar 16:9).
Buat 3 Variasi Prompt yang berbeda.
` : `
Tulis SELURUH 7 section berikut secara lengkap dan BERURUTAN.
Gunakan PERSIS pemisah === untuk setiap section.
`}

${!isVisualPrompt ? `
===== SALES PAGE COPY =====
Tulis sales page copy panjang menggunakan formula PAS/AIDA.
- Headline kuat yang menarik perhatian
- Opening: identifikasi masalah target
- Agitate: perbesar rasa sakit (pain)
- Solution: ebook ini sebagai solusinya
- Bullet benefits (minimal 7 poin)
- Social proof placeholder
- CTA yang kuat
- Bahasa: conversational, bukan kaku

===== POSTINGAN INSTAGRAM =====
Buat 3 variasi caption Instagram (panjang, sedang, pendek):
- Caption Panjang (200+ kata): storytelling + hook kuat + CTA ke bio link
- Caption Sedang (100 kata): bullet benefits + CTA
- Caption Pendek (30-50 kata): one-liner hook + CTA
- 15 hashtag Indonesia yang relevan (mix populer + niche)
- Ide untuk stories: 5 slide konten teaser

===== POSTINGAN LINKEDIN =====
Tulis post LinkedIn profesional:
- Hook kalimat pertama yang memancing klik "lihat selengkapnya"
- Cerita personal/case study singkat (problem → solution → result)
- 5 insight/tips dari ebook sebagai value teaser
- CTA soft-sell (bukan hard-sell) ke ebook
- Tone: profesional tapi personal, bukan corporate kaku

===== EMAIL MARKETING =====
Tulis sequence email 3-bagian:
EMAIL 1 — Welcome/Teaser: subject line + body perkenalan + cliffhanger
EMAIL 2 — Value/Edukasi: subject line + 1 insight besar dari ebook + soft CTA
EMAIL 3 — Penawaran/Closing: subject line + urgency + hard CTA + PS menarik
Format: [SUBJECT: ...] diikuti body email.

===== BROADCAST WHATSAPP =====
Buat 5 pesan WhatsApp untuk pasar Indonesia (170 juta pengguna, open rate 98%):
PESAN 1 — Broadcast Promosi Utama (max 300 karakter, langsung ke poin)
PESAN 2 — Follow-up D+1 (untuk yang belum beli)
PESAN 3 — Testimonial/Social Proof (format WA-friendly)
PESAN 4 — Last Call / Urgency (closing penawaran)
PESAN 5 — Template Auto-Reply FAQ (5 Q&A paling sering ditanya)
Gunakan emoji secukupnya. Bahasa santai tapi profesional khas Indonesia.

===== TIKTOK SCRIPT =====
Buat konten TikTok untuk pasar Indonesia (194 JUTA pengguna, pasar terbesar dunia):
HOOK KALIMAT PERTAMA (5 versi alternatif, max 10 kata, harus bikin penonton STOP scroll):
1. [Hook 1]
2. [Hook 2]
3. [Hook 3]
4. [Hook 4]
5. [Hook 5]

SCRIPT VIDEO 60 DETIK (siap dibacakan):
[0-5 detik] Hook: ...
[5-20 detik] Problem: ...
[20-40 detik] Solusi/Value: ...
[40-55 detik] Proof/Demo: ...
[55-60 detik] CTA: ...

IDE KONTEN 7 VIDEO dari ebook ini:
1. [Judul video + angle]
2. [Judul video + angle]
... dst

20 HASHTAG TIKTOK INDONESIA yang relevan (mix trending + niche)

===== TOKOPEDIA SHOPEE LISTING =====
Buat listing produk digital untuk Tokopedia & Shopee (platform jual ebook #1 Indonesia):

JUDUL PRODUK (max 60 karakter, SEO-optimized untuk search Tokped/Shopee):
[Judul listing yang mengandung keyword utama]

DESKRIPSI PRODUK (persuasif, terstruktur, max 2000 karakter):
Buka dengan hook kuat.
Isi manfaat dalam bullet points.
Spesifikasi: format file, jumlah halaman, dll.
Cara pembelian produk digital.
Penutup dengan CTA.

FAQ PRODUK DIGITAL (5 pertanyaan + jawaban):
Q1: [Pertanyaan umum tentang produk digital]
A1: ...
... dst

TAG/KEYWORD SHOPEE (10-15 tag untuk muncul di search):
[tag1, tag2, ...]

REKOMENDASI HARGA (dalam Rupiah, berdasarkan segmen target):
- Harga Normal: Rp [...]
- Harga Promo/Flash Sale: Rp [...]
- Strategi bundling (jika relevan)
` : ''}
`;
      break;

    case 'PROMPT_PACK': {
      const packWorkflowDetails: Record<string, { label: string; flow: string; steps: string[] }> = {
        ebook_author:      { label: '📚 Ebook Author Kit', flow: 'Ide → Riset → Outline → Draft Bab → Editing → Blurb & Promo', steps: ['Brainstorm & Validasi Ide', 'Riset Mendalam & Kompetitor Analisis', 'Outline Daftar Isi Lengkap', 'Draft Bab Utama', 'Editing & Polish Konten', 'Blurb, Judul Alternatif & Promo Copy'] },
        social_media:      { label: '📱 Social Media 30-Day Calendar', flow: 'Strategi → Pilar → Kalender → Caption → Hashtag', steps: ['Strategi & Positioning Brand', 'Tentukan Content Pillars', 'Susun Kalender Konten 30 Hari', 'Generate Caption Engaging', 'Riset & Cluster Hashtag Optimal'] },
        product_launch:    { label: '🚀 Product Launch Sequence', flow: 'Riset → Hook → Email Sequence → Sales Page → Follow-Up', steps: ['Riset Pasar & Positioning', 'Hook & Value Proposition', 'Email Pre-Launch (3 email)', 'Sales Page / Landing Page Copy', 'Email Follow-Up & Objection Handler'] },
        online_course:     { label: '🎓 Online Course Creator', flow: 'Kurikulum → Modul → Skrip → Slide → Kuis', steps: ['Desain Kurikulum & Learning Outcomes', 'Breakdown Modul & Lesson', 'Skrip Video per Lesson', 'Slide Deck & Visual Outline', 'Assessment & Quiz per Modul'] },
        seo_blog:          { label: '🔍 SEO Blog Post Workflow', flow: 'Keyword → Outline → Artikel → Meta → Optimasi', steps: ['Riset Keyword & Kompetitor', 'Outline Artikel Berbasis SEO', 'Tulis Artikel Lengkap', 'Meta Title & Meta Description', 'Internal Link & CTA Optimization'] },
        business_starter:  { label: '💼 Business Starter Pack', flow: 'Nama → Tagline → Value Prop → Model Bisnis → Pitch Deck', steps: ['Nama Brand & Identitas Bisnis', 'Tagline & Positioning Statement', 'Value Proposition & Target Pasar', 'Business Model Canvas', 'Elevator Pitch & Pitch Deck Outline'] },
        personal_brand:    { label: '🌟 Personal Branding Kit', flow: 'Niche → Bio → Pilar → Story → Portfolio', steps: ['Temukan Niche & Unique Authority', 'Bio Multi-Platform (LinkedIn, IG, Twitter)', 'Content Pillars & Editorial Voice', 'Brand Story & Origin Story', 'Showcase Portfolio & Social Proof'] },
        ecourse_marketing: { label: '💰 E-Course Launch Marketing', flow: 'Landing Page → Webinar → Email Funnel → Iklan → Closing', steps: ['Landing Page Copy Long-Form', 'Skrip Webinar / Live Selling', 'Email Funnel 5-7 Email', 'Ad Copy (Facebook/Instagram/TikTok)', 'Closing Script & Bonus Offer'] },
        umkm_digital:      { label: '🏪 UMKM Digital Starter', flow: 'Profil → Katalog → Caption → DM Script → Closing', steps: ['Profil Bisnis & Brand Story', 'Deskripsi Produk Katalog', 'Caption Jualan Media Sosial', 'Script DM & WhatsApp', 'Teknik Closing & Follow-Up'] },
        youtube_channel:   { label: '▶️ YouTube Channel Builder', flow: 'Niche → Strategi → Script → Thumbnail → SEO → Community', steps: ['Niche, Positioning & Channel Strategy', 'Skrip Video Pertama (Hook s/d Outro)', 'Judul & Thumbnail Hook Copy', 'Deskripsi & Tag SEO YouTube', 'Community Post & Engagement Strategy'] },
        newsletter_series: { label: '📧 Email Newsletter Series', flow: 'Welcome → Value → Nurture → Pitch → Reaktivasi', steps: ['Welcome Email & First Impression', 'Value Series (3 email edukasi)', 'Nurture & Relationship Building', 'Pitch Email (Soft → Hard Sell)', 'Re-engagement & Reaktivasi Subscriber'] },
        consultant_kit:    { label: '🧠 Consultant Toolkit', flow: 'Proposal → Scope → Deliverable → Laporan → Presentasi', steps: ['Template Proposal Jasa Konsultasi', 'Scoping & Project Plan', 'Deliverable & Working Document', 'Executive Summary & Laporan', 'Deck Presentasi & Follow-Up Email'] },
        training_module:   { label: '🏫 Training Module Designer', flow: 'TNA → Modul → Materi → Role-Play → Evaluasi', steps: ['Training Needs Analysis (TNA)', 'Desain Modul & Silabus', 'Materi & Handout Peserta', 'Skenario Role-Play & Studi Kasus', 'Lembar Evaluasi & Post-Test'] },
        research_writer:   { label: '🔬 Research & Academic Writer', flow: 'Topik → Literatur → Kerangka → Draf → Abstrak → Sitasi', steps: ['Definisi Topik & Pertanyaan Penelitian', 'Ulasan Literatur & Framework Teoritis', 'Kerangka Penulisan & Metodologi', 'Draf Konten per Bab/Seksi', 'Abstrak, Kesimpulan & Rekomendasi'] },
        startup_mvp:       { label: '⚡ Startup MVP Builder', flow: 'Problem → Solution → MVP → Roadmap → Pitch Deck → GTM', steps: ['Problem-Solution Fit Analysis', 'MVP Feature Scoping & Prioritas', 'Product Roadmap & Timeline', 'Investor Pitch Deck Outline', 'Go-to-Market Strategy'] },
        custom:            { label: '✏️ Workflow Kustom', flow: 'Sesuai tujuan Anda', steps: ['Tahap 1', 'Tahap 2', 'Tahap 3', 'Tahap 4', 'Tahap 5'] },
      };

      const aiToolNames: Record<string, string> = {
        chatgpt: 'ChatGPT (GPT-4o)',
        claude: 'Claude (Anthropic)',
        gemini: 'Gemini (Google)',
        perplexity: 'Perplexity AI',
        copilot: 'Microsoft Copilot',
        grok: 'Grok (xAI)',
        chaesa: 'Chaesa AI',
        universal: 'Platform AI Universal',
      };

      const depthInstructions: Record<string, string> = {
        beginner: `TINGKAT PEMULA: Setiap prompt harus:
- Dimulai dengan kalimat "Mulai percakapan baru dengan AI, lalu paste prompt berikut:"
- Sertakan penjelasan SEBELUM dan SESUDAH prompt tentang apa yang harus dilakukan user
- Instruksi di dalam prompt sangat detail, tidak ada asumsi
- Tambahkan catatan troubleshooting jika AI tidak memberikan hasil yang diharapkan`,
        intermediate: `TINGKAT MENENGAH: Setiap prompt:
- Langsung ke isi prompt tanpa terlalu banyak panduan awal
- Sisipkan teknik prompting yang sudah umum dikenal
- Berikan brief note (1 kalimat) tentang cara optimal menggunakannya`,
        advanced: `TINGKAT MAHIR: Setiap prompt:
- Padat, presisi, dan menggunakan teknik prompt engineering lanjutan
- Tidak perlu panduan dasar — asumsi user sudah mahir
- Fokus pada efisiensi dan hasil berkualitas tinggi`,
        expert: `TINGKAT EXPERT: Setiap prompt:
- Gunakan teknik meta-prompting, system-level framing, dan constraint engineering
- Prompt ditulis seperti gaya system prompt GPT
- Tidak ada panduan — murni teks prompt yang sudah siap dipaste`,
      };

      const outputStyleNotes: Record<string, string> = {
        structured: 'Output setiap prompt harus dalam format terstruktur: gunakan header ##, sub-header ###, dan bullet points. Wajib ada struktur yang jelas dan mudah di-scan.',
        narrative: 'Output setiap prompt dalam bentuk narasi mengalir — paragraf penuh, seperti artikel atau laporan. Hindari terlalu banyak poin-poin.',
        table: 'Output setiap prompt sebisa mungkin menggunakan tabel atau matrix untuk mempermudah perbandingan dan perencanaan.',
        template: 'Output setiap prompt berupa TEMPLATE dengan placeholder dalam format [NAMA_PLACEHOLDER] yang bisa langsung diisi oleh user.',
        mixed: 'Output setiap prompt kombinasi: penjelasan singkat + poin-poin key takeaway + minimal 1 contoh konkret / studi kasus.',
        code_script: 'Output setiap prompt berupa kode, formula Excel/Sheets, script automasi, atau template terstruktur yang siap dieksekusi.',
      };

      const selectedTechs = (taskConfig.packTechniques || '').split('|||').filter(Boolean);
      const techDesc: Record<string, string> = {
        chain_of_thought: 'TEKNIK CHAIN OF THOUGHT: Tambahkan instruksi "Pikirkan langkah demi langkah sebelum memberikan jawaban" di setiap prompt.',
        persona_acting: 'TEKNIK PERSONA ACTING: Setiap prompt dimulai dengan "Kamu adalah [expert/role spesifik]..." yang relevan dengan tahapan tersebut.',
        few_shot: 'TEKNIK FEW-SHOT: Sertakan 1-2 contoh konkret output ideal di dalam prompt sebagai referensi AI.',
        role_play: 'TEKNIK ROLE-PLAY: Frame prompt sebagai situasi nyata atau dialog antara user dan expert.',
        output_structure: 'TEKNIK OUTPUT STRUCTURING: Sertakan template format output yang harus diikuti AI secara persis.',
        self_critique: 'TEKNIK SELF-CRITIQUE: Di akhir setiap prompt, tambahkan "Sebelum menjawab, evaluasi draft-mu sendiri dan revisi jika perlu."',
        iterative_refine: 'TEKNIK ITERATIVE REFINEMENT: Setiap prompt secara eksplisit merujuk dan membangun dari output prompt sebelumnya.',
        constraint_based: 'TEKNIK CONSTRAINT-BASED: Tambahkan batasan ketat (panjang maksimum, format wajib, kata/frasa yang harus ada/dilarang).',
      };

      const appliedTechs = selectedTechs.map(t => techDesc[t]).filter(Boolean);
      const packInfo = packWorkflowDetails[taskConfig.packType] || packWorkflowDetails['custom'];
      const numPrompts = parseInt(taskConfig.packNumPrompts || '5', 10);
      const langNote = taskConfig.packLanguage === 'english' ? 'PENTING: Tulis semua prompt dalam Bahasa INGGRIS.' : taskConfig.packLanguage === 'bilingual' ? 'PENTING: Tulis judul & penjelasan dalam Bahasa Indonesia, tapi isi prompt dalam Bahasa Inggris.' : 'Tulis semua prompt dalam Bahasa Indonesia.';

      taskInstruction = `
MODE TUGAS: PROMPT PACK GENERATOR — WORKFLOW CREATOR
${styleReminder}

Bertindaklah sebagai **Senior Prompt Engineer & AI Workflow Specialist** yang berpengalaman merancang sistem prompting untuk klien profesional Indonesia.

Tugas Anda BUKAN membuat konten ebook — melainkan merancang **PACK berisi ${numPrompts} PROMPT BERURUTAN** yang membentuk sebuah workflow kerja end-to-end yang bisa dijalankan di **${aiToolNames[taskConfig.packAiTool || 'chatgpt']}**.

=== IDENTITAS PROJECT ===
- Topik / Bidang: **${projectData.topik}**
- Industri: ${projectData.industri || 'Umum'}
- Target Pengguna Pack: ${projectData.target || 'Profesional Indonesia'}
- Judul Ebook (konteks): ${projectData.judul || '[Belum ditentukan]'}
${taskConfig.packCustomContext ? `- Konteks Tambahan dari User: ${taskConfig.packCustomContext}` : ''}

=== SPESIFIKASI PACK ===
- **Jenis Workflow:** ${packInfo.label}
- **Alur:** ${packInfo.flow}
- **Platform AI:** ${aiToolNames[taskConfig.packAiTool || 'chatgpt']}
- **Jumlah Prompt:** ${numPrompts} prompt berurutan
- **Format Output:** ${outputStyleNotes[taskConfig.packOutputStyle || 'structured']}
- **Bahasa:** ${langNote}
${taskConfig.packType === 'custom' && taskConfig.packGoal ? `- **Tujuan Kustom:** ${taskConfig.packGoal}` : ''}

=== INSTRUKSI KEDALAMAN ===
${depthInstructions[taskConfig.packDepth || 'intermediate']}

=== TEKNIK PROMPTING YANG HARUS DITERAPKAN ===
${appliedTechs.length > 0 ? appliedTechs.join('\n') : '• Gunakan teknik prompt engineering terbaik yang sesuai dengan setiap tahapan workflow.'}

=== FORMAT OUTPUT PACK ===
Untuk setiap dari ${numPrompts} prompt, gunakan format ini PERSIS:

---
## 🔷 PROMPT [N] — [Nama Tahapan]
**Fungsi:** [Apa yang akan dihasilkan dari prompt ini — 1 kalimat]
**Input Dibutuhkan:** [Apa yang user perlu siapkan sebelum menjalankan prompt ini]
**Platform:** ${aiToolNames[taskConfig.packAiTool || 'chatgpt']}

### 📋 TEKS PROMPT (Copy-Paste Langsung):
\`\`\`
[Isi prompt lengkap yang SIAP di-copy-paste — ditulis dalam ${taskConfig.packLanguage === 'english' ? 'English' : 'Bahasa Indonesia'}]
[Terapkan teknik: ${appliedTechs.length > 0 ? selectedTechs.join(', ') : 'best practices'}]
[Prompt harus spesifik untuk topik: ${projectData.topik}]
\`\`\`

**💡 Tips Penggunaan:** [1-2 kalimat cara optimal menggunakan prompt ini]
**🔗 Koneksi ke Prompt Berikutnya:** [Bagaimana output prompt ini digunakan di prompt selanjutnya]

---

=== CATATAN KUALITAS ===
- Setiap prompt HARUS standalone (bisa dijalankan sendiri) SEKALIGUS connected (terintegrasi dengan workflow)
- Prompt harus menghasilkan output yang ACTIONABLE dan spesifik — bukan generik
- Hindari prompt yang terlalu umum — selalu sisipkan konteks topik: **${projectData.topik}**
- Sertakan variabel yang bisa diganti user dengan tanda [KURUNG SIKU] untuk personalisasi
- Di akhir pack, tambahkan seksi **"⚡ TIPS PRO MENGGUNAKAN PACK INI"** berisi 3-5 tips memaksimalkan workflow ini

Mulai dari Prompt 1 dan lanjutkan sampai Prompt ${numPrompts} secara berurutan.
`;
      break;
    }

    case 'GPT_BUILDER':
      taskInstruction = `
MODE TUGAS: MEMBUAT SYSTEM PROMPT UNTUK CHATBOT (GPTs)
${styleReminder}

Saya ingin membuat "Custom GPT" (Chatbot AI) yang bertindak sebagai MENTOR/PAKAR berdasarkan ebook ini.
Tolong buatkan **Instruksi Konfigurasi (System Prompt)** lengkap yang siap saya copy-paste ke halaman "Configure" di ChatGPT/Platform AI.

=== PROFIL CHATBOT ===
- **Nama Bot:** ${taskConfig.botName || 'Mentor ' + (projectData.judul || projectData.topik)}
- **Peran (Role):** ${taskConfig.botRole}
- **Kepribadian:** ${taskConfig.botPersonality}
- **Bahasa:** ${taskConfig.botLanguage || 'Bahasa Indonesia'}
- **Sumber Pengetahuan:** Konten dari ebook "${projectData.judul}" (Saya akan upload file ebooknya ke Knowledge Base GPTs).
${taskConfig.botAudience ? `- **Target Pengguna Bot:** ${taskConfig.botAudience}` : ''}
${taskConfig.botAvoidTopics ? `- **Topik yang Harus Dihindari:** ${taskConfig.botAvoidTopics}` : ''}

=== PERSONA DETAIL ===
${taskConfig.botPersonaDetail
  ? taskConfig.botPersonaDetail
  : `Bot ini berperan sebagai ${taskConfig.botRole} yang ${taskConfig.botPersonality}. Bot fokus membantu pembaca memahami dan menerapkan isi ebook "${projectData.judul}" dalam konteks topik ${projectData.topik}.`
}
${taskConfig.botSystemPrompt ? `\n=== INSTRUKSI KUSTOM DARI PENULIS ===\n${taskConfig.botSystemPrompt}\n\n(Pastikan instruksi kustom di atas tercermin langsung dalam bagian System Prompt yang kamu buat.)\n` : ''}
=== TUGAS ANDA ===
Buatkan Teks Konfigurasi Lengkap dengan struktur berikut:

1. **Name:** Usulan nama bot yang menarik dan relevan dengan topik.
2. **Description:** Deskripsi singkat 1 kalimat untuk ditampilkan di store.
3. **Instructions (System Prompt Inti):**
   - Definisikan Persona secara detail (Kamu adalah...) — sertakan kepribadian, gaya komunikasi, dan nada bicara.
   - Definisikan Misi (Membantu pengguna memahami dan mengimplementasikan topik ${projectData.topik}).
   - **Bahasa:** Bot berbicara dalam ${taskConfig.botLanguage || 'Bahasa Indonesia'}.
   ${taskConfig.botAudience ? `- **Segmen Pengguna:** ${taskConfig.botAudience}.` : ''}
   - **Knowledge Base Rules (PENTING):** Instruksikan bot untuk SELALU mencari jawaban di file yang diupload ("Knowledge") TERLEBIH DAHULU sebelum menggunakan pengetahuan umum. Jika jawaban ada di buku, kutip halamannya.
   - **Tone & Style:** ${effectiveTone} dan ${effectiveStyle}.
   - **Guardrails:** Apa yang TIDAK boleh dilakukan${taskConfig.botAvoidTopics ? ` — khususnya hindari: ${taskConfig.botAvoidTopics}` : ' (misal: memberi saran medis/hukum sembarangan jika topik sensitif)'}.
   ${taskConfig.botSystemPrompt ? '- **Instruksi Tambahan:** Terapkan semua instruksi kustom dari penulis yang sudah disebutkan di atas.' : ''}
4. **Conversation Starters:** 4 Contoh pertanyaan pemancing yang relevan dengan isi ebook dan cocok untuk target pengguna${taskConfig.botAudience ? ` (${taskConfig.botAudience})` : ''}.
`;
      break;

    case 'BIG_IDEA':
      taskInstruction = `
MODE TUGAS: BIG IDEA (PEMANTAPAN KONSEP & POSITIONING)
${styleReminder}

Saya sudah memiliki topik/ide awal. Tolong pertajam menjadi **Positioning yang kuat dan diferensiasi yang jelas**.

=== DATA INPUT ===
- Topik Utama: **${projectData.topik}**
- Judul Sementara: ${projectData.judul || '[Belum ditentukan]'}
- Target Pembaca: ${projectData.target || '[Belum ditentukan]'}
- Pain Point Awal: ${projectData.painPoint || '[Belum ditentukan]'}
- Angle Positioning: **${taskConfig.bigIdeaAngle || 'Unik & Berbeda'}**
${taskConfig.judulScript ? `- Kompetitor/Buku Sejenis: ${taskConfig.judulScript}` : ''}
${taskConfig.tujuanBab ? `- Keunikan/USP yang ingin ditonjolkan: ${taskConfig.tujuanBab}` : ''}

=== TUGAS ANDA ===
Buatkan **Framework Positioning** dengan angle "${taskConfig.bigIdeaAngle || 'Unik & Berbeda'}" yang mencakup:

1. **Definisi Niche yang Tajam:** Siapa EXACTLY target pembaca? (Demografis + Psikografis)
2. **Problem Statement:** Rumuskan masalah utama dalam 1-2 kalimat yang MENGGIGIT.
3. **Big Idea / Unique Mechanism:** Apa konsep/metode UNIK yang menjadi pembeda ebook ini? (Beri nama yang catchy jika bisa)
4. **Transformation Promise:** Before & After - apa yang akan berubah setelah membaca ebook ini?
5. **Proof/Authority:** Mengapa pembaca harus percaya? (Data, pengalaman, testimoni framework)
6. **One-Liner Pitch:** Rumuskan positioning dalam 1 kalimat powerful.
7. **Rekomendasi Judul (3 Opsi):** Berikan 3 alternatif judul yang sesuai positioning.
`;
      break;

    case 'OUTLINE':
      taskInstruction = `
MODE TUGAS: OUTLINE (DAFTAR ISI LENGKAP)
${styleReminder}

Saya ingin menyusun **Daftar Isi / Outline** lengkap untuk project ebook saya.

=== SPESIFIKASI PROJECT ===
- Level Ebook: **${projectData.level}**
- Judul Ebook: ${projectData.judul || '[Belum ditentukan]'}
- Topik: ${projectData.topik}
- Target Pembaca: ${projectData.target}
- Jumlah Bab: **${taskConfig.jumlahBab || '7'}**
- Kedalaman Outline: **${taskConfig.outlineDepth || 'Standard'}**
- Alur Struktur: **${taskConfig.fokusLevel || 'Linear'}**

=== TUGAS ANDA ===
${projectData.level === '1 Ebook' ? `
Buatkan Outline untuk 1 ebook lengkap dengan **${taskConfig.jumlahBab || '7'} bab** dan kedalaman **${taskConfig.outlineDepth || 'Standard'}**:
- **Prakata / Pendahuluan**
- **Bab 1 sampai Bab ${taskConfig.jumlahBab || '7'}** (alur: ${taskConfig.fokusLevel || 'Linear'})
- **Penutup & Kesimpulan**
- **Bonus / Lampiran (Opsional)**

Untuk SETIAP bab, berikan:
1. Judul Bab
2. Deskripsi Singkat (1-2 kalimat tentang apa yang dibahas)
${taskConfig.outlineDepth === 'Simple' ? '' : `3. Sub-bab (3-5 poin utama yang akan dicover)`}
${taskConfig.outlineDepth === 'Detailed' || taskConfig.outlineDepth === 'Full' ? `4. Poin Kunci / Insight penting di setiap sub-bab` : ''}
${taskConfig.outlineDepth === 'Full' ? `5. Latihan/Exercise untuk pembaca di akhir bab` : ''}
` : projectData.level === 'Trilogi 1 (3 Ebook)' ? `
Buatkan Outline untuk TRILOGI 1 (3 Ebook) dengan pembagian:
- **Buku 1: Fundamental** (Mindset & Konsep Dasar)
- **Buku 2: Strategi** (Implementasi & Teknis)
- **Buku 3: Advanced** (Pengembangan & Scaling)

Untuk SETIAP buku, rincikan:
1. Judul Buku
2. Fokus/Tema Utama
3. Daftar Bab (5-7 bab per buku)
4. Untuk setiap bab: Judul + 3 Sub-bab utama
` : projectData.level === 'Trilogi 2 (6 Ebook)' ? `
Buatkan Outline untuk TRILOGI 2 (6 Ebook) dengan pembagian:
**TRILOGI 1 - LEVEL BASIC (Buku 1-3):**
- Buku 1: Mindset & Dasar
- Buku 2: Validasi Market
- Buku 3: Persiapan Produk

**TRILOGI 2 - LEVEL INTERMEDIATE (Buku 4-6):**
- Buku 4: Strategi Marketing
- Buku 5: Funnel & Sales
- Buku 6: Operasional

Untuk SETIAP buku, rincikan:
1. Judul Buku yang Spesifik
2. Tujuan Pembelajaran (Learning Objective)
3. Daftar Bab (5-7 bab)
4. Overview singkat tiap bab
` : `
Buatkan Outline untuk TRILOGI 3 - SERI LENGKAP (9 Ebook) dengan pembagian:
**TRILOGI 1 - LEVEL BASIC (Buku 1-3):**
- Buku 1: Mindset & Dasar
- Buku 2: Validasi Market
- Buku 3: Persiapan Produk

**TRILOGI 2 - LEVEL INTERMEDIATE (Buku 4-6):**
- Buku 4: Strategi Marketing
- Buku 5: Funnel & Sales
- Buku 6: Operasional

**TRILOGI 3 - LEVEL ADVANCED (Buku 7-9):**
- Buku 7: Tim & Delegasi
- Buku 8: Automasi Sistem
- Buku 9: Ekspansi & Exit

Untuk SETIAP buku, rincikan:
1. Judul Buku yang Spesifik
2. Tujuan Pembelajaran (Learning Objective)
3. Daftar Bab (5-7 bab)
4. Overview singkat tiap bab
`}
`;
      break;

    case 'DRAFT_BAB': {
      const includeKisah = taskConfig.draftIncludeKisah === 'yes';
      const includeLampiran = taskConfig.draftIncludeLampiran === 'yes';
      const includeBonus = taskConfig.draftIncludeBonus === 'yes';

      const kisahSection = includeKisah ? `
a) **✨ Kisah Inspiratif (Before → Proses → After)** — LETAKKAN DI BAGIAN PALING ATAS BAB, sebelum Pendahuluan.
   Tulis kisah nyata atau fiktif-realistis tentang seseorang dari industri ${projectData.industry || 'relevan'} yang mengalami transformasi melalui penerapan materi bab ini.
   Format wajib: Kondisi SEBELUM (masalah & struggle) → PROSES penerapan (langkah nyata, tantangan) → Kondisi SESUDAH (hasil konkret).
   ${taskConfig.draftKisahContext ? `Konteks spesifik: ${taskConfig.draftKisahContext}` : ''}
   Panjang: 300-500 kata. Gunakan nama tokoh dan detail industri yang spesifik.
` : '';

      const lampiranSection = includeLampiran ? `
f) **📎 Lampiran** — LETAKKAN SETELAH PENUTUP/KESIMPULAN.
   Sediakan materi pendukung praktis yang relevan dengan topik bab ini, seperti: template siap pakai, tabel referensi, checklist lengkap, atau form kerja.
   ${taskConfig.draftLampiranContext ? `Jenis lampiran yang diminta: ${taskConfig.draftLampiranContext}` : 'Pilih jenis lampiran yang paling relevan dan berguna untuk pembaca.'}
   Format lampiran harus langsung bisa digunakan (bukan sekadar deskripsi).
` : '';

      const bonusSection = includeBonus ? `
g) **🎁 Bonus** — LETAKKAN SETELAH LAMPIRAN (atau setelah Penutup jika tidak ada Lampiran).
   Berikan materi eksklusif bernilai tinggi yang memperkuat bab ini, seperti: prompt AI siap pakai, mini workbook, resource list, script/template eksklusif, atau tips rahasia dari praktisi.
   ${taskConfig.draftBonusContext ? `Jenis bonus yang diminta: ${taskConfig.draftBonusContext}` : 'Pilih bonus yang paling actionable dan relevan.'}
   Beri label "🎁 BONUS EKSKLUSIF" dan tekankan nilai tambahannya.
` : '';

      taskInstruction = `
MODE TUGAS: MENULIS DRAFT BAB (KONTEN INTI)
${styleReminder}

=== KONTEKS PENULISAN ===
1. Seri Ebook: **${projectData.level}**
2. Buku yang Sedang Ditulis: **${currentEbookTitle}** (Fokus pada cakupan buku ini)
3. Bab yang Ditulis: **${finalJudulBab || '[Judul Bab Belum Diisi]'}**
4. Tujuan Bab: ${taskConfig.tujuanBab || 'Menjelaskan konsep secara mendalam'}

=== INSTRUKSI KHUSUS ===
Tulis isi bab secara lengkap dalam Bahasa **${projectData.language}**.
Pastikan isi bab ini relevan dengan level buku ("${currentEbookTitle}").
Jangan mencampuradukkan materi dari buku level lain.

Struktur Konten Bab (tulis SEMUA seksi yang disebutkan di bawah):
${kisahSection}b) **Pendahuluan (Hook & Relevansi)** - Mengapa bab ini penting? Apa yang akan dipelajari?
c) **Pembahasan Utama (Sub-bab detail)** - Penjelasan mendalam dengan contoh.
d) **Contoh / Studi Kasus** - Ilustrasi nyata yang relevan dengan topik bab.
e) **Actionable Steps / Checklist** - Langkah praktis yang bisa langsung diterapkan pembaca.
e) **Kesimpulan & Transisi** - Rangkuman poin penting + preview bab berikutnya.
${lampiranSection}${bonusSection}
=== GAYA PENULISAN ===
- Panjang: 2000-3000 kata minimum${includeKisah || includeLampiran || includeBonus ? ' (ditambah seksi tambahan yang diminta)' : ''}
- Gunakan sub-heading (H2, H3) untuk struktur yang jelas
- Sertakan bullet points dan numbered list untuk kemudahan baca
- Tambahkan "Pro Tips" atau "Warning" box jika relevan
`;
      break;
    }

    case 'VIDEO_SCRIPT': {
      const videoTypeMap: Record<string, string> = {
        talking_head: 'Talking Head — presenter berbicara langsung ke kamera',
        tutorial: 'Tutorial / How-To — panduan step by step dengan demonstrasi',
        screen_recording: 'Screen Recording — narasi di atas rekaman layar',
        vlog: 'Vlog — gaya dokumenter perjalanan atau behind-the-scenes',
        animation: 'Animation / Motion Graphic — narasi untuk video animasi',
        short_reels: 'Short / Reels / TikTok — format vertikal super cepat',
        presentation: 'Presentasi / Slideshow — narasi di atas slide',
        documentary: 'Mini Dokumenter — gaya storytelling sinematik',
        webinar: 'Webinar / Online Class — sesi kelas interaktif panjang',
      };
      const videoPlatformMap: Record<string, string> = {
        youtube: 'YouTube (video panjang horizontal)',
        youtube_short: 'YouTube Shorts (vertikal, <60 detik)',
        instagram: 'Instagram Reels (vertikal, 15-90 detik)',
        tiktok: 'TikTok (vertikal, 15 detik - 3 menit)',
        linkedin: 'LinkedIn Video (profesional, tone bisnis)',
        facebook: 'Facebook Video',
        webinar: 'Webinar Zoom/Google Meet',
        corporate: 'Internal Corporate / Training Video',
        lms: 'LMS / E-Learning Platform',
      };
      const videoStyleMap: Record<string, string> = {
        educational: 'Edukasi — informasi disampaikan secara terstruktur dan mudah dipahami',
        entertainment: 'Entertainment-first — menghibur sambil menginformasi, ringan dan engaging',
        inspirational: 'Inspirational — memotivasi, membangkitkan semangat, dan menggerakkan penonton',
        storytelling: 'Storytelling — kisah nyata sebagai kendaraan pesan utama',
        how_to: 'How-To / Tutorial — panduan praktis yang langsung bisa diikuti',
        listicle: 'Listicle — format "N poin/tips/cara" yang clear dan mudah dicerna',
        review: 'Review & Analisis — evaluasi mendalam dengan pro/cons',
        debate: 'Debat / Dua Sisi — eksplorasi dua sudut pandang yang berbeda',
        challenge: 'Challenge / Eksperimen — uji sesuatu dan tunjukkan hasilnya',
      };
      const videoToneMap: Record<string, string> = {
        casual: 'Kasual & Friendly — hangat, relatable, seperti ngobrol dengan teman',
        professional: 'Profesional — kredibel, berbobot, menginspirasi kepercayaan',
        energetic: 'Energik & Antusias — high energy, cepat, penuh semangat',
        calm: 'Tenang & Reflektif — perlahan, kontemplatif, thoughtful',
        inspirational: 'Inspirasional — membakar semangat dan mendorong action',
        humorous: 'Humoris — ringan, banyak jokes, membuat penonton tertawa',
        authoritative: 'Authoritative — tegas seperti pakar di bidangnya',
      };
      const videoHookMap: Record<string, string> = {
        question: 'Pertanyaan Provokatif — buka dengan pertanyaan yang langsung menohok dan relevan ke masalah penonton',
        shocking_fact: 'Fakta Mengejutkan — buka dengan statistik atau data yang tidak terduga dan bikin penonton berpikir ulang',
        bold_statement: 'Bold Statement — pernyataan berani, bahkan kontroversial, yang memancing penasaran',
        story: 'Mini Cerita — buka dengan kisah nyata 2-3 kalimat yang langsung memancing empati',
        humor: 'Hook Humor — buka dengan situasi lucu atau jokes yang relevan dengan topik',
        challenge: 'Challenge / Tantangan — ajak penonton ikut melakukan sesuatu dari detik pertama',
        contrast: 'Kontras / Before-After — tunjukkan perbedaan ekstrem antara kondisi sebelum dan sesudah',
        promise: 'Janji Nilai — langsung sebut manfaat konkret yang akan didapat penonton jika menonton sampai akhir',
      };
      const videoCTAMap: Record<string, string> = {
        subscribe: 'Subscribe & Like channel untuk konten serupa',
        download: 'Download ebook/freebie gratis (link di deskripsi/bio)',
        buy: 'Beli produk/ebook sekarang sebelum harga naik',
        share: 'Share video ini ke teman yang butuh informasi ini',
        comment: 'Comment di bawah: [pertanyaan diskusi yang relevan]',
        visit: 'Kunjungi website/link bio untuk informasi lengkap',
        whatsapp: 'Chat WhatsApp atau DM untuk konsultasi langsung',
        join_course: 'Daftar kursus/webinar gratis (link di bawah)',
        join_community: 'Gabung komunitas/grup WhatsApp/Telegram gratis',
      };
      const videoLangMap: Record<string, string> = {
        formal: 'Bahasa Indonesia baku formal',
        semiformal: 'Semi-formal: baku tapi natural',
        casual: 'Kasual: santai, sehari-hari',
        gaul: 'Gaul/Kekinian: milenial & gen-Z friendly',
        bilingual: 'Bilingual: campuran Indo-Inggris',
      };

      const presenter = taskConfig.videoPresenterName || 'Creator';
      const platform = taskConfig.videoPlatform || 'youtube';
      const isShortFormat = ['youtube_short', 'instagram', 'tiktok'].includes(platform) || taskConfig.durasiScript === '15-60 detik' || taskConfig.durasiScript === '1-3 menit';
      const isLongFormat = ['30-45 menit', '60+ menit'].includes(taskConfig.durasiScript || '');
      const wordEstimate = taskConfig.durasiScript === '15-60 detik' ? '100-200' : taskConfig.durasiScript === '1-3 menit' ? '200-500' : taskConfig.durasiScript === '5-10 menit' ? '800-1.500' : taskConfig.durasiScript === '15-20 menit' ? '2.000-3.000' : taskConfig.durasiScript === '30-45 menit' ? '4.000-6.000' : '8.000+';

      const selectedElements = (taskConfig.videoSpecialElements || '').split('|||').filter(Boolean);
      const elementInstructions: Record<string, string> = {
        b_roll: `• **B-Roll & Visual Notes**: Sertakan petunjuk visual dalam kurung siku setelah setiap poin narasi: [B-ROLL: deskripsi footage/gambar/grafis yang ditampilkan]`,
        lower_third: `• **Lower Third / Grafis Teks**: Tandai dengan [LOWER THIRD: teks yang muncul] untuk nama presenter, statistik, atau poin kunci yang muncul di layar`,
        bumper: `• **Bumper Intro & Outro**: Tuliskan segmen branded pendek (3-5 detik) di awal video sebelum hook, dan segmen penutup branded setelah CTA. Format: [BUMPER INTRO: ...] dan [BUMPER OUTRO: ...]`,
        captions: `• **Caption / Subtitle Poin**: Tandai dengan *kata atau frasa* yang harus di-highlight sebagai caption besar di layar saat diucapkan`,
        chapter_mark: `• **YouTube Chapter Markers**: Di awal setiap segmen utama, sertakan [CHAPTER: 0:00 – Nama Seksi] untuk memudahkan navigasi video`,
        thumbnail: `• **Saran Thumbnail**: Di akhir script, tambahkan seksi "REKOMENDASI THUMBNAIL" berisi: teks hook (max 6 kata), deskripsi visual, dan warna/mood yang disarankan`,
        transitions: `• **Instruksi Transisi**: Antara setiap segmen, sertakan [TRANSISI: jenis cut/efek — misal: jump cut, fade, wipe, zoom in] untuk memandu editor`,
        sponsor: `• **Slot Sponsor/Endorsement**: Sertakan satu segmen sponsor yang natural dan terintegrasi dalam konten (bukan terasa sebagai iklan terpisah), ditandai dengan [SPONSOR SLOT: ...]`,
      };

      const presenterPersonaNote = taskConfig.videoPresenterPersona
        ? `\nKarakter Presenter: ${taskConfig.videoPresenterPersona}`
        : '';

      taskInstruction = `
MODE TUGAS: VIDEO SCRIPT GENERATOR
${styleReminder}

Buatkan script video LENGKAP, SIAP REKAM, dan OPTIMAL untuk platform ${videoPlatformMap[platform] || platform}.

=== SPESIFIKASI VIDEO ===
- Judul: **${taskConfig.judulScript || `${projectData.topik} — Panduan Lengkap`}**
- Topik Ebook: ${projectData.topik}
- Sumber Materi: ${taskConfig.judulBab || 'Seluruh materi ebook'}
- Platform: **${videoPlatformMap[platform]}**
- Tipe Video: **${videoTypeMap[taskConfig.videoType || 'talking_head']}**
- Gaya Konten: **${videoStyleMap[taskConfig.videoStyle || 'educational']}**
- Tone / Nuansa: **${videoToneMap[taskConfig.videoTone || 'casual']}**
- Gaya Bahasa: **${videoLangMap[taskConfig.videoLanguageStyle || 'casual']}**
- Durasi Target: **${taskConfig.durasiScript || '5-10 menit'}** (~${wordEstimate} kata)
- Presenter: **${presenter}**${presenterPersonaNote}
- Target Penonton: ${projectData.target || 'Umum'}

=== HOOK / PEMBUKA ===
Buka dengan teknik: **${videoHookMap[taskConfig.videoHookStyle || 'question']}**
${isShortFormat ? 'PENTING: Format short/reels — hook HARUS terjadi dalam 3 detik pertama. Tidak ada basa-basi sama sekali.' : ''}
${platform === 'tiktok' || platform === 'instagram' ? 'Format vertikal: script harus diperlakukan seperti video vertikal — energi tinggi, pacing cepat, setiap 3-5 detik ada perubahan visual/angle.' : ''}
${platform === 'linkedin' ? 'Format LinkedIn: lebih profesional, data-driven, langsung to the point. Hindari terlalu casual.' : ''}

=== ELEMEN PRODUKSI YANG HARUS DISERTAKAN ===
${selectedElements.length > 0 ? selectedElements.map(id => elementInstructions[id] || '').filter(Boolean).join('\n') : '• Gunakan [VISUAL: ...] untuk instruksi visual pendukung yang relevan\n• Gunakan (Beat) atau (Jeda) untuk penanda ritme berbicara'}

=== FORMAT SCRIPT ===
Gunakan format yang LANGSUNG SIAP DIBACA saat rekaman:

${isShortFormat ? `**[FORMAT SHORT/REELS — ${taskConfig.durasiScript}]**

**[HOOK — detik 0-3]**
[${videoHookMap[taskConfig.videoHookStyle || 'question']}]

**[KONTEN UTAMA — ${taskConfig.durasiScript === '15-60 detik' ? '10-40 detik' : '45-120 detik'}]**
[2-3 poin utama, setiap poin 1-2 kalimat max]

**[CTA — 3-5 detik terakhir]**
"${videoCTAMap[taskConfig.videoCTA || 'subscribe']}"

CATATAN: Setiap kalimat max 10-12 kata. Tidak ada kalimat bertele-tele.` : `
**[BUMPER / PRE-HOOK]** ${selectedElements.includes('bumper') ? '← [BUMPER INTRO: branded ident 3-5 detik]' : '(opsional — skip langsung ke hook)'}

**[HOOK — 5-15 detik]**
${videoHookMap[taskConfig.videoHookStyle || 'question']}
${taskConfig.judulScript ? `Pertanyaan/pernyataan hook yang langsung relevan dengan judul: "${taskConfig.judulScript}"` : ''}

**[INTRO PRESENTER — 10-20 detik]** ${isLongFormat ? '' : '(singkat, jangan lebih dari 15 detik)'}
${presenter !== 'Creator' ? `"Halo, saya ${presenter}..." — perkenalan singkat dan kredensial relevan` : '— perkenalan singkat dan preview apa yang akan dipelajari'}

**[PREVIEW / VALUE PROPOSITION — 10-15 detik]**
"Di video ini, kamu akan [manfaat konkret 1], [manfaat 2], dan [manfaat 3]..."
${selectedElements.includes('chapter_mark') ? '[CHAPTER: 0:00 – Intro]' : ''}

**[KONTEN UTAMA — ${isLongFormat ? '80-85%' : '65-70%'} durasi]**
${isLongFormat ? 'Bagi ke dalam bab/modul yang jelas dengan transisi antar-bagian' : 'Bagi menjadi 3-5 poin utama, masing-masing dengan:'}
${isLongFormat ? '' : `- Poin [N]: [Judul poin yang catchy]
  - Penjelasan (2-3 kalimat)
  - Contoh nyata atau data dari ebook
  - Takeaway praktis`}
${selectedElements.includes('chapter_mark') ? '← Tambahkan [CHAPTER: timestamp – Nama Bagian] di setiap seksi utama' : ''}

${selectedElements.includes('sponsor') ? `**[SPONSOR SLOT — natural dan terintegrasi]**
[SPONSOR SLOT: transisi natural ke endorsement, kira-kira di tengah video]` : ''}

**[RECAP — 20-30 detik]**
"Jadi, hari ini kita sudah belajar: [3 poin terpenting]..."

**[CTA — 15-30 detik]**
"${videoCTAMap[taskConfig.videoCTA || 'subscribe']}"
${taskConfig.videoCTA === 'subscribe' ? '— Minta subscribe, like, dan aktifkan notifikasi\n— Sebut video/playlist terkait' : ''}
${taskConfig.videoCTA === 'download' ? '— Sebutkan cara mendapatkannya (link di deskripsi/bio)\n— Beri tahu apa yang akan mereka dapatkan' : ''}

**[OUTRO]** ${selectedElements.includes('bumper') ? '[BUMPER OUTRO: branded ident + music fade]' : '— Penutup singkat, ucapkan terima kasih'}
`}

=== INSTRUKSI KUALITAS SCRIPT ===
- Script ditulis untuk DIUCAPKAN — hindari kalimat yang terasa seperti teks tertulis
- Kalimat pendek mendominasi (max 15-20 kata per kalimat)${isShortFormat ? ', maksimal 10 kata' : ''}
- Variasikan tempo: kalimat pendek untuk penekanan, panjang untuk elaborasi
- Gunakan sapaan langsung ke penonton: "kamu", "kalian", atau sesuai gaya bahasa
- ${taskConfig.videoTone === 'energetic' ? 'Energi TINGGI dari awal — tidak ada momen lambat, setiap kalimat harus dinamis' : ''}
- ${taskConfig.videoTone === 'humorous' ? 'Sisipkan humor natural (tidak dipaksakan) yang relevan dengan topik' : ''}
- ${taskConfig.videoStyle === 'listicle' ? `Format listicle: gunakan penanda "Nomor [N]:" yang jelas dan energik setiap kali pindah poin` : ''}
- Tulis LENGKAP dan SIAP REKAM — bukan outline atau template kosong
${selectedElements.includes('thumbnail') ? '\n=== REKOMENDASI THUMBNAIL ===\n[Tambahkan di akhir script: teks hook max 6 kata, deskripsi visual, dan mood/warna]' : ''}
`;
      break;
    }

    case 'EXTEND_TEXT':
      taskInstruction = `
MODE TUGAS: EXTEND TEXT (PENGEMBANGAN TEKS)
${styleReminder}

Saya memiliki teks/paragraf pendek dan ingin mengembangkannya menjadi lebih panjang, detail, dan berkualitas.

=== TEKS AWAL ===
"""
${extendConfig.teksAwal || '[Teks belum diisi]'}
"""

=== TARGET OUTPUT ===
- Panjang: **${extendConfig.targetPanjang}**
- Pertahankan: Ide utama dan pesan inti dari teks awal
- Kembangkan: Tambahkan detail, contoh, penjelasan, atau elaborasi

=== INSTRUKSI PENGEMBANGAN ===
1. Pahami ide utama dari teks awal
2. Identifikasi poin-poin yang bisa diperdalam
3. Tambahkan:
   - Konteks yang lebih kaya
   - Contoh atau ilustrasi konkret
   - Penjelasan "mengapa" di balik setiap poin
   - Transisi yang mulus antar paragraf
4. Pastikan alur tetap koheren dan tidak berulang
5. Akhiri dengan kesimpulan atau call-to-action jika sesuai

=== OUTPUT ===
Tulis teks yang sudah dikembangkan dalam format yang rapi dan terstruktur.
Gunakan paragraph breaks yang jelas dan sub-heading jika diperlukan.
`;
      break;

    case 'MINI_APP_BUILDER': {
      const appPlatformMap: Record<string, string> = {
        web: 'Web App (React/Next.js)',
        mobile: 'Mobile App (React Native)',
        pwa: 'PWA (Progressive Web App)',
        chrome: 'Chrome Extension',
        telegram: 'Telegram Bot',
        whatsapp: 'WhatsApp Bot',
        notion: 'Notion Template + API',
        dashboard: 'Admin Dashboard',
        api: 'API / Backend Service',
      };
      const appTechMap: Record<string, string> = {
        auto: 'AI pilihkan tech stack terbaik',
        nocode: 'No-Code — Lovable / Bolt.new',
        lowcode: 'Low-Code — Bubble / Webflow',
        react: 'React + Node.js',
        nextjs: 'Next.js + Supabase',
        python: 'Python — FastAPI / Django',
        flutter: 'Flutter (Cross-platform)',
      };
      const appMonetMap: Record<string, string> = {
        gratis: 'Gratis / Open Source',
        freemium: 'Freemium (fitur dasar gratis, premium berbayar)',
        berbayar: 'Berbayar (one-time purchase)',
        subscription: 'Subscription / SaaS (langganan bulanan)',
        internal: 'Internal Tool (hanya untuk tim perusahaan)',
      };
      const appComplexMap: Record<string, string> = {
        simple: 'Simple (1-2 fitur utama)',
        medium: 'Medium (3-5 fitur)',
        complex: 'Complex (6+ fitur + dashboard lengkap)',
      };
      const appCount = parseInt(taskConfig.appCount || '1', 10);
      const isMultiApp = appCount > 1;

      let multiApps: { name: string; type: string; complexity: string; description: string }[] = [];
      try {
        multiApps = taskConfig.appMultiConfig ? JSON.parse(taskConfig.appMultiConfig) : [];
      } catch { multiApps = []; }

      const globalTech = appTechMap[taskConfig.appTechPreference || 'auto'] || taskConfig.appTechPreference;
      const globalMonet = appMonetMap[taskConfig.appMonetization || 'gratis'] || taskConfig.appMonetization;

      if (isMultiApp) {
        const appsSection = multiApps.slice(0, appCount).map((app, i) => {
          const platform = appPlatformMap[app.type || 'web'] || app.type;
          const complexity = appComplexMap[app.complexity || 'simple'] || app.complexity;
          return `
--- APLIKASI ${i + 1} ---
- Nama: ${app.name || `[AI sarankan nama App ${i + 1}]`}
- Platform: ${platform}
- Kompleksitas: ${complexity}
${app.description ? `- Deskripsi & Fitur:\n${app.description}` : ''}`;
        }).join('\n');

        taskInstruction = `
MODE TUGAS: MINI APP BUILDER — PAKET ${appCount} APLIKASI
${styleReminder}

Berdasarkan ebook bertema "${projectData.topik}", rancang blueprint untuk ${appCount} aplikasi berbeda yang saling melengkapi sebagai ekosistem digital.

=== KONTEKS EBOOK ===
- Judul: ${projectData.judul || projectData.topik}
- Topik Utama: ${projectData.topik}
- Target Pengguna: ${projectData.target || 'pembaca ebook'}

=== PREFERENSI GLOBAL (berlaku untuk semua app) ===
- Teknologi: ${globalTech}
- Monetisasi: ${globalMonet}
${taskConfig.appDeployTarget ? `- Target Deploy: ${taskConfig.appDeployTarget}` : ''}

=== DAFTAR APLIKASI YANG AKAN DIBUAT ===
${appsSection}

=== INSTRUKSI BLUEPRINT ===
Buat blueprint TERPISAH dan LENGKAP untuk SETIAP aplikasi di atas.

Format output untuk setiap app:

## ═══ BLUEPRINT APLIKASI [N]: [NAMA APP] ═══

1. **Konsep & Tagline** — deskripsi singkat + tagline
2. **Problem Solved** — masalah yang diselesaikan (konteks spesifik ebook "${projectData.topik}")
3. **Fitur-Fitur Utama** — detail setiap fitur
4. **Halaman / Screen Utama** — wireframe deskriptif
5. **User Flow** — step-by-step penggunaan
6. **Tech Stack** — menggunakan ${globalTech}
7. **Prompt AI Build** — prompt siap pakai untuk Cursor / Lovable / Bolt.new
8. **Monetisasi** — strategi ${globalMonet}
9. **Launch Checklist** — 5 langkah kritis sebelum rilis

Setelah semua blueprint, tambahkan:

## ═══ ROADMAP INTEGRASI EKOSISTEM ═══
- Bagaimana ${appCount} aplikasi ini saling terhubung dan mendukung satu sama lain
- Urutan prioritas build yang disarankan

Buat sedetail dan sekonkret mungkin untuk semua ${appCount} aplikasi.
`;
      } else {
        taskInstruction = `
MODE TUGAS: MINI APP BUILDER — BLUEPRINT APLIKASI INTERAKTIF
${styleReminder}

Berdasarkan ebook bertema "${projectData.topik}", rancang blueprint aplikasi yang spesifik, terstruktur, dan siap dieksekusi.

=== IDENTITAS APLIKASI ===
- **Nama Aplikasi:** ${taskConfig.appName || '[AI sarankan nama yang relevan]'}
- **Platform / Format:** ${appPlatformMap[taskConfig.appType || 'web'] || taskConfig.appType}
- **Kompleksitas:** ${appComplexMap[taskConfig.appComplexity || 'simple'] || taskConfig.appComplexity}
- **Preferensi Teknologi:** ${globalTech}
- **Model Monetisasi:** ${globalMonet}
${taskConfig.appDeployTarget ? `- **Target Deploy/Hosting:** ${taskConfig.appDeployTarget}` : ''}

=== KONTEKS EBOOK ===
- Judul: ${projectData.judul || projectData.topik}
- Topik Utama: ${projectData.topik}
- Target Pengguna Ebook: ${projectData.target || 'pembaca ebook'}
- Tujuan: ${projectData.tujuan || 'membantu pengguna mempraktikkan konten ebook'}

${taskConfig.appDescription ? `=== URAIAN APLIKASI ===\n${taskConfig.appDescription}\n` : ''}
${taskConfig.appProblem ? `=== PROBLEM YANG INGIN DISELESAIKAN ===\n${taskConfig.appProblem}\n` : ''}
${taskConfig.appKeyFeatures ? `=== FITUR YANG DIINGINKAN ===\n${taskConfig.appKeyFeatures}\n` : ''}
=== INSTRUKSI BLUEPRINT ===
Buat blueprint aplikasi yang LENGKAP, SPESIFIK, dan LANGSUNG BISA DIEKSEKUSI:

1. **Nama & Konsep App** — nama final + tagline + deskripsi 1 paragraf yang menarik
2. **Problem Solved** — masalah nyata yang diselesaikan (spesifik untuk target: ${projectData.target || 'pengguna ebook'})
3. **Fitur-Fitur Utama** — ${taskConfig.appComplexity === 'complex' ? '7-10' : taskConfig.appComplexity === 'medium' ? '4-6' : '2-3'} fitur dengan deskripsi detail cara kerja tiap fitur
4. **Halaman / Screen Utama** — wireframe deskriptif (apa yang tampil, tombol apa, data apa di tiap halaman)
5. **User Flow** — langkah step-by-step dari pertama buka app sampai goal tercapai
6. **Tech Stack Detail** — framework frontend, backend, database, API pihak ketiga, hosting${taskConfig.appTechPreference === 'nocode' ? ' — FOKUS: No-Code tools (Lovable, Bolt.new, Make.com, Airtable)' : ''}
7. **Prompt AI Siap Pakai** — prompt lengkap untuk ${taskConfig.appTechPreference === 'nocode' ? 'Lovable / Bolt.new' : 'Cursor / Lovable / Bolt.new / Replit'}
8. **Strategi Monetisasi** — detail rencana ${globalMonet}${taskConfig.appDeployTarget ? `\n9. **Panduan Deploy ke ${taskConfig.appDeployTarget}**` : '\n9. **Opsi Deploy & Hosting** — rekomendasi + estimasi biaya'}
10. **Launch Checklist** — 10 langkah konkret sebelum app siap diluncurkan

Buat sedetail dan sekonkret mungkin. Gunakan format yang rapi dan mudah dibaca.
`;
      }
      break;
    }

    case 'QUIZ_MAKER': {
      const quizScopeMap: Record<string, string> = {
        pre_test: 'Pre-Test (Asesmen Awal sebelum Materi Dimulai)',
        per_bab: 'Quiz Per Bab',
        per_sesi: 'Quiz Per Sesi / Modul',
        akhir_modul: 'Quiz Akhir Modul',
        post_test: 'Post-Test (Asesmen Akhir setelah Semua Materi)',
        komprehensif: 'Ujian Komprehensif (Seluruh Materi)',
        remedial: 'Remedial / Pengulangan untuk Peserta yang Belum Lulus',
        sertifikasi: 'Ujian Sertifikasi Formal',
      };
      const quizFormatMap: Record<string, string> = {
        plain: 'Plain Text (siap copy-paste)',
        google_form: 'Template Google Form (dengan instruksi cara mengisi)',
        cetak: 'Format Lembar Ujian (siap cetak/print)',
        lms: 'Format LMS/Moodle (GIFT format untuk import)',
        markdown: 'Markdown (untuk Notion/Obsidian)',
      };

      let quizTypesParsed: { type: string; label: string; count: number; enabled: boolean }[] = [];
      try {
        quizTypesParsed = taskConfig.quizTypeConfig ? JSON.parse(taskConfig.quizTypeConfig) : [];
      } catch { quizTypesParsed = []; }

      const enabledTypes = quizTypesParsed.filter(q => q.enabled);
      const hasCustomTypes = enabledTypes.length > 0;
      const totalSoal = enabledTypes.reduce((sum, q) => sum + q.count, 0);

      const typeFormatMap: Record<string, { label: string; format: string }> = {
        pg: {
          label: 'PILIHAN GANDA (MCQ)',
          format: `[Nomor]. [Pertanyaan]\nA) [Pilihan A]\nB) [Pilihan B]\nC) [Pilihan C]\nD) [Pilihan D]\n${taskConfig.quizIncludeKey !== 'tidak' ? '✅ Jawaban: [Huruf]' + (taskConfig.quizIncludeKey === 'ya' ? ' — [Penjelasan singkat]' : '') : ''}`,
        },
        bs: {
          label: 'BENAR / SALAH',
          format: `[Nomor]. [Pernyataan]\n${taskConfig.quizIncludeKey !== 'tidak' ? 'Jawaban: [BENAR / SALAH]' + (taskConfig.quizIncludeKey === 'ya' ? ' — [Alasan]' : '') : ''}`,
        },
        isian: {
          label: 'ISIAN SINGKAT',
          format: `[Nomor]. [Kalimat dengan bagian kosong: ___________]\n${taskConfig.quizIncludeKey !== 'tidak' ? 'Jawaban: [Jawaban yang benar]' : ''}`,
        },
        es: {
          label: 'ESAI PENDEK',
          format: `[Nomor]. [Pertanyaan terbuka yang mendalam]\n${taskConfig.quizIncludeKey === 'ya' ? '💡 Panduan Jawaban: [3-5 poin kunci yang harus ada dalam jawaban]' : taskConfig.quizIncludeKey === 'kunci_only' ? '💡 Poin Jawaban: [Poin utama]' : ''}`,
        },
        matching: {
          label: 'MENJODOHKAN (MATCHING)',
          format: `Kolom A (Istilah/Konsep):\n[Nomor]. [Item A]\n\nKolom B (Definisi/Pasangan):\n[Huruf]. [Item B]\n${taskConfig.quizIncludeKey !== 'tidak' ? '\nKunci: [Pasangan yang benar]' : ''}`,
        },
        sk: {
          label: 'STUDI KASUS',
          format: `📌 Skenario:\n[Cerita kasus nyata berkaitan dengan topik, 2-3 paragraf]\n\nPertanyaan:\n[Nomor]. [Pertanyaan analitis]\n${taskConfig.quizIncludeKey === 'ya' ? '💡 Panduan Jawaban: [Poin-poin evaluasi]' : ''}`,
        },
        praktik: {
          label: 'UNJUK KERJA / PRAKTIK',
          format: `[Nomor]. [Instruksi tugas praktik yang harus dilakukan]\nRubrik Penilaian:\n- [Kriteria 1: X poin]\n- [Kriteria 2: X poin]\n- [Kriteria 3: X poin]`,
        },
      };

      const sectionsInstruction = hasCustomTypes
        ? enabledTypes.map((q, i) => {
          const info = typeFormatMap[q.type] || { label: q.label, format: '[Soal sesuai jenis]' };
          return `\n**BAGIAN ${String.fromCharCode(65 + i)} — ${info.label} (${q.count} soal)**\nFormat:\n${info.format}`;
        }).join('\n')
        : `\n**BAGIAN A — PILIHAN GANDA (10 soal)**\nFormat:\n${typeFormatMap.pg.format}\n\n**BAGIAN B — ESAI PENDEK (3 soal)**\nFormat:\n${typeFormatMap.es.format}`;

      const summaryLine = hasCustomTypes
        ? `Total: ${totalSoal} soal (${enabledTypes.map(q => `${q.count} ${q.label}`).join(', ')})`
        : 'Total: 13 soal (10 Pilihan Ganda + 3 Esai Pendek)';

      taskInstruction = `
MODE TUGAS: QUIZ MAKER — GENERATOR SOAL & ASESMEN
${styleReminder}

Buat paket soal dan asesmen untuk ebook bertema "${projectData.topik}".

=== SPESIFIKASI QUIZ ===
- Judul Ebook: ${projectData.judul || projectData.topik}
- Target Peserta: ${projectData.target || 'umum'}
- Jenis Quiz: **${quizScopeMap[taskConfig.quizScope || 'komprehensif'] || taskConfig.quizScope}**
${taskConfig.quizBabRef ? `- Bab / Sesi: **${taskConfig.quizBabRef}**` : ''}
- Level Kesulitan: **${taskConfig.fokusLevel || 'Intermediate'}**
- Fokus Penilaian: **${taskConfig.quizFocus || 'komprehensif'}**
- Estimasi Durasi: **${taskConfig.quizDuration || '30 menit'}**
- ${summaryLine}
- Format Output: **${quizFormatMap[taskConfig.quizFormat || 'plain'] || taskConfig.quizFormat}**
- Kunci Jawaban: **${taskConfig.quizIncludeKey === 'ya' ? 'Sertakan + pembahasan' : taskConfig.quizIncludeKey === 'kunci_only' ? 'Kunci saja' : 'Tidak disertakan'}**
${taskConfig.quizContext ? `- Konteks Khusus: ${taskConfig.quizContext}` : ''}

=== INSTRUKSI PEMBUATAN SOAL ===
${taskConfig.quizFormat === 'google_form' ? 'Format output: tulis dalam format Google Form — setiap soal diawali dengan "Q:" dan pilihan diawali dengan huruf. Tambahkan instruksi di awal cara mengisi form.\n' : ''}
${taskConfig.quizFormat === 'lms' ? 'Format output: gunakan format GIFT (Moodle) yang valid. Setiap soal diawali dengan :: dan diakhiri dengan {}.\n' : ''}
${taskConfig.quizFormat === 'cetak' ? 'Format output: layout formal lembar ujian. Tambahkan header: Nama:, Kelas:, Tanggal:, Nilai:. Kelompokkan soal dengan sub-judul jelas.\n' : ''}
${taskConfig.quizFormat === 'markdown' ? 'Format output: gunakan Markdown lengkap dengan heading, bold, dan checkboxes.\n' : ''}
${sectionsInstruction}

=== PANDUAN KUALITAS SOAL ===
- Distribusi kognitif: ingatan/hafalan (${taskConfig.quizFocus === 'hafalan' ? '60%' : '20%'}), pemahaman (${taskConfig.quizFocus === 'teori' ? '50%' : '25%'}), aplikasi praktis (${taskConfig.quizFocus === 'praktik' ? '60%' : '30%'}), analisis/evaluasi (${taskConfig.quizFocus === 'analisis' ? '50%' : '25%'})
- Level kesulitan soal: mudah (${taskConfig.fokusLevel === 'Beginner' ? '60%' : '25%'}), sedang (${taskConfig.fokusLevel === 'Mixed' ? '50%' : '45%'}), sulit (${taskConfig.fokusLevel === 'Expert' ? '50%' : '30%'})
- Setiap soal harus relevan langsung dengan materi ebook${taskConfig.quizBabRef ? ` khususnya "${taskConfig.quizBabRef}"` : ''}
- Pilihan jawaban salah (distractors) harus masuk akal, bukan jebakan
${taskConfig.quizScope === 'pre_test' ? '- Soal pre-test: ukur pengetahuan awal, bukan menguji detail teknis\n- Fungsi: identifikasi gap pengetahuan peserta sebelum belajar' : ''}
${taskConfig.quizScope === 'sertifikasi' ? '- Soal ujian sertifikasi: standar tinggi, berbobot, valid secara profesional\n- Tambahkan: Passing Score (misal: minimal 70% untuk lulus), panduan remedial' : ''}
${taskConfig.quizScope === 'remedial' ? '- Soal remedial: fokus pada materi yang sering salah, penjelasan lebih detail\n- Tambahkan panduan belajar ulang di awal' : ''}

Buat ${totalSoal || 'semua'} soal secara LENGKAP dan SIAP PAKAI. Jangan hanya template — tulis isi soalnya.
`;
      break;
    }

    case 'PODCAST_GENERATOR': {
      const podcastStyle = taskConfig.podcastStyle || 'interview';
      const styleDesc: Record<string, string> = {
        interview: 'tanya-jawab mendalam — Host bertanya kritis, Guest memaparkan insight dari buku',
        debate: 'debat berbobot — dua perspektif berbeda saling dipertahankan dengan argumen kuat',
        masterclass: 'masterclass interaktif — Guest mengajar seperti kelas, Host mewakili peserta',
        fireside: 'percakapan intim & jujur — tanpa struktur kaku, mengalir seperti obrolan mendalam antar sahabat',
        educational: 'edukasi step-by-step — konsep dijelaskan bertahap, pendengar awam bisa ikuti',
        storytelling: 'narasi berbasis pengalaman nyata — setiap insight disampaikan lewat cerita hidup',
        panel: 'diskusi panel — perspektif beragam dari beberapa sudut pandang berbeda',
        casual: 'obrolan santai tapi informatif — natural, mengalir, sesekali diselingi humor',
      };
      const energyDesc: Record<string, string> = {
        calm: 'Tempo lambat dan reflektif. Banyak jeda untuk berpikir. Dialog disampaikan dengan tenang dan penuh pertimbangan.',
        moderate: 'Tempo natural dan mengalir. Seimbang antara eksplorasi mendalam dan kecepatan yang nyaman.',
        energetic: 'Tempo cepat dan dinamis. Banyak back-and-forth, interupsi ringan, antusiasme tinggi.',
        intense: 'Serius dan fokus. Tidak ada basa-basi. Setiap kata bertujuan.',
      };
      const langDesc: Record<string, string> = {
        formal: 'Bahasa Indonesia baku dan formal. Tidak ada kata-kata slang.',
        semiformal: 'Bahasa semi-formal: baku tapi mengalir natural. Boleh ada sedikit ekspresi sehari-hari.',
        casual: 'Bahasa kasual dan santai. Campuran formal dan percakapan sehari-hari.',
        gaul: 'Bahasa gaul/kekinian yang ramah generasi milenial & Z. Boleh ada istilah populer.',
        bilingual: 'Campuran Bahasa Indonesia dan Inggris (Bahasa Jaksel style).',
      };
      const depthDesc: Record<string, string> = {
        surface: 'Hanya sentuh poin utama dan highlight besar. Cocok untuk pengenalan.',
        intermediate: 'Bahas konsep inti plus beberapa contoh konkret dari buku.',
        deep: 'Gali detail, nuansa, dan konteks yang tidak terlihat di permukaan. Referensi spesifik dari bab.',
        exhaustive: 'Kupas tuntas termasuk lampiran, referensi, catatan kaki, dan insight tersembunyi dari seluruh materi buku.',
      };
      const focusDesc: Record<string, string> = {
        semua: 'seluruh aspek buku secara komprehensif',
        teori: 'teori, konsep, dan framework inti dari buku',
        praktik: 'tips, langkah-langkah, dan panduan praktis yang bisa langsung diterapkan',
        studi_kasus: 'studi kasus, contoh nyata, dan kisah sukses/gagal dari buku',
        data_riset: 'data, statistik, riset, dan angka-angka yang ada dalam buku',
        insight: 'insight unik, perspektif orisinal, dan sudut pandang penulis yang tidak umum',
        lampiran: 'lampiran, referensi, catatan tambahan, dan sumber pendukung buku',
      };

      const host = taskConfig.podcastHost || 'Andi';
      const guest = taskConfig.podcastGuest || 'Sari';
      const segments = taskConfig.podcastSegments || '5';
      const segNum = parseInt(segments);
      const wordCount = taskConfig.podcastEpisodeLength === '5-10 menit' ? '800-1.200' : taskConfig.podcastEpisodeLength === '30-45 menit' ? '3.500-6.000' : taskConfig.podcastEpisodeLength === '60+ menit' ? '7.000-10.000' : '1.800-3.000';

      const selectedInteractions = (taskConfig.podcastInteractionStyle || '').split('|||').filter(Boolean);
      const selectedSpecials = (taskConfig.podcastSpecialSegments || '').split('|||').filter(Boolean);

      const interactionMap: Record<string, string> = {
        sokrates: `**Pertanyaan Sokratik**: ${host} secara aktif menggali asumsi yang mendasari pernyataan ${guest}. Contoh: "Kalau begitu, apa definisi spesifiknya menurut buku ini?", "Bagaimana kamu tahu itu benar?", "Apa yang terjadi kalau asumsi itu salah?"`,
        devil: `**Devil's Advocate**: ${host} sengaja mempertanyakan atau menantang argumen ${guest} dari sudut berlawanan. Contoh: "Tapi kalau ada yang bilang sebaliknya, kamu akan jawab apa?", "Bukankah ada risiko yang tidak dibahas di sini?"`,
        roleplay: `**Role-Play Pemula**: ${host} berpura-pura tidak tahu sama sekali dan minta ${guest} menjelaskan dari nol. Contoh: "Coba jelaskan ke aku yang sama sekali baru dengar istilah ini...", "Kalau aku warga biasa, artinya apa?"`,
        analogi: `**Analogi & Metafora**: Setiap kali ada konsep kompleks, salah satu pembicara wajib menawarkan analogi sederhana. Contoh: "Itu seperti kalau kita... [analogi nyata]", "Bayangkan situasinya seperti..."`,
        hot_take: `**Hot Take**: ${host} atau ${guest} sesekali melempar pernyataan kontroversial atau tak terduga untuk kemudian dibedah bersama. Contoh: "Hot take: kebanyakan orang salah kaprah soal ini. Menurut buku, faktanya..."`,
        data_driven: `**Data-Driven Dialog**: Setiap poin penting harus diperkuat dengan data, angka, atau riset yang ada dalam buku. Contoh: "Kalau merujuk ke data di bab X, angkanya...", "Studi yang dikutip penulis menunjukkan bahwa..."`,
        reflektif: `**Momen Reflektif**: Sesekali ${host} atau ${guest} berhenti sejenak dan mengajak pendengar merefleksikan implikasi dari apa yang baru dibahas. Contoh: "Coba pikir ulang — kalau ini benar, artinya selama ini kita...", "Apa yang paling mengubah cara pandangmu setelah baca bagian ini?"`,
        storytelling: `**Sharing Cerita Nyata**: ${guest} diminta berbagi pengalaman pribadi atau kisah nyata yang relevan dengan konsep di buku. Contoh: "Kamu pernah ketemu kasus nyata seperti ini?", "Bagaimana ini terlihat di lapangan sebenarnya?"`,
      };

      const specialSegmentMap: Record<string, string> = {
        lightning: `\n**SEGMEN BONUS — LIGHTNING ROUND ⚡**\n${host} ajukan 5 pertanyaan super cepat, ${guest} jawab dengan 1-2 kalimat saja:\n1. [Pertanyaan kilat 1]\n2. [Pertanyaan kilat 2]\n3. [Pertanyaan kilat 3]\n4. [Pertanyaan kilat 4]\n5. [Pertanyaan kilat 5]`,
        qa_live: `\n**SEGMEN BONUS — Q&A SIMULASI AUDIENS 🙋**\n${host} membacakan pertanyaan dari "pendengar" yang relevan dengan materi buku:\n"Kita ada pertanyaan dari pendengar: [Pertanyaan]"\n${guest} menjawab seolah menjawab langsung.`,
        hot_seat: `\n**SEGMEN HOT SEAT 🪑**\n${host} ajukan satu pertanyaan paling menantang dan krusial seputar isi buku:\n"Ini pertanyaan yang paling sering jadi perdebatan: [Pertanyaan]"\n${guest} jawab dengan jujur dan mendalam.`,
        mitos_fakta: `\n**SEGMEN MITOS VS FAKTA 🔍**\n${host} bacakan 3 miskonsepsi umum, ${guest} luruskan berdasarkan isi buku:\nMitos 1: [Miskonsepsi] → Fakta: [Jawaban dari buku]\nMitos 2: [Miskonsepsi] → Fakta: [Jawaban dari buku]\nMitos 3: [Miskonsepsi] → Fakta: [Jawaban dari buku]`,
        top3: `\n**SEGMEN TOP 3 KEY INSIGHT 🏆**\n${guest} bagikan 3 insight paling berharga dari seluruh isi buku:\n"Kalau pendengar hanya bisa ingat 3 hal dari buku ini, itu adalah..."\n1. [Insight utama]\n2. [Insight kedua]\n3. [Insight ketiga]`,
        aksi_nyata: `\n**SEGMEN SATU AKSI NYATA 🎯**\n${host} tanya: "Satu hal yang bisa pendengar lakukan hari ini — bukan besok, bukan minggu depan — setelah dengar episode ini?"\n${guest} jawab dengan spesifik dan konkret.`,
      };

      const interactionInstructions = selectedInteractions.length > 0
        ? `\n=== TEKNIK INTERAKSI YANG HARUS DIGUNAKAN ===\nTerapkan teknik-teknik berikut secara alami dalam percakapan:\n${selectedInteractions.map(id => `• ${interactionMap[id] || id}`).join('\n\n')}\n`
        : '';

      const specialSegmentsScript = selectedSpecials.length > 0
        ? `\n=== SEGMEN KHUSUS TAMBAHAN ===\nSertakan segmen-segmen berikut sesuai urutan yang logis:\n${selectedSpecials.map(id => specialSegmentMap[id] || '').join('\n')}\n`
        : '';

      const keyQuestionsSection = taskConfig.podcastKeyQuestions
        ? `\n=== PERTANYAAN / TOPIK KUNCI YANG WAJIB DIBAHAS ===\n${host} HARUS memastikan pertanyaan/topik berikut terjawab tuntas oleh ${guest}:\n${taskConfig.podcastKeyQuestions}\n`
        : '';

      const hostPersonaNote = taskConfig.podcastHostPersona
        ? `\nKarakter ${host}: ${taskConfig.podcastHostPersona}`
        : `\nKarakter ${host}: Host yang cerdas dan ingin tahu. Sering menggali lebih dalam dengan "Kenapa?", "Bagaimana caranya?", "Bisa beri contoh nyata?"`;
      const guestPersonaNote = taskConfig.podcastGuestPersona
        ? `\nKarakter ${guest}: ${taskConfig.podcastGuestPersona}`
        : `\nKarakter ${guest}: Praktisi berpengalaman dan penulis buku. Berbicara dengan otoritas namun tetap mudah dipahami. Sering menggunakan pengalaman nyata sebagai ilustrasi.`;

      taskInstruction = `
MODE TUGAS: PODCAST SCRIPT GENERATOR — 2 PEMBICARA
${styleReminder}

Buatkan script podcast LENGKAP, SIAP REKAM, dan KAYA KONTEN dalam format **${podcastStyle}** — ${styleDesc[podcastStyle] || styleDesc.interview}.

=== DETAIL EPISODE ===
- Topik Utama: **${projectData.topik}**
- Judul Episode: ${projectData.judul || `"${projectData.topik}" — Panduan Lengkap`}
- Host: **${host}**
- Guest / Narasumber: **${guest}**
- Format: **${podcastStyle.toUpperCase()}** — ${styleDesc[podcastStyle]}
- Gaya Bahasa: **${langDesc[taskConfig.podcastLanguageStyle || 'semiformal']}**
- Energi & Tempo: **${energyDesc[taskConfig.podcastEnergyLevel || 'moderate']}**
- Durasi Target: **${taskConfig.podcastEpisodeLength || '15-20 menit'}** (~${wordCount} kata)
- Jumlah Segmen: **${segments} segmen**
- Target Pendengar: ${projectData.target || 'Umum'}

=== PERSONA PEMBICARA ===
${hostPersonaNote}
${guestPersonaNote}

=== PENGGALIAN KNOWLEDGE BASE EBOOK ===
- Kedalaman Eksplorasi: **${depthDesc[taskConfig.podcastKnowledgeDepth || 'deep']}**
- Fokus Konten: Dialog harus secara aktif menggali **${focusDesc[taskConfig.podcastKnowledgeFocus || 'semua']}** yang ada dalam materi ebook.
- Setiap klaim atau insight HARUS berasal dari atau merujuk pada materi ebook "${projectData.judul || projectData.topik}"
- ${guest} berbicara sebagai otoritas yang menguasai isi buku ini secara menyeluruh
${taskConfig.podcastKnowledgeDepth === 'exhaustive' ? '- Referensikan bab, lampiran, catatan, dan sumber yang ada di buku secara spesifik' : ''}
${keyQuestionsSection}
${interactionInstructions}

=== FORMAT SCRIPT ===
Gunakan format berikut secara konsisten:
**${host}:** Teks dialog...
**${guest}:** Teks dialog...

Sertakan notasi produksi dalam kurung siku:
- [INTRO MUSIK — FADE IN] / [OUTRO MUSIK — FADE OUT]
- [JEDA PENDEK] / [JEDA PANJANG]
- [TRANSISI SEGMEN]
- [NADA NAIK] / [NADA TURUN] — untuk variasi intonasi pada poin penting

=== STRUKTUR ${segments} SEGMEN ===

**SEGMEN 1 — OPENING (2-3 menit)**
[INTRO MUSIK — FADE IN]
- ${host} buka dengan hook kuat yang langsung menarik perhatian (fakta mengejutkan, pertanyaan provokatif, atau pernyataan berani dari buku)
- Perkenalkan ${guest} dengan cara yang menarik — bukan hanya jabatan, tapi cerita mengapa dia relevan untuk topik ini
- Teaser: 3 hal yang akan pendengar pelajari dari episode ini (ambil dari insight terkuat ebook)

**SEGMEN 2-${Math.max(2, segNum - 1)} — KONTEN INTI (isi dari ebook)**
Gali materi "${projectData.topik}" secara ${taskConfig.podcastKnowledgeDepth === 'exhaustive' ? 'sangat mendalam dan tuntas' : taskConfig.podcastKnowledgeDepth === 'surface' ? 'ringkas namun padat' : 'mendalam'}:
- Bedah konsep-konsep utama dari buku dengan contoh nyata dan mudah dipahami
- Setiap segmen membawa 1-2 insight utama dari buku yang berbeda
- ${podcastStyle === 'debate' ? `${host} dan ${guest} aktif berdebat dengan argumen dari sudut pandang berbeda` : ''}
- ${podcastStyle === 'masterclass' ? `${guest} menjelaskan seperti seorang guru, ${host} mewakili "murid" yang bertanya` : ''}
- ${podcastStyle === 'fireside' ? 'Percakapan mengalir natural, boleh menyimpang sedikit asalkan tetap relevan' : ''}
- Dialog harus terasa seperti dua orang cerdas yang benar-benar tahu materinya, bukan membaca script

**SEGMEN ${segments} — CLOSING (2-3 menit)**
- Rekap: ${host} minta ${guest} rangkum 3 insight paling berharga dari seluruh diskusi
- ${guest} berikan pesan terakhir yang memorable dan menggerakkan pendengar untuk bertindak
- ${host} tutup dengan kalimat penutup yang kuat dan ajakan untuk baca/praktikkan isinya
[OUTRO MUSIK — FADE OUT]
${specialSegmentsScript}

=== PANDUAN KUALITAS DIALOG ===
- Dialog harus terasa 100% natural — tidak kaku, tidak seperti membaca buku teks
- Gunakan variasi panjang kalimat: pendek untuk drama, panjang untuk elaborasi
- Sisipkan reaksi natural: "Oh, jadi maksudnya...", "Wah, itu counter-intuitive banget!", "Hmm, coba ulangi bagian itu..."
- Saat ${guest} menyampaikan insight dari buku, ${host} bereaksi seperti pendengar yang benar-benar terkesan atau skeptis
- ${taskConfig.podcastEnergyLevel === 'energetic' ? 'Sering ada interupsi ringan, saling melempar ide, tempo cepat' : ''}
- ${taskConfig.podcastEnergyLevel === 'calm' ? 'Banyak jeda pikir, kalimat dipertimbangkan matang sebelum diucapkan' : ''}
- ${taskConfig.podcastLanguageStyle === 'gaul' ? 'Gunakan istilah kekinian: "literally", "nggak sih", "relate banget", "vibes", dll' : ''}
- ${taskConfig.podcastStyle === 'debate' ? 'Kedua pihak harus memberikan argumen berbasis data dan logika, bukan emosi' : ''}
- Total target: **~${wordCount} kata** — tulis LENGKAP sampai selesai, bukan ringkasan atau template
`;
      break;
    }

    case 'AUDIOBOOK_SCRIPT': {
      const abTone = taskConfig.audiobookTone || 'conversational';
      const abToneDesc: Record<string, string> = {
        conversational: 'santai dan hangat, seperti berbicara langsung kepada pendengar — tidak ada jarak antara narator dan pendengar',
        authoritative: 'tegas dan meyakinkan, seperti seorang pakar di bidangnya — setiap kata diucapkan dengan keyakinan penuh',
        warm: 'penuh kehangatan dan empati — suara yang menyejukkan, membuat pendengar merasa diperhatikan dan didukung',
        dramatic: 'dramatis dan penuh penghayatan emosional — variasi intonasi lebar, memberi bobot pada setiap momen penting',
        academic: 'formal dan ilmiah — terminologi tepat, penyampaian sistematis dan terstruktur',
        motivational: 'penuh semangat dan energi — mendorong pendengar untuk percaya diri dan segera bertindak',
        storyteller: 'seperti mendongeng — imajinatif, penuh warna, membawa pendengar seolah hadir dalam cerita',
        mentor: 'bijak dan sabar — membimbing step by step seperti mentor yang berpengalaman, tidak menghakimi',
      };
      const abPaceDesc: Record<string, string> = {
        very_slow: 'sangat lambat — banyak jeda panjang, cocok untuk meditasi atau menjelang tidur, beri ruang pendengar meresapi setiap kata',
        slow: 'lambat dan tenang — jeda lebih sering, kontemplatif, beri ruang untuk pendengar merefleksikan isi',
        medium: 'sedang — standar audiobook profesional, natural dan mengalir',
        fast: 'cepat dan ringkas — langsung ke poin utama, minim elaborasi, cocok untuk summary atau commute',
      };
      const abFocusDesc: Record<string, string> = {
        full: 'narasi lengkap seluruh buku dari bab pertama hingga terakhir',
        intro: 'hanya pendahuluan dan bab pertama — preview menarik untuk promosi produk',
        per_bab: `narasi khusus untuk ${taskConfig.audiobookChapterRef || 'bab yang ditentukan'}`,
        single_bab: `deep dive satu bab penuh: ${taskConfig.audiobookChapterRef || 'bab yang ditentukan'}`,
        summary: 'ringkasan setiap bab — poin-poin utama saja, padat dan langsung ke inti',
        highlights: 'highlight terbaik dari seluruh buku — kutipan, insight, dan momen paling impactful',
      };
      const abEmphasisDesc: Record<string, string> = {
        minimal: 'netral dan informatif, tanpa penekanan emosional berlebihan',
        moderate: 'seimbang antara fakta dan nuansa emosi yang natural',
        strong: 'penuh penghayatan — ekspresi kuat, intonasi bervariasi lebar pada setiap poin penting',
      };
      const abLangDesc: Record<string, string> = {
        formal: 'Bahasa Indonesia baku formal. Gunakan "Anda". Tidak ada ekspresi informal atau slang.',
        semiformal: 'Bahasa Indonesia semi-formal. Mengalir natural, boleh ada ekspresi sehari-hari yang baku. Gunakan "Anda".',
        casual: 'Bahasa kasual dan ramah. Gunakan "kamu". Boleh ada ekspresi sehari-hari yang hangat.',
        bilingual: 'Campuran Bahasa Indonesia dan Inggris — untuk terminologi teknis boleh pakai Bahasa Inggris.',
      };
      const abContextDesc: Record<string, string> = {
        general: 'konteks umum — fleksibel dan cocok untuk berbagai situasi',
        commute: 'konteks perjalanan — pendengar mungkin tidak bisa mencatat, pastikan poin penting diulang dan mudah diingat',
        study: 'konteks belajar serius — pendengar siap fokus penuh, boleh ada detail kompleks dan terminologi khusus',
        workout: 'konteks olahraga — energik, memompa semangat, pacing sedikit lebih cepat dan dinamis',
        relax: 'konteks santai — nyaman, tidak terburu-buru, hangat dan mengalir',
        sleep: 'konteks menjelang tidur — perlahan, menenangkan, hindari pernyataan yang terlalu stimulatif',
      };
      const abOpeningDesc: Record<string, string> = {
        hook: 'HOOK KUAT: buka dengan pernyataan mengejutkan, fakta kontra-intuitif, atau pertanyaan yang memancing rasa ingin tahu',
        anekdot: 'ANEKDOT / MINI-CERITA: buka dengan kisah nyata singkat (2-3 kalimat) yang relevan dengan isi bab',
        fakta: 'FAKTA MENGEJUTKAN: buka dengan statistik atau data yang tidak terduga dan langsung relevan',
        pertanyaan: 'PERTANYAAN REFLEKTIF: ajak pendengar berpikir sebelum masuk ke materi',
        kutipan: 'KUTIPAN INSPIRATIF: buka dengan kutipan kuat dari tokoh relevan yang memperkuat tema bab',
        langsung: 'LANGSUNG KE INTI: tanpa basa-basi, langsung paparkan apa yang akan dipelajari',
      };
      const abClosingDesc: Record<string, string> = {
        summary: 'RINGKASAN 3 POIN: recap singkat tiga hal terpenting dari bab ini',
        teaser: 'TEASER CLIFFHANGER: akhiri dengan preview menarik tentang apa yang akan dibahas di bab berikutnya',
        challenge: 'TANTANGAN PRAKTIS: berikan 1 aksi konkret yang bisa pendengar lakukan dalam 24 jam setelah mendengarkan bab ini',
        refleksi: 'PERTANYAAN REFLEKSI: ajak pendengar merenung dengan 1-2 pertanyaan introspektif',
        motivasi: 'PESAN MOTIVASI: tutup dengan kata-kata penguatan dan dorongan untuk terus melanjutkan perjalanan belajar',
        kombinasi: 'KOMBINASI LENGKAP: ringkasan 3 poin + teaser bab berikutnya + 1 aksi nyata',
      };
      const abMusicDesc: Record<string, string> = {
        none: 'Tanpa musik latar. Narasi murni.',
        instrumental: 'Musik instrumental ringan — standar audiobook profesional. Notasikan [MUSIK LATAR: Instrumental ringan].',
        ambient: 'Suara alam / ambient — air mengalir, angin, burung. Notasikan [MUSIK LATAR: Ambient/Nature].',
        cinematic: 'Musik sinematik / dramatis — untuk momen-momen emosional penting. Notasikan [MUSIK LATAR: Cinematic].',
        motivational: 'Musik upbeat motivational — energik. Notasikan [MUSIK LATAR: Motivational Upbeat].',
        meditation: 'Musik meditasi / lo-fi — tenang dan menenangkan. Notasikan [MUSIK LATAR: Meditasi Tenang].',
      };

      const selectedSpecials = (taskConfig.audiobookSpecialElements || '').split('|||').filter(Boolean);
      const specialElementMap: Record<string, string> = {
        metafora: `• **Metafora & Analogi Kreatif**: Setiap kali ada konsep abstrak atau teknis, narator WAJIB menawarkan analogi atau perumpamaan nyata yang mudah divisualisasi pendengar. Contoh: "Bayangkan ini seperti... [analogi]"`,
        anekdot: `• **Anekdot Pembuka Bab**: Setiap bab dibuka dengan mini-cerita nyata (3-5 kalimat) yang relevan dengan isi bab, sebelum narator menyebutkan judul bab secara eksplisit.`,
        cta_bab: `• **Call-to-Action Per Bab**: Di akhir setiap bab, narator memberikan satu CTA spesifik yang bisa langsung dilakukan. Contoh: "Sebelum melanjutkan ke bab berikutnya, ambil selembar kertas dan tuliskan..."`,
        quiz_mini: `• **Kuis Refleksi Mini**: Di akhir setiap bab, sertakan 1-2 pertanyaan reflektif. Contoh narasi: "Sebelum kita lanjutkan, coba jawab dalam hati: [pertanyaan]. Pikirkan sejenak... [JEDA PANJANG]. Baik, mari kita lanjutkan."`,
        motivasi: `• **Kutipan Motivasional**: Sisipkan kutipan kuat dari tokoh relevan di momen-momen tepat untuk memperkuat poin kunci. Format: "[NADA TURUN] Seperti yang pernah dikatakan [Nama Tokoh]: '...[kutipan]'"`,
        recap: `• **Recap Visual Verbal**: Saat buku memiliki tabel, diagram, atau grafik, narator mendeskripsikannya secara verbal agar pendengar bisa membayangkan. Contoh: "Di sini, buku menyajikan sebuah diagram yang menunjukkan... Bayangkan sebuah garis vertikal yang..."`,
        challenge: `• **Daily Challenge**: Di akhir setiap bab, berikan "tantangan 24 jam" yang konkret dan spesifik. Format: "[JEDA PENDEK] Tantangan bab ini: dalam 24 jam ke depan, lakukan [aksi spesifik]. Siap?"`,
        afirmasi: `• **Afirmasi & Reinforcement**: Setelah menyampaikan poin penting, narator memperkuat dengan kalimat afirmatif. Contoh: "Kamu sudah tahu sekarang bahwa...", "Kamu lebih siap dari yang kamu kira untuk..."`,
      };

      const narratorLine = taskConfig.audiobookNarrator ? `**${taskConfig.audiobookNarrator}**` : '(narator tidak disebutkan namanya)';
      const personaNote = taskConfig.audiobookNarratorPersona
        ? `\nKarakter Suara Narator: ${taskConfig.audiobookNarratorPersona}`
        : '';
      const langStyle = taskConfig.audiobookLanguageStyle || 'semiformal';
      const sapaanPronoun = langStyle === 'casual' ? '"kamu"' : '"Anda"';

      taskInstruction = `
MODE TUGAS: AUDIOBOOK SCRIPT GENERATOR — NARASI PROFESIONAL
${styleReminder}

Buatkan script audiobook yang LENGKAP, SIAP REKAM, dan BERKUALITAS TINGGI untuk buku bertema "${projectData.topik}".

=== SPESIFIKASI PRODUKSI ===
- Judul Buku: **${projectData.judul || projectData.topik}**
- Target Pendengar: ${projectData.target || 'Umum'}
- Narator: ${narratorLine}${personaNote}
- Gaya Narasi / Tone: **${abTone}** — ${abToneDesc[abTone]}
- Kecepatan Pacing: **${taskConfig.audiobookPace || 'medium'}** — ${abPaceDesc[taskConfig.audiobookPace || 'medium']}
- Gaya Bahasa: **${abLangDesc[langStyle]}**
- Penekanan Emosi: **${abEmphasisDesc[taskConfig.audiobookEmphasis || 'moderate']}**
- Konteks Mendengarkan: **${abContextDesc[taskConfig.audiobookListeningContext || 'general']}**
- Fokus Output: **${abFocusDesc[taskConfig.audiobookChapterFocus || 'full']}**
- Musik Latar: **${abMusicDesc[taskConfig.audiobookMusicStyle || 'instrumental']}**
- Gaya Pembuka Bab: **${abOpeningDesc[taskConfig.audiobookOpeningStyle || 'hook']}**
- Gaya Penutup Bab: **${abClosingDesc[taskConfig.audiobookClosingStyle || 'summary']}**
- Sapaan Pendengar: Gunakan ${sapaanPronoun} secara konsisten sepanjang narasi

=== NOTASI PRODUKSI ===
Gunakan notasi berikut secara konsisten dan tepat:
- [JEDA PENDEK] → jeda 1-2 detik (antar kalimat penting)
- [JEDA PANJANG] → jeda 3-5 detik (antar seksi/transisi besar)
- [PENEKANAN] → kata/frasa berikutnya dibaca lebih pelan, berat, dan jelas
- [NADA NAIK] → intonasi naik — untuk pertanyaan atau antisipasi
- [NADA TURUN] → intonasi turun — untuk konklusi atau pernyataan tegas
- [MUSIK INTRO — FADE IN] / [MUSIK OUTRO — FADE OUT] → transisi bab
${taskConfig.audiobookMusicStyle !== 'none' ? `- [MUSIK LATAR: ${taskConfig.audiobookMusicStyle}] → musik latar dimulai / disesuaikan` : ''}
- [NAPAS] → jeda natural setelah kalimat panjang
- *kata* → dibaca lebih lambat dan ditekankan
- **frasa penting** → poin paling krusial, penekanan penuh

=== ELEMEN KHUSUS YANG HARUS DISERTAKAN ===
${selectedSpecials.length > 0 ? selectedSpecials.map(id => specialElementMap[id] || '').filter(Boolean).join('\n') : '• Gunakan gaya narasi standar dengan hook di awal dan ringkasan di akhir setiap bab.'}

=== FORMAT SETIAP BAB ===

**[MUSIK INTRO — FADE IN 5 DETIK]**
*(Estimasi durasi bab ini: ± X menit)*

**PEMBUKAAN BAB [NOMOR]: [JUDUL BAB]**
[${abOpeningDesc[taskConfig.audiobookOpeningStyle || 'hook']}]
[JEDA PANJANG]

**ISI UTAMA BAB [NOMOR]:**
[Narasi mendalam dengan pacing ${taskConfig.audiobookPace || 'medium'}]
[Gunakan notasi produksi di tempat yang tepat]
[Kalimat maksimal 20-25 kata agar nyaman diucapkan dan didengarkan]

**PENUTUP BAB [NOMOR]:**
[${abClosingDesc[taskConfig.audiobookClosingStyle || 'summary']}]
[JEDA PANJANG]

**[MUSIK OUTRO — FADE OUT]**

=== INSTRUKSI KUALITAS NARASI ===
- Script ditulis untuk DIDENGARKAN, bukan dibaca — hindari struktur kalimat yang terasa seperti teks tertulis
- Kalimat pendek mendominasi (15-20 kata) — sesekali ada kalimat panjang untuk elaborasi
- Variasikan panjang paragraf: pendek untuk drama, panjang untuk penjelasan
- Sertakan "breathing room" — kalimat pendek tunggal setelah penjelasan panjang
- Gunakan kata ganti orang kedua (${sapaanPronoun}) secara aktif untuk membangun koneksi
- ${taskConfig.audiobookListeningContext === 'sleep' ? 'KHUSUS konteks tidur: tidak ada pertanyaan yang terlalu menstimulasi, pacing sangat lambat, hindari data & angka berlebihan' : ''}
- ${taskConfig.audiobookListeningContext === 'workout' ? 'KHUSUS konteks olahraga: energik, kalimat lebih pendek, banyak ekspresi penguatan dan motivasi' : ''}
- ${taskConfig.audiobookListeningContext === 'commute' ? 'KHUSUS konteks commute: ulangi poin penting 2x dengan cara berbeda, hindari instruksi yang butuh mencatat' : ''}
- ${taskConfig.audiobookTone === 'storyteller' ? 'Tone storyteller: gunakan kosakata yang kaya imajinasi, deskripsi visual, dan ritme narasi yang seperti dongeng' : ''}
- Tulis script LENGKAP dan SIAP REKAM — bukan template atau outline
`;
      break;
    }

    case 'LANDING_PAGE': {
      const lpStyle = taskConfig.landingPageStyle || 'long-form';
      const lpGoal = taskConfig.landingPageGoal || 'sell';
      const lpPrice = taskConfig.landingPagePrice || '(harga belum ditentukan)';
      const lpCTA = taskConfig.landingPageCTA || 'Beli Sekarang';
      const lpBonuses = taskConfig.landingPageBonuses?.trim()
        ? taskConfig.landingPageBonuses.split('\n').filter(Boolean).map((b, i) => `  ${i + 1}. ${b.trim()}`).join('\n')
        : '  (tidak ada bonus tambahan)';
      const lpFormat = taskConfig.landingPageOutputFormat || 'copy';

      const lpStyleDesc: Record<string, string> = {
        'long-form': 'Long-Form Sales Letter — copy panjang yang persuasif, menggunakan formula AIDA dan PAS',
        'short': 'Short Copy — ringkas, langsung ke manfaat, cocok untuk retargeting atau audiens yang sudah aware',
        'vsl': 'VSL Page — halaman dengan fokus pada video, copy pendukung video sales letter',
        'webinar': 'Webinar Registration Page — dorong pendaftaran webinar/kelas gratis',
      };
      const lpGoalDesc: Record<string, string> = {
        'sell': 'langsung closing — arahkan pembaca untuk membeli',
        'lead': 'kumpulkan email/WhatsApp — tawarkan lead magnet gratis',
        'webinar': 'daftar webinar gratis — dorong pendaftaran acara',
        'waitlist': 'masuk waitlist — bangun antisipasi produk yang akan segera launch',
      };
      const lpOutputDesc: Record<string, string> = {
        'copy': 'Tulis sebagai COPY SAJA — teks bersih tanpa HTML, siap dipaste ke Notion/Google Docs/Canva/builder apapun.',
        'html': 'Tulis sebagai HTML LENGKAP dengan inline CSS — struktur <section> per bagian, warna, font, tombol yang menarik. Siap upload.',
        'sections': 'Tulis DIPISAH PER SEKSI dengan judul jelas: [HERO], [PROBLEM], [SOLUTION], [FEATURES], [TESTIMONIAL], [PRICING], [FAQ], [CTA].',
      };

      taskInstruction = `
MODE TUGAS: LANDING PAGE GENERATOR
${styleReminder}

Buatkan landing page ${lpStyleDesc[lpStyle]} untuk menjual ebook bertema "${projectData.topik}".

=== BRIEF PRODUK ===
- Judul Ebook: **${projectData.judul || projectData.topik}**
- Topik: ${projectData.topik}
- Target Pembaca: ${projectData.target || 'Umum'}
- Bahasa: ${projectData.bahasa || 'Indonesia'}
- Harga: **${lpPrice}**
- Tujuan Landing Page: **${lpGoalDesc[lpGoal]}**
- Tombol CTA: **"${lpCTA}"**
${lpBonuses !== '  (tidak ada bonus tambahan)' ? `\nBonus yang disertakan:\n${lpBonuses}` : ''}

=== FORMAT OUTPUT ===
${lpOutputDesc[lpFormat]}

=== STRUKTUR WAJIB (sesuaikan dengan tipe ${lpStyle}) ===

**1. HERO SECTION**
- Headline utama (kuat, benefit-driven, max 10 kata)
- Subheadline (perjelas proposi nilai, 1-2 kalimat)
- CTA pertama: "**${lpCTA}**"

**2. PAIN POINT / PROBLEM AGITATION**
- Gambarkan masalah yang dirasakan target pembaca dengan empatik
- Gunakan teknik "Before & After" atau "Problem → Agitate → Solve"
- 3-5 bullet point masalah yang relatable

**3. SOLUSI & UNIQUE VALUE PROPOSITION**
- Perkenalkan ebook sebagai solusi
- Apa yang membuatnya BERBEDA dari solusi lain
- Satu kalimat positioning yang kuat

**4. FITUR & MANFAAT (Isi Ebook)**
Buat dalam 2 format:
- Daftar BAB / Isi Ebook (apa yang dipelajari)
- Manfaat konkret setelah membaca (transformasi)

**5. UNTUK SIAPA EBOOK INI**
- ✅ Cocok untuk: [3-5 profil ideal]
- ❌ Bukan untuk: [1-2 yang tidak cocok]

**6. TESTIMONI TEMPLATE**
Buat 3 contoh testimoni fiktif yang realistis (untuk placeholder):
Format: "[Kutipan] — Nama, Pekerjaan, Kota"

**7. TENTANG PENULIS (Author Bio)**
- Tulis template bio singkat yang bisa dikustomisasi
- Highlight kredibilitas & pengalaman relevan

${lpBonuses !== '  (tidak ada bonus tambahan)' ? `**8. BONUS SECTION**
Tampilkan bonus dengan nilai yang dirasakan:
- Nama bonus
- Deskripsi singkat
- Nilai normal (buat estimasi wajar)\n` : ''}

**${lpBonuses !== '  (tidak ada bonus tambahan)' ? '9' : '8'}. HARGA & PENAWARAN**
- Tampilkan harga: **${lpPrice}**
- Jika ada coret harga asli — buat estimasi yang masuk akal
- Highlight nilai total (ebook + bonus)
- Urgency copy (stok terbatas / penawaran waktu terbatas)
- Tombol CTA besar: "**${lpCTA}**"

**${lpBonuses !== '  (tidak ada bonus tambahan)' ? '10' : '9'}. GARANSI (jika ada)**
- Template garansi uang kembali 7/14/30 hari
- Hilangkan risiko keputusan beli

**${lpBonuses !== '  (tidak ada bonus tambahan)' ? '11' : '10'}. FAQ**
5 pertanyaan yang paling sering ditanyakan calon pembeli + jawaban meyakinkan

**${lpBonuses !== '  (tidak ada bonus tambahan)' ? '12' : '11'}. CLOSING CTA**
- Rangkum ulang proposi nilai
- Sense of urgency
- Tombol CTA final: "**${lpCTA}**"

=== TEKNIK COPYWRITING YANG HARUS DIGUNAKAN ===
- Formula PAS (Problem → Agitate → Solution) untuk bagian opening
- Social proof & authority markers
- Specificity (angka konkret lebih persuasif dari kata-kata umum)
- Future pacing ("Bayangkan 30 hari dari sekarang...")
- Risk reversal (garansi, jaminan)
- Bahasa yang natural dan conversational, bukan kaku seperti brosur
`;
      break;
    }

    default:
      taskInstruction = `
MODE TUGAS: GENERAL ASSISTANT
${styleReminder}

Tolong bantu saya dengan project ebook bertema "${projectData.topik}".
Berikan panduan dan saran yang actionable.
`;
  }

  return systemPrompt + taskInstruction;
}
