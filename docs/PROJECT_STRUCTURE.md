# Struktur Project CineArchive

## Overview
CineArchive adalah platform kearsipan film siswa dengan arsitektur monorepo yang terdiri dari Backend (Fastify) dan Frontend (Vue 3).

## Struktur Folder

```
.
├── backend/                    # Backend API (Fastify + MySQL)
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Objection.js models
│   │   ├── routes/             # API routes
│   │   ├── middlewares/        # Auth & validation
│   │   ├── lib/                # Utilities (auth, ai, upload)
│   │   └── database/           # Migrations & seeds
│   ├── scripts/                # Utility scripts
│   ├── tests/                  # API tests
│   └── uploads/                # File storage
│
├── frontend/                   # Frontend (Vue 3 + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application views
│   │   ├── composables/        # Shared state & logic
│   │   └── lib/                # Utilities (API wrapper)
│   └── public/                 # Static assets
│
└── docs/                       # Documentation
    ├── PROJECT_STRUCTURE.md    # This file
    ├── API_REFERENCE.md        # API documentation
    ├── DATABASE.md             # Database schema
    └── DEVELOPMENT.md          # Development guide
```

## Tech Stack

### Backend
- Fastify (Web framework)
- Objection.js + Knex (ORM)
- MySQL (Database)
- Better Auth (Authentication)
- Tus.io (Resumable file upload)

### Frontend
- Vue 3 (Composition API)
- Vite (Build tool)
- Tailwind CSS v4 (Styling)
- shadcn/ui Vue (UI components)
- Tus-js-client (Resumable upload client)

## Key Features

1. **Resumable Upload**: Menggunakan Tus.io protocol untuk upload file yang dapat dilanjutkan
2. **Draft System**: Auto-save form data ke localStorage saat upload berlangsung
3. **Role-Based Access**: User, Creator, Moderator, Admin
4. **Hybrid Streaming**: Support YouTube embed dan direct video upload
5. **Discussion System**: Nested comments dengan max 5 level depth
6. **Voting System**: Trending films berdasarkan periode
7. **AI Chat**: Rekomendasi film menggunakan AI (Groq/OpenAI/Gemini)

## File Upload Flow

1. User memilih file di form
2. Frontend menggunakan tus-js-client untuk upload ke `/api/files/`
3. Backend (Tus server) menyimpan file ke `/uploads/` dengan resume capability
4. Frontend menyimpan URL file ke form state
5. Form data disimpan ke draft (localStorage) secara otomatis
6. Saat submit, semua data dikirim ke `/api/films`

## Development Workflow

1. Setup backend: `cd backend && npm install && npm run migrate && npm run dev`
2. Setup frontend: `cd frontend && pnpm install && pnpm dev`
3. Access: Frontend di `http://localhost:5173`, Backend di `http://localhost:3000`
