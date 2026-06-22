# AppForge — AI App Generator

> **Full Stack Engineer · Track A Demo Task Submission**
> Built for The AI Signal Internship Assessment

AppForge is a metadata-driven application runtime that converts AI-generated JSON configuration into fully working applications — with dynamic UI, CRUD APIs, and a PostgreSQL backend.

---

## 🚀 Live Demo

**[appforge.vercel.app](https://appforge.vercel.app)** _(deploy link after submission)_

---

## 🎯 What It Does

1. **Describe your app** in plain English
2. **AI generates** a complete JSON config (models, pages, components, fields)
3. **AppForge renders** a live working app with forms, tables, dashboards
4. **Full CRUD** — create, read, update, delete records via dynamically generated APIs
5. **Bonus features** — CSV import, GitHub export, multi-auth (Google + GitHub)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      AppForge                           │
│                                                         │
│  ┌──────────────┐    ┌────────────────────────────────┐ │
│  │  AI Generator│    │    Config Validator             │ │
│  │  (Claude API)│───▶│    - Sanitizes bad configs      │ │
│  └──────────────┘    │    - Graceful unknown types      │ │
│                      │    - Cross-reference checks      │ │
│                      └──────────────┬───────────────────┘ │
│                                     │                   │
│  ┌──────────────────────────────────▼───────────────────┐ │
│  │              Component Renderer                       │ │
│  │  table │ form │ dashboard │ kanban │ chart │ unknown  │ │
│  └──────────────────────────────────┬───────────────────┘ │
│                                     │                   │
│  ┌──────────────────────────────────▼───────────────────┐ │
│  │           Dynamic API Runtime                         │ │
│  │  /api/apps/[id]/records → CRUD any model              │ │
│  │  Validation per model schema from config              │ │
│  └──────────────────────────────────┬───────────────────┘ │
│                                     │                   │
│  ┌──────────────────────────────────▼───────────────────┐ │
│  │              PostgreSQL (Neon)                        │ │
│  │  App config as JSON + AppRecord per model entry       │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 18, TypeScript, TailwindCSS |
| Backend | Next.js API Routes, TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | NextAuth.js v5 (Google + GitHub OAuth) |
| AI | Anthropic Claude API (claude-3-5-sonnet) |
| Deploy | Vercel + Neon |

---

## ✅ Features Implemented

### Core (Required)
- [x] AI-powered JSON config generation from natural language
- [x] Config validator that handles missing fields, invalid types, unknown components
- [x] Dynamic form renderer (text, number, email, select, boolean, date, image, JSON...)
- [x] Dynamic table renderer with search, pagination, inline edit/delete
- [x] Dynamic dashboard with auto stat widgets
- [x] Full CRUD API with per-model validation
- [x] Graceful error handling — broken configs never crash the app
- [x] Authentication (user-scoped apps and data)

### Bonus Features (3 of 5 required)
- [x] **CSV Import** — upload CSV data directly into any model
- [x] **GitHub Export** — generates README, Prisma schema, env example
- [x] **Multi-auth login** — Google OAuth + GitHub OAuth via NextAuth

---

## 🔧 Local Setup

```bash
# 1. Clone
git clone https://github.com/yourusername/appforge
cd appforge

# 2. Install
npm install

# 3. Environment
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, OAuth keys, ANTHROPIC_API_KEY

# 4. Database
npx prisma db push
npx prisma generate

# 5. Run
npm run dev
# → http://localhost:3000
```

---

## 🧠 Key Design Decisions

### Config-driven architecture
Every app is stored as a JSON config in PostgreSQL. The runtime reads this config and renders the appropriate UI + APIs. This means:
- Zero migrations needed for new app types
- Apps are portable and exportable
- Config changes = instant UI updates

### Graceful degradation
The config validator (`src/lib/config-validator.ts`) handles:
- Missing required fields → defaults
- Unknown field types → renders as text with warning
- Unknown component types → shows warning banner, doesn't crash
- Invalid JSON → caught and reported
- Schema mismatches → extra fields tolerated

### Single flexible data table
Instead of creating separate DB tables per model (which would require dynamic migrations), all records go into `AppRecord` with a `modelName` discriminator and a `Json` data field. This trades some query flexibility for zero-migration scalability.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── apps/              # CRUD for apps
│   │   │   └── [appId]/
│   │   │       ├── records/   # Dynamic CRUD
│   │   │       ├── import/    # CSV import
│   │   │       └── export/    # GitHub export
│   │   └── generate/          # AI config generation
│   ├── apps/[appId]/          # Runtime app renderer
│   │   ├── pages/[pageName]/  # Dynamic page renderer
│   │   └── settings/
│   ├── builder/               # AI prompt interface
│   ├── dashboard/             # App list
│   └── auth/signin/
├── components/renderer/
│   ├── ComponentRenderer.tsx  # Routes to right renderer
│   ├── DynamicForm.tsx        # Field-level form renderer
│   ├── DynamicTable.tsx       # CRUD table renderer
│   ├── DynamicDashboard.tsx   # Stat widget renderer
│   └── FieldRenderer.tsx      # Individual field types
├── lib/
│   ├── config-validator.ts    # Sanitizes broken configs
│   ├── ai-generator.ts        # Claude API integration
│   ├── auth.ts                # NextAuth setup
│   └── prisma.ts              # DB client singleton
└── types/
    └── config.ts              # Full TypeScript type system
```

---

## 🎥 Loom Video

[Watch walkthrough](https://loom.com/...) _(5-10 min explaining architecture, decisions, tradeoffs)_

---

## 📤 Submission

Submitted via: https://forms.gle/6fL3sR5shCewJE4x7

- Live URL: [appforge.vercel.app](https://appforge.vercel.app)
- GitHub: [github.com/yourusername/appforge](https://github.com/yourusername/appforge)
- Loom: [loom.com/...](https://loom.com/...)
