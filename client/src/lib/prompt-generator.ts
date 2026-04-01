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

export function generatePrompt(
  activeMode: string,
  projectData: ProjectData,
  taskConfig: TaskConfig,
  extendConfig: ExtendConfig,
  uploadedFiles: UploadedFile[]
): string {
  const agenticLogic = projectData.aiCharacter.includes("Agentic") 
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
Berperanlah sebagai: **${projectData.aiCharacter}**.
`;

  const industryContext = getIndustryContext(projectData.industry || 'general');

  const systemPrompt = `
Anda adalah "Ebook Builder Pro AI", mesin pembuat ekosistem ebook profesional yang dirancang untuk menangani **BERBAGAI TOPIK (Generik)**.
Aplikasi ini fleksibel dan tidak terbatas pada satu industri tertentu.

${agenticLogic}
${industryContext}
=== DATA UTAMA DARI FORM ===
- Topik/Kata Kunci: ${projectData.topik || '[Belum diisi]'}
- Judul Ebook (Utama): ${projectData.judul || '[Belum diisi]'}
- Target Pembaca: ${projectData.target || '[Belum diisi]'}
- Level Ebook: ${projectData.level}
- Pain Point/Masalah: ${projectData.painPoint || '[Belum diisi]'}
- Industri/Sektor: ${INDUSTRIES.find(i => i.id === projectData.industry)?.name || 'Umum'}

=== PENGATURAN GAYA & FORMAT (WAJIB DIIKUTI) ===
Instruksi di bawah ini bersifat MANDATORI:
1. BAHASA OUTPUT: Gunakan **${projectData.language}** sepenuhnya.
2. FORMAT STRUKTUR: **${projectData.outputFormat}**.
3. NADA BICARA (TONE): **${projectData.tone}**.
4. GAYA PENULISAN (STYLE): **${projectData.writingStyle}**.

=== REKOMENDASI EKSEKUSI ===
Setelah prompt ini selesai, disarankan untuk mengeksekusi di **chat.dokumentender.com** 
untuk hasil optimal dalam Bahasa Indonesia dan dokumen teknis industri.

=== INSTRUKSI UMUM ===
Kerjakan tugas di bawah ini dengan output yang TERSTRUKTUR, MENDALAM, dan SIAP PAKAI.
`;

  let taskInstruction = "";
  const styleReminder = `
[PENTING: Pastikan Output menggunakan format: ${projectData.outputFormat}, Tone: ${projectData.tone}, Style: ${projectData.writingStyle}, Bahasa: ${projectData.language}]
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

    case 'DOC_GENERATOR':
      taskInstruction = `
MODE TUGAS: DOCUMENT GENERATOR (DOKUMEN KERJA)
${styleReminder}

Saya membutuhkan dokumen kerja profesional yang berkaitan dengan topik ebook ini.
Anda bertindak sebagai **Technical Writer / Legal Drafter Profesional**.

=== SPESIFIKASI DOKUMEN ===
1. **Jenis Dokumen:** ${taskConfig.docType}
2. **Konteks Spesifik:** ${taskConfig.docContext || `Terkait dengan penerapan materi dari ebook "${projectData.judul || projectData.topik}"`}
3. **Target Pengguna Dokumen:** ${projectData.target || 'Karyawan/Tim Internal'}

=== INSTRUKSI PENULISAN ===
Buat dokumen ini secara LENGKAP, FORMAL, dan SIAP PAKAI (Ready to use).
Jangan hanya memberikan outline, tapi berikan ISI SEBENARNYA.

Struktur Wajib (Sesuaikan dengan jenis dokumen):
- **Header:** (Nama Dokumen, No. Dokumen [Placeholder], Tanggal).
- **Tujuan/Purpose:** Mengapa dokumen ini dibuat.
- **Ruang Lingkup/Scope:** Siapa yang terlibat.
- **Isi Utama:** (Pasal-pasal untuk Kebijakan, Langkah-langkah detail untuk SOP, Butir kesepakatan untuk SPK, dll).
- **Kolom Tanda Tangan:** (Dibuat, Diperiksa, Disetujui).

Pastikan bahasa yang digunakan baku dan sesuai standar industri untuk ${taskConfig.docType}.
`;
      break;

    case 'MARKETING_KIT':
      const isVisualPrompt = taskConfig.marketingAsset.includes('Prompt Gambar') || taskConfig.marketingAsset.includes('Prompt Video');
      
      taskInstruction = `
MODE TUGAS: MARKETING KIT GENERATOR
${styleReminder}

Saya membutuhkan materi pemasaran yang persuasif untuk menjual ebook/produk ini.
Anda bertindak sebagai **Expert Copywriter** dan **Creative Director**.

=== DATA PRODUK ===
- Produk: Ebook "${projectData.judul}"
- Target: ${projectData.target}
- Masalah yang diselesaikan: ${projectData.painPoint}
- Jenis Aset Marketing: **${taskConfig.marketingAsset}**
- Angle/Hook Khusus: ${taskConfig.marketingAngle || 'Fokus pada Transformasi & Kemudahan'}

=== INSTRUKSI KHUSUS ===
${isVisualPrompt ? `
**TUGAS: GENERATE AI IMAGE/VIDEO PROMPT**
Jangan buat copy iklan! Tapi buatlah **Prompt Teknis dalam Bahasa Inggris** yang bisa saya copy-paste ke Midjourney/DALL-E/Runway.
Struktur Prompt:
1. **Subject:** (Deskripsi objek utama, misal: buku di atas meja kerja modern).
2. **Environment:** (Latar belakang, pencahayaan, suasana).
3. **Style:** (Photorealistic, 3D Render, Minimalist Vector, Cinematic).
4. **Parameters:** (Aspect ratio --ar 16:9, v 6.0, dll).
Buat 3 Variasi Prompt yang berbeda.
` : `
**TUGAS: TULIS COPYWRITING PENJUALAN**
Tulis naskah iklan/konten yang sangat membujuk menggunakan teknik **Direct Response Marketing**.
Gunakan kerangka **PAS (Problem - Agitate - Solution)** atau **AIDA (Attention - Interest - Desire - Action)**.
- Gunakan bahasa yang "nendang" (Punchy).
- Fokus pada *Benefit*, bukan hanya *Features*.
- Sertakan Call to Action (CTA) yang jelas.
`}
`;
      break;

    case 'PROMPT_PACK':
      taskInstruction = `
MODE TUGAS: PROMPT PACK GENERATOR (WORKFLOW CREATOR)
${styleReminder}

Saya ingin Anda bertindak sebagai **Senior Prompt Engineer**.
Tugas Anda BUKAN membuat konten ebook, melainkan membuat **RANGKAIAN PROMPT (PACK)** yang bisa saya gunakan di ChatGPT/Claude untuk menyelesaikan pekerjaan besar langkah demi langkah.

=== SPESIFIKASI PACK ===
1. **Jenis Workflow:** ${taskConfig.packType}
2. **Topik Utama:** ${projectData.topik}
3. **Tujuan Akhir:** Membantu user menyelesaikan seluruh proses dari A sampai Z secara mandiri menggunakan AI.

=== OUTPUT YANG DIMINTA ===
Buatkan 5-7 Prompt Berurutan (Sequential Prompts). Untuk setiap prompt, berikan:
1. **Judul Tahapan** (Misal: Tahap 1 - Riset Ide).
2. **Isi Prompt** (Teks prompt yang siap di-copy paste oleh user, gunakan teknik *persona acting* dan *chain of thought*).
3. **Penjelasan Singkat** (Apa tujuan prompt ini).

Pastikan prompt tersebut saling berkesinambungan (Prompt 2 menggunakan hasil dari Prompt 1).
`;
      break;

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
- **Sumber Pengetahuan:** Konten dari ebook "${projectData.judul}" (Saya akan upload file ebooknya ke Knowledge Base GPTs).

=== TUGAS ANDA ===
Buatkan Teks Konfigurasi Lengkap dengan struktur berikut:

1. **Name:** Usulan nama bot yang menarik.
2. **Description:** Deskripsi singkat 1 kalimat untuk ditampilkan di store.
3. **Instructions (System Prompt Inti):**
   - Definisikan Persona secara detail (Kamu adalah...).
   - Definisikan Misi (Membantu pembaca memahami topik ${projectData.topik}).
   - **Knowledge Base Rules (PENTING):** Instruksikan bot untuk SELALU mencari jawaban di file yang diupload ("Knowledge") TERLEBIH DAHULU sebelum menggunakan pengetahuan umum. Jika jawaban ada di buku, kutip halamannya.
   - **Tone & Style:** ${projectData.tone} dan ${projectData.writingStyle}.
   - **Guardrails:** Apa yang TIDAK boleh dilakukan (misal: memberi saran medis/hukum sembarangan jika topik sensitif).
4. **Conversation Starters:** 4 Contoh pertanyaan pemancing yang relevan dengan isi ebook.
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
${projectData.level === 'Single Ebook' ? `
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
` : projectData.level === '3 Ebook (Trilogi Simple)' ? `
Buatkan Outline untuk TRILOGI (3 Ebook) dengan pembagian:
- **Buku 1: Fundamental** (Mindset & Konsep Dasar)
- **Buku 2: Strategi** (Implementasi & Teknis)
- **Buku 3: Advanced** (Pengembangan & Scaling)

Untuk SETIAP buku, rincikan:
1. Judul Buku
2. Fokus/Tema Utama
3. Daftar Bab (5-7 bab per buku)
4. Untuk setiap bab: Judul + 3 Sub-bab utama
` : `
Buatkan Outline untuk SERI LENGKAP (9 Ebook) dengan pembagian:
**LEVEL BASIC (Buku 1-3):**
- Buku 1: Mindset & Dasar
- Buku 2: Validasi Market
- Buku 3: Persiapan Produk

**LEVEL INTERMEDIATE (Buku 4-6):**
- Buku 4: Strategi Marketing
- Buku 5: Funnel & Sales
- Buku 6: Operasional

**LEVEL ADVANCED (Buku 7-9):**
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

    case 'DRAFT_BAB':
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

Struktur Konten Bab:
a) **Pendahuluan (Hook & Relevansi)** - Mengapa bab ini penting? Apa yang akan dipelajari?
b) **Pembahasan Utama (Sub-bab detail)** - Penjelasan mendalam dengan contoh.
c) **Contoh / Studi Kasus** - Ilustrasi nyata yang relevan dengan topik bab.
d) **Actionable Steps / Checklist** - Langkah praktis yang bisa langsung diterapkan pembaca.
e) **Kesimpulan & Transisi** - Rangkuman poin penting + preview bab berikutnya.

=== GAYA PENULISAN ===
- Panjang: 2000-3000 kata minimum
- Gunakan sub-heading (H2, H3) untuk struktur yang jelas
- Sertakan bullet points dan numbered list untuk kemudahan baca
- Tambahkan "Pro Tips" atau "Warning" box jika relevan
`;
      break;

    case 'VIDEO_SCRIPT':
      taskInstruction = `
MODE TUGAS: VIDEO/PODCAST SCRIPT GENERATOR
${styleReminder}

Saya ingin membuat script video/podcast berdasarkan materi ebook ini.

=== SPESIFIKASI SCRIPT ===
1. **Judul Video/Episode:** ${taskConfig.judulScript || `Penjelasan tentang ${projectData.topik}`}
2. **Durasi Target:** ${taskConfig.durasiScript}
3. **Sumber Materi:** Ebook "${projectData.judul}" - Bab: ${finalJudulBab || 'Umum'}
4. **Format:** Video Edukasi / Podcast Informatif

=== TUGAS ANDA ===
Buatkan Script Lengkap dengan struktur:

**[OPENING - 30 detik]**
- Hook yang menarik perhatian
- Preview apa yang akan dipelajari

**[INTRO DIRI - 15 detik]**
- Perkenalan singkat host/creator

**[KONTEN UTAMA - 70% durasi]**
- Poin 1: [Judul] + Penjelasan + Contoh
- Poin 2: [Judul] + Penjelasan + Contoh
- Poin 3: [Judul] + Penjelasan + Contoh
(Sesuaikan jumlah poin dengan durasi)

**[RECAP & CTA - 30 detik]**
- Rangkuman 3 takeaway utama
- Call to Action (Subscribe, Download ebook, dll)

=== FORMAT OUTPUT ===
Tulis dalam format script yang mudah dibaca:
- Gunakan [VISUAL: ...] untuk instruksi visual/B-roll
- Gunakan (Beat) atau (Pause) untuk jeda
- Highlight kata-kata yang perlu DITEKANKAN
`;
      break;

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

    case 'MINI_APP_BUILDER':
      taskInstruction = `
MODE TUGAS: MINI APP BUILDER — BLUEPRINT APLIKASI INTERAKTIF
${styleReminder}

Berdasarkan ebook bertema "${projectData.topik}", rancang blueprint mini web app yang bisa mendukung pembaca dalam mengaplikasikan isi ebook secara interaktif.

=== KONTEKS EBOOK ===
Judul: ${projectData.judul || projectData.topik}
Target Pengguna: ${projectData.target || 'pembaca ebook'}
Tujuan: ${projectData.tujuan || 'membantu pengguna mempraktikkan konten ebook'}

=== INSTRUKSI BLUEPRINT ===
Buat blueprint mini app yang LENGKAP dan SPESIFIK meliputi:

1. **Nama & Konsep App** (1 paragraf, jelas & menarik)
2. **Problem Solved** (masalah spesifik yang diselesaikan app ini)
3. **5 Fitur Utama** (dengan deskripsi detail per fitur)
4. **5 Halaman/Screen Utama** (wireframe deskriptif: apa yang ada di tiap halaman)
5. **User Flow** (langkah step-by-step penggunaan)
6. **Tech Stack Rekomendasi** (framework, database, API yang cocok)
7. **Prompt untuk Build dengan AI** (prompt siap pakai untuk Cursor/Lovable/Bolt)
8. **Monetisasi App** (gratis, freemium, atau berbayar — dengan strategi)
9. **Launch Checklist** (10 langkah sebelum release)

Buat sedetail dan sekonkret mungkin agar langsung bisa dieksekusi.
`;
      break;

    case 'QUIZ_MAKER':
      taskInstruction = `
MODE TUGAS: QUIZ MAKER — GENERATOR SOAL & ASESMEN
${styleReminder}

Buat soal kuis dan asesmen komprehensif untuk menguji pemahaman pembaca tentang ebook bertema "${projectData.topik}".

=== KONTEKS ===
Judul Ebook: ${projectData.judul || projectData.topik}
Target Pembaca: ${projectData.target || 'umum'}
Level: ${taskConfig.fokusLevel || 'Basic'}

=== INSTRUKSI PEMBUATAN SOAL ===

**BAGIAN A — PILIHAN GANDA (10 soal)**
Format:
[Nomor]. [Pertanyaan]
A) [Pilihan A]
B) [Pilihan B]
C) [Pilihan C]
D) [Pilihan D]
✅ Jawaban: [Huruf] — [Penjelasan singkat kenapa jawaban ini benar]

**BAGIAN B — BENAR / SALAH (5 soal)**
Format:
[Nomor]. [Pernyataan]
Jawaban: [BENAR / SALAH] — [Alasan]

**BAGIAN C — ESAI PENDEK (3 soal)**
Format:
[Nomor]. [Pertanyaan terbuka yang mendalam]
💡 Panduan Jawaban: [Poin-poin yang harus ada dalam jawaban yang baik]

**BAGIAN D — STUDI KASUS (1 kasus)**
[Skenario nyata berkaitan dengan topik]
Pertanyaan studi kasus: [3 pertanyaan]

=== CATATAN ===
Soal harus mencakup: fakta/konsep (30%), aplikasi praktis (40%), analisis/sintesis (30%).
Tingkat kesulitan: mudah (3), sedang (5), sulit (2) untuk pilihan ganda.
`;
      break;

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
