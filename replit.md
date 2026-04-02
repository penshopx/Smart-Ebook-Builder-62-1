# Ebook Builder Pro

## Overview

Ebook Builder Pro is an AI prompt generator application designed to help content creators build professional ebook ecosystems. The application generates structured prompts for various content creation tasks including brainstorming, outlining, chapter drafting, video scripts, course creation, and marketing materials. It supports multiple output formats, tones, writing styles, and AI character modes (including an "Agentic Strategist" mode for proactive AI behavior).

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