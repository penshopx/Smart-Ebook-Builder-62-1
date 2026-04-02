# Chaesa AI Studio

## Overview

Chaesa AI Studio is an AI Prompt Generator Indonesia-first platform centered on the "Ekosistem Kompetensi Digital" concept. The ebook is Step 1 (foundation) where user competency is documented, then transferred to Chatbot AI, E-Course, Mini App, Document Generator, and other digital products. Full pipeline: Ebook+ → Publish → Distribusi → Sosmed → Konversi → Strategi+ → Iklan → Funnel → Ekosistem. 53 API routes, 21 generator features, 24 industry themes.

## Latest Features (April 2026)

### 3 New Generator Features
- **SOP Prosedur Generator** (`/api/generate-sop`, gpt-4o) — SOP profesional dari kompetensi ebook. 5 tipe: Prosedur Kerja, SOP Layanan Pelanggan, SOP Produksi, Panduan Onboarding, Kebijakan Perusahaan. Output: informasi dokumen, 4-6 prosedur detail, KPI tabel, penanganan masalah, riwayat perubahan. Button di Ekosistem row. Dialog dengan tipe selector + copy button.
- **LinkedIn Thought Leader Article** (`/api/generate-linkedin`, gpt-4o) — Artikel LinkedIn 700-900 kata untuk personal brand. 5 sudut artikel: Insight Profesional, Kisah Sukses Klien, Kontroversi & Pendapat, Tutorial Praktis, Tren Industri. Output: hook pembuka, isi utama, CTA, hashtag pack 15-20, versi pendek. Button di Sosmed row.
- **Membership Site Brief** (`/api/generate-membership`, gpt-4o) — Rancangan lengkap membership site. 5 model: Komunitas + Konten Eksklusif, Subscription Learning, Mastermind Group, SaaS + Coaching, Inner Circle Premium. Output: konsep membership, welcome copy, 3 paket harga, benefit tabel, 10 FAQ, copy promosi. Button di Funnel row.

### Ecosystem Progress Tracker
- New `EcosystemTracker` component (`client/src/components/ecosystem-tracker.tsx`) — localStorage-based checklist of 11 ecosystem steps (Ebook, Publish, Distribusi, Sosmed, Landing Page, Iklan, Chatbot AI, E-Course, Mini App, SOP/Dokumen, Membership Site). Shows progress bar and percentage. Collapsible. Added to home.tsx left column below the tabs.

### Brand & Concept Deepening
- Landing page: Competency Transfer visual (Ebook → 4 transfer products), new FAQ entries on Ekosistem Kompetensi
- Home subtitle: "Ekosistem Kompetensi Digital · Ebook → Chatbot · E-Course · Mini App"
- Chaesa chatbot: Updated welcome message, quick questions, and feature chips focused on competency ecosystem
- chaesa.ts: KONSEP INTI section, TIPS SUKSES rewritten with competency-first ordering

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local state
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Build Tool**: Vite with hot module replacement

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/`
- Feature components in `client/src/components/`
- Utility functions and hooks in `client/src/lib/` and `client/src/hooks/`

### Backend Architecture

- **Framework**: Express.js 5 with TypeScript
- **Runtime**: Node.js with tsx for TypeScript execution
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **Storage**: In-memory storage (via `server/storage.ts`) with PostgreSQL-ready Drizzle ORM schema

The server handles:
- Project CRUD operations
- Prompt history management
- Static file serving for production builds

### Data Layer

- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` contains shared types, constants, and Zod validation schemas
- **Validation**: Zod for runtime type validation on API requests

### Shared Code

The `shared/` directory contains code used by both frontend and backend:
- Type definitions for projects, tasks, and configurations
- Constants for dropdowns (languages, output formats, tones, writing styles, AI characters)
- Zod schemas for validation

### Build Process

- Development: Vite dev server with HMR proxied through Express
- Production: 
  - Client built with Vite to `dist/public/`
  - Server bundled with esbuild to `dist/index.cjs`
  - Common dependencies bundled to reduce cold start times

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations stored in `migrations/` directory
- **connect-pg-simple**: Session storage for Express sessions

### UI Framework
- **Radix UI**: Headless component primitives (accordion, dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component library using Radix + Tailwind
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundler for production
- **tsx**: TypeScript execution for development

### Key Libraries
- **TanStack React Query**: Data fetching and caching
- **React Hook Form + Zod**: Form handling and validation
- **date-fns**: Date utilities
- **embla-carousel-react**: Carousel functionality
- **vaul**: Drawer component

### Authentication
- **Replit Auth**: OpenID Connect authentication via Replit
- User sessions stored in PostgreSQL via connect-pg-simple
- Protected routes use `isAuthenticated` middleware

### Future Enhancements (TODO)
- **Payment/Monetization**: Stripe integration was declined by user. If payment features are needed in the future, user will need to setup Stripe connector or provide API keys manually.

## 6 New Feature Expansion (Sosmed + Strategi+ + Iklan Rows)

### Sosmed Row — Expanded to 4 buttons
- **IG Caption Pack** (`/api/generate-ig-caption`, gpt-4o) — Generate 5/7/10 caption Instagram per topik: per caption ada hook stop-scroll, body, CTA spesifik, hashtag set 15-20, best time to post. Dialog: tone selector (casual/profesional/motivational/edukasi/humor), jumlah toggle, brand name input, generate button + copy all.
- **Reels/TikTok Hook Generator** (`/api/generate-reel-hook`, gpt-4o) — Generate 10/15/20 hook video Reels & TikTok, dikelompokkan per 5 pola: Pattern Interrupt, Curiosity Gap, Controversy, Story, Data/Angka. Per hook: visual opening 0-1s, dialog 1-3s, text overlay, audio vibe, potensi viral ⭐1-5. Bonus caption+hashtag untuk 1 reel terbaik.

### Strategi+ Row — Expanded to 4 buttons
- **Pricing Ladder & Offer Stack** (`/api/generate-pricing-ladder`, gpt-4o) — Value ladder 5 tier lengkap: Lead Magnet (gratis) → Tripwire (47-97k) → Core Product → Upsell OTO → Continuity membership. Per tier: nama, harga, deliverables, positioning statement, urgency trigger. Revenue projection table 100 buyers/bulan + copywriting per tier + tips implementasi Indonesia.
- **Launch Checklist D-30** (`/api/generate-launch-checklist`, gpt-4o) — Timeline launch 30 hari: D-30 s/d D-21 (persiapan), D-20 s/d D-8 (warm-up), D-7 s/d D-2 (countdown harian), D-1 (final prep), D-0 (jam per jam launch day), D+1 s/d D+7 (post-launch). Bonus: 3 template WA broadcast siap kirim + 5 stories sequence IG + KPI metrics. Channel selector: WA+IG, WA+Email, Semua Platform.

### Iklan Row — Expanded to 5 buttons
- **TikTok Ads Script** (`/api/generate-tiktok-ads`, gpt-4o) — 3 variasi script video ads TikTok (15s/30s/60s): Pain Angle + Story Angle + Social Proof Angle. Per script: Hook 0-3s (visual + dialog + text overlay), Problem, Solution+Proof, CTA. Plus musik, hashtag TikTok 10, budget suggestion, targeting tips, A/B test plan.
- **Google Search Ads RSA** (`/api/generate-google-ads`, gpt-4o) — Responsive Search Ads lengkap: keyword strategy (primary+secondary+negative), 15 headlines ≤30 karakter (3 kelompok: Brand/Benefit/CTA), 4 descriptions ≤90 karakter, sitelink extensions, callout extensions, structured snippets, bidding strategy, landing page optimization checklist 10 poin.

## Export Proteksi & Publish / Baca Online Features

### New "Publish:" Row (added between Ebook+ and Distribusi rows)
- **Baca Online / Ebook Reader** (client-side) — Generates a full self-contained HTML reader with: progress bar, sticky navbar, collapsible TOC sidebar, cover page with gradient + stats (bab count, word count, read time), chapter articles with BAB badge + word/read-time stats, light/dark themes, smooth scroll. Download as .html file. Button triggers dialog with full-screen iframe preview + theme toggle + refresh + download.
- **Export Terproteksi / PDF+Lock** (client-side jsPDF) — Exports ebook PDF with: dark cover page with indigo accent bar, owner/brand name, anti-copy legal notice (UU No.28/2014), "RAHASIA" red stamp (optional), diagonal transparent watermarks on every content page, branded footer. Dialog has: owner name input, watermark text input, 3 toggle checkboxes (watermark / hak cipta / rahasia label).
- All state vars declared: `ebProtectionOpen`, `ebWatermarkEnabled`, `ebWatermarkText`, `ebOwnerName`, `ebAntiCopyEnabled`, `ebConfidentialEnabled`, `ebProtectionLoading`, `ebPublishOpen`, `ebPublishHtml`, `ebPublishTheme`.
- `addWatermark(doc, pageW, pageH, text)` helper function uses `setGState` with opacity 0.08 for subtle diagonal watermarks.

## Ebook Builder Features (Latest — buatebook.com inspired)

### 3 New Core Ebook Building Features (Ebook+ row)
- **Ebook Outline & TOC Generator** (`/api/generate-ebook-outline`, gpt-4o) — Struktur ebook lengkap: Metadata (judul/sub-judul/tagline/USP/estimasi halaman), Pendahuluan/Sinopsis, Daftar Isi (pilih 5-15 bab) per-bab dengan sub-bab berindentasi + Key Takeaway, Tabel Ringkasan Struktur, Chapter Summary 1-paragraf per-bab, Kata Kunci per-bab.
- **Chapter Builder** (`/api/generate-chapter`, gpt-4o) — Build ebook bab per bab: sidebar daftar bab (klik untuk switch), input judul + sub-topik per bab, pilih gaya tulisan (5 tone), generate per bab secara individual, edit langsung di textarea, salin per-bab atau semua bab sekaligus. State tersimpan selama session.
- **Layout Preview / Visual Template** (`/api/generate-ebook-template`, no-AI HTML generation) — Preview visual ebook dengan 5 tema: Professional (navy blue), Modern (violet), Warm (amber), Bold Dark (dark slate), Minimal (green). Color picker untuk accent color custom. Output: HTML lengkap dengan cover page, daftar isi visual, chapter cards. Download HTML atau salin ke clipboard.
- Interface `ChapterItem` defined outside component to avoid React hooks issue.
- `BookOpen` icon used (lucide-react compatible, `Book` not available).
- Inspired by: buatebook.com — Chapter-by-chapter builder, layout visual, export PDF siap jual

## Konversi & Strategi Pipeline Features (tauheed.id/cuan Bab 4 & 3)

### 3 New Pipeline Outputs Added (Konversi & Strategi+ rows)
- **LP Section Kit** (`/api/generate-lp-section-kit`, gpt-4o) — 6 section individual LP yang bisa di-generate terpisah: Headline Pack (10 pasang headline+sub), Problems & Agitation, Social Proof Templates (5 format), Bonus Stack Copy, CTA Pack (button text/headline/supporting/micro-commitment/sticky bar), FAQ Section (12 Q&A). UI: 6 mini-buttons di row "Konversi:", dialog dengan tab switching.
- **Sales Funnel Blueprint** (`/api/generate-funnel-blueprint`, gpt-4o) — Peta lengkap 7-tahap funnel: Traffic (Meta Ads) → LP → Thank You/OTO → WA Closing → Delivery & Onboarding → Upsell/Cross-sell → Re-Engagement. Termasuk budget plan, tools stack, key metrics, common mistakes.
- **Headline Power Pack** (`/api/generate-headline-pack`, gpt-4o) — 40+ headline variations: 8 pain, 8 aspiration, 6 curiosity, 6 numbers, 4 social proof, 4 contrarian, 4 fear + 8 email subject + 6 thumbnail. Input niche opsional.

## Iklan Pipeline Features (tauheed.id/cuan inspired)

### 3 New Pipeline Outputs Added (Iklan Row)
- **Meta Ads Copy Pack** (`/api/generate-meta-ads`, gpt-4o) — Full FB/IG ads pack: 5 Hook Variations, Primary Text Short (100-150w), Primary Text Long (250-350w), 5 Headline Variations, Link Description, Video Hook 15s Script, Audience Targeting Suggestions, Split Test Matrix (3 angles), Catatan Strategis. Input pain point opsional.
- **WA Closing Script** (`/api/generate-wa-closing`, gpt-4o) — Script CS WhatsApp lengkap: Opening (3 variasi), Follow-up Sequence 5 pesan (H+1 s/d H+7), Handling 8 Objections, 5 Closing Techniques, Post-Purchase Upsell Script, Broadcast Template (2 variasi), Catatan Closing. Input garansi opsional.
- **Scarcity & Batch Pricing Pack** (`/api/generate-scarcity-pack`, gpt-4o) — Copy urgency & scarcity: Batch Pricing Announcement (3 variasi), Countdown Copy (pendek/sedang/panjang), Scarcity Copy Slot Terbatas, Harga Naik Notification (5 template WA+Email), Last Call 24 Jam, Social Proof+Scarcity Combo, Batch Closing Announcement, Reopening Waitlist, Psikologi Copy Notes. Input batch number + next batch price.
- UI: "Iklan" label row baru di pipeline buttons (di atas Funnel row), blue/green/orange gradient buttons
- Inspired by: tauheed.id/cuan — Bab 6 CS Jago Closing, Bab 8 Ads Creative, Bab 10 Scale Iklan

## New Funnel Pipeline Features

### 3 New Pipeline Outputs Added (Funnel Row)
- **VSL Script Generator** (`/api/generate-vsl`, gpt-4o) — Video Sales Letter 10-section: Hook (0-15s) → Masalah → Agitasi → Kisah/Kredensial → Solusi → Apa yang Didapat → Bukti & Testimoni → Penawaran Eksklusif → Garansi → Urgensi → CTA Final + Catatan Produksi. Isi input garansi opsional.
- **Email Drip Sequence** (`/api/generate-email-sequence`, gpt-4o) — 7-email nurturing sequence: Welcome → Story → Content Value → Social Proof → The Offer → Objection Handler → Last Chance. Setiap email ada 3 pilihan subject line + preview text + body copy.
- **Content Calendar 30 Hari** (`/api/generate-content-calendar`, gpt-4o) — Kalender konten 30 hari 4 minggu: Awareness → Education → Social Proof → Launch. Input platform fleksibel (Instagram, TikTok, LinkedIn, dll). Setiap hari ada format, hook, caption, CTA, hashtag.
- UI: "Funnel" label row baru antara baris "Bisnis" dan "Ekosistem" di pipeline buttons
- Landing page: Section "Kisah Sukses Founder" (VSL-style) ditambahkan dari transcript video Mas Harley

## Smart Integration System (Latest)

### Ecosystem Hub
- **Ecosystem Hub Dialog** — Pusat kontrol integrasi 4 quadrant: Content Core, Monetization Engine, Sales Funnel, Engagement Layer
- **Integration Score** (0-100) — Otomatis dihitung: docContent=15, syllabusContent=10, monoContent=15, lpContent=20, mktContent=15, chatMessages>0=10, lpPrice+monoContent=5, mockupImages+lpContent=5, quizContent+syllabusContent=5
- **Data Connection Map** — 8 koneksi aktif ditampilkan: Monetisasi→LP, LP→Chatbot, E-Course→Bonus LP, dll.
- **Next Step Recommendations** — Auto-saran langkah berikutnya berdasarkan state pipeline

### Smart Integration Helpers (in prompt-output.tsx)
- `extractMonetizationPrice()` — Parses monoContent for "PAKET STANDAR — Rp X" pattern
- `getSmartBonuses()` — Suggests bonuses from syllabusContent/quizContent/podcastContent/audiobookContent/mockupImages/mktContent/coverTplContent
- `getLpSummary()` — Returns price|CTA|bonuses summary for chatbot
- `integrationScore` — 0-100 computed metric shown in pipeline progress bar

### LP Config Auto-Sync
- Smart auto-detect price from monoContent → "Terapkan" button
- Smart bonus suggestions from generated outputs → "Isi Otomatis" button  
- 7 data source badges (Konten Ebook, Silabus, Monetisasi, Mockup 3D, Penulis, Kuis, Podcast)

### Chatbot LP-Aware
- System prompt includes: lpContent, lpPrice, lpCTA, lpBonuses
- Greeting shows detected price from Monetisasi or lpPrice
- Data sources list includes "landing page & info beli"
- 6 data source badges in system prompt

### Marketing Kit Auto-Price
- Price auto-detected from lpPrice || monoContent PAKET STANDAR pattern
- authorName and bonuses passed to `/api/generate-marketing-kit`
- Backend uses price/authorName/bonuses in all 7 marketing sections

## Distribusi & Monetisasi Pipeline (Latest — from Akademi Profit analysis)

### 3 New Pipeline Outputs Added (Distribusi Row)
- **Platform Listing Pack** (`/api/generate-platform-listing`, gpt-4o) — Deskripsi produk siap upload ke semua platform: Tokopedia/Shopee (SEO description 500-800 kata + tag 20 keyword + kategori), Gumroad (English 300-400 words + short pitch), WA Catalog (max 500 karakter + CTA), Telegram Channel Post (emoji + informal), Bio Link CTA (max 150 karakter), Instagram Hashtag Pack (30 hashtag), TikTok Hashtag (5 hashtag trending).
- **Reseller & Afiliasi Kit** (`/api/generate-reseller-kit`, gpt-4o) — Sistem reseller lengkap: Struktur Komisi 3 Tier (Biasa/Silver/Gold dengan kalkulasi penghasilan nyata), Pitch Rekrut Reseller (versi WA + IG caption), Welcome Kit Reseller Baru (template WA siap kirim), Script Closing 5 Objeksi (Mahal/Ntar aja/Beda sama gratis/Cara download/Jaminan), Materi Promosi Siap Pakai (3 caption berbeda), Tabel Kalkulasi Passive Income (5/10/20/50 ebook/bulan).
- **Content Repurposing Pack** (`/api/generate-content-repurposing`, gpt-4o) — 1 Ebook → 6 Format: Instagram Carousel 10 Slide (hook+isi+CTA+caption), Twitter/X Thread 10 Tweet (viral-ready), LinkedIn Artikel (judul+intro+3 poin+CTA), Email Newsletter (subject line+preview+body 300-400 kata), Podcast/Video Outline (15-20 menit dengan segmen), Infografik Deskripsi Visual (layout+data points). Contextualizes dengan outline/chapter content yang sudah digenerate.
- UI: "Distribusi:" label row baru (orange/yellow/cyan gradient) ditempatkan antara Ebook+ row dan Konversi row

### Also Added (From buatebook.com analysis - previous session):
- **Perpanjang Isi Bab** (`/api/expand-chapter`) — Di dalam Chapter Builder per-bab: toolbar biru dengan selector kata (100/150/200/300/500) + button "+ Perpanjang Bab" → AI menambah konten lanjutan yang natural
- **Custom Upgrade Bab** (`/api/regenerate-chapter-custom`) — Di dalam Chapter Builder per-bab: toolbar ungu dengan 6 toggle pill (☑ Poin Bullet / 📊 Tabel / 📈 Data/Statistik / 💼 Contoh Kasus / 💡 Tips Praktis / ❓ FAQ Mini) → AI regenerate bab dengan elemen terpilih
- **Stok Gambar Gratis** (`/api/search-images` → Openverse CC API) — Dialog teal dengan grid 12 gambar 4 kolom, hover overlay (Salin URL + buka), pagination, saran keyword otomatis dari topik ebook, lisensi badge. No API key required.

## Application Features

### 11 Generation Modes
1. **Brainstorm Ide** - Generate creative ebook ideas
2. **Big Idea** - Sharpen positioning and unique concept
3. **Outline** - Create comprehensive table of contents
4. **Draft Bab** - Write chapter content section by section
5. **Video Script** - Create video/podcast scripts
6. **E-Course Builder** - Transform ebook into course curriculum
7. **Document Generator** - Create SOP, Policy, and other documents
8. **Prompt Pack** - Generate workflow prompt sequences
9. **GPT Builder** - Create chatbot system prompts
10. **Marketing Kit** - Create marketing and promotional materials
11. **Extend Text** - Expand/develop short text
12. **AI Quality Review** - Score generated ebook on 5 dimensions (Struktur, Kedalaman, Keterbacaan, Kelengkapan, Nilai Jual) with actionable improvement suggestions
13. **Text-to-Speech** - Convert Script Narasi to MP3 audio using OpenAI TTS (voices: Nova, Shimmer, Alloy, Echo, Onyx); audio player with play/pause + download in Script dialog
14. **Monetization Strategy** - `/api/generate-monetization` SSE: generates 5-tab strategy (Pricing tiers, Selling Platforms, Buyer Persona, 30-day Launch Plan, Upsell Ecosystem); green "Strategi Jual" button in Bisnis row
15. **Mode Akurat Badge** - Shows "Mode Akurat · N sumber" badge in action bar when reference files are uploaded, signaling AI is grounded in user's source documents

### Plan & Auth System
- **3 Tiers**: Free (5 prompt/day, 3 modes, TXT only), Pro (unlimited, 13 modes, all exports), Enterprise (Pro + team/API)
- **DB columns**: `plan`, `prompts_used_today`, `last_prompt_date` on `users` table
- **Plan limits defined in**: `shared/models/auth.ts` — `PLAN_LIMITS`
- **Auth routes** in `server/replit_integrations/auth/routes.ts`: `/api/auth/user`, `/api/user/plan`, `/api/user/track-prompt`, `/api/user/upgrade-request`, `/api/admin/set-plan`
- **Upgrade flow**: manual — user clicks upgrade → WhatsApp/email contact info returned; admin sets plan via `/api/admin/set-plan`

### Key Screens
- **Landing Page** (`/`) - Marketing page for unauthenticated users with pricing tiers, 9-step ecosystem, 13 modes grid
- **App Home** (`/`) - Main application for authenticated users with prompt generation tools; profile dropdown shows plan badge + daily usage + link to /account
- **Account Page** (`/account`) - Profile card, usage progress bar, 3-tier pricing cards, feature grid, upgrade dialog with WhatsApp/email flow
- Project saving/loading functionality
- Copy prompts to clipboard
- Direct link to DokumenTender AI for execution