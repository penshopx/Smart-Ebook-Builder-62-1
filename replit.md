# Chaesa AI Studio

## Overview

Chaesa AI Studio is an Indonesia-first AI Prompt Generator platform focused on the "Ekosistem Kompetensi Digital" concept. It facilitates the transfer of user competency from an ebook foundation to various digital products like Chatbot AI, E-Course, Mini Apps, and Document Generators. The project aims to provide a comprehensive pipeline from content creation (Ebook+) through publishing, distribution, social media engagement, conversion, and advanced strategies to advertising and funnel management, ultimately building a robust digital ecosystem. The platform features 53 API routes, 21 generator features, and 24 industry themes to support a wide range of digital product development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18 and TypeScript, utilizing Wouter for routing and TanStack React Query for server state management. Styling is handled by Tailwind CSS with CSS variables for theming, supporting both light and dark modes. UI components are sourced from shadcn/ui, which is built on Radix UI primitives. Vite serves as the build tool, offering hot module replacement. The architecture is component-based, organizing pages, reusable UI, feature components, and utility functions into distinct directories.

### Backend Architecture

The backend is developed using Express.js 5 with TypeScript, running on Node.js with `tsx` for TypeScript execution. It follows a RESTful API pattern under the `/api/` prefix. Data persistence is managed via PostgreSQL using Drizzle ORM, replacing an earlier in-memory storage system. The server handles project CRUD operations, prompt history management, and static file serving.

### Data Layer

Drizzle ORM is used for PostgreSQL database interactions. Shared types, constants, and Zod validation schemas are defined in the `shared/schema.ts` file, and Zod is employed for runtime type validation of API requests.

### Shared Code

A `shared/` directory contains code common to both frontend and backend, including type definitions, constants for various dropdowns (languages, output formats, tones, writing styles, AI characters), and Zod schemas for validation.

### Core Features and System Design

Chaesa AI Studio provides 11 primary generation modes, including tools for brainstorming ideas, outlining, drafting chapters, generating video scripts, e-course creation, document generation (SOP, policies), prompt packs, GPT builder system prompts, marketing kits, text expansion, AI quality review, text-to-speech, and monetization strategy generation.

A plan enforcement system differentiates between Free, Pro, and Enterprise tiers, with varying limits on daily prompts, project counts, and available modes. API routes enforce these limits and handle upgrade requests. The frontend integrates plan information, showing locked features and prompting upgrades when limits are hit.

The platform includes an "Ecosystem Progress Tracker" to monitor completion of 11 key steps (Ebook, Publish, Distribusi, Sosmed, Landing Page, Iklan, Chatbot AI, E-Course, Mini App, SOP/Dokumen, Membership Site), enhancing user engagement and guiding their journey.

Key features also include:
- **SOP Prosedur Generator**: Generates professional SOPs with 5 types.
- **LinkedIn Thought Leader Article**: Creates 700-900 word LinkedIn articles with 5 angles.
- **Membership Site Brief**: Designs comprehensive membership site plans with 5 models.
- **Ebook Builder**: Tools for outlining, chapter building, and layout preview with 5 visual themes.
- **LP Section Kit**: Generates 6 individual landing page sections.
- **Sales Funnel Blueprint**: Creates a 7-stage funnel map.
- **Headline Power Pack**: Generates over 40 headline variations.
- **Meta Ads Copy Pack**: Produces full Facebook/Instagram ad packs.
- **WA Closing Script**: Provides comprehensive WhatsApp CS scripts.
- **Scarcity & Batch Pricing Pack**: Generates urgency and scarcity copy.
- **VSL Script Generator**: Creates 10-section Video Sales Letter scripts.
- **Email Drip Sequence**: Generates 7-email nurturing sequences.
- **Content Calendar 30 Hari**: Produces a 30-day content calendar.
- **Platform Listing Pack**: Creates product descriptions for various platforms.
- **Reseller & Afiliasi Kit**: Provides a complete reseller system.
- **Content Repurposing Pack**: Transforms ebook content into 6 different formats.
- **Smart Integration System**: An "Ecosystem Hub" calculates an "Integration Score" and provides "Next Step Recommendations" based on pipeline status. This includes smart auto-detection and auto-sync features for price and bonuses from generated content.
- **Export and Publish Features**: Enables "Baca Online / Ebook Reader" for client-side HTML previews and "Export Terproteksi / PDF+Lock" for secure PDF exports with watermarks and legal notices.

### UI/UX Decisions

The application emphasizes a clear, intuitive user interface with a focus on ease of use. It uses shadcn/ui and Radix UI for consistent, accessible components. The design incorporates theming (light/dark mode) and visual cues like progress bars and badges to enhance user experience. The landing page and account pages are designed to clearly communicate features, pricing, and user progress.

## External Dependencies

### Database
- **PostgreSQL**: The primary database, requiring a `DATABASE_URL` environment variable.
- **Drizzle Kit**: Used for database migrations, stored in the `migrations/` directory.
- **connect-pg-simple**: Manages session storage for Express.

### UI Framework
- **Radix UI**: Provides headless component primitives.
- **shadcn/ui**: A pre-styled component library built on Radix UI and Tailwind CSS.
- **Lucide React**: An icon library.

### Build & Development
- **Vite**: Frontend build tool and development server.
- **esbuild**: Server bundler for production.
- **tsx**: Used for TypeScript execution during development.

### Key Libraries
- **TanStack React Query**: For data fetching and caching.
- **React Hook Form + Zod**: For form handling and validation.
- **date-fns**: A utility library for date manipulation.
- **embla-carousel-react**: For carousel functionality.
- **vaul**: For drawer components.

### Authentication
- **Replit Auth**: Utilizes OpenID Connect authentication provided by Replit.
- User sessions are stored in PostgreSQL via `connect-pg-simple`.
- `isAuthenticated` middleware protects routes.

### AI Model Integration
- **GPT-4o**: Used for various content generation features.
- **OpenAI TTS**: For text-to-speech functionality.

### Other Integrations
- **Openverse CC API**: For searching free stock images.