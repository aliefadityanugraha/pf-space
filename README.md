# PF Space

Platform kearsipan film siswa untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik. Menggunakan arsitektur Monorepo yang terdiri dari Frontend (Vue 3) dan Backend (Fastify).

## Tech Stack

### Frontend (`frontend/`)

- **Framework:** Vue 3 (Composition API `<script setup>`)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Brutal Design System)
- **UI Components:** shadcn/ui Vue (Radix Vue)
- **Icons:** Lucide Vue
- **Routing:** Vue Router
- **SEO:** Unhead

### Backend (`backend/`)

- **Framework:** Fastify
- **Language:** JavaScript (ESM, Node.js)
- **Database:** MySQL
- **ORM/Query Builder:** Objection.js & Knex
- **Authentication:** Better Auth (Email/Password + Google OAuth)
- **File Handling:** Tus.io (Resumable Uploads)
- **Validation:** Zod (Centralized Schema Validation)
- **AI Provider:** Groq / OpenAI / Gemini (pluggable)
- **Static Serving:** @fastify/static

## Project Structure

```
.
├── backend/                # Server-side code (API)
│   ├── src/
│   │   ├── controllers/    # Request handlers (18 controllers)
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models (Objection.js)
│   │   ├── routes/         # API routes definition (21 route files)
│   │   ├── middlewares/    # Auth, validation (Zod)
│   │   ├── lib/            # Utilities (auth, AI, upload, sanitize)
│   │   └── database/       # Migrations & Seeds
│   ├── scripts/            # Utility scripts (make-admin, etc.)
│   └── uploads/            # Uploaded files (gitignored)
│
├── frontend/               # Client-side code (Vue 3)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page views
│   │   ├── composables/    # Shared logic
│   │   └── lib/            # Utilities
│   └── ...
│
├── deploy/                 # Deployment scripts & configs
│   ├── setup.sh            # Server setup (one-time)
│   ├── deploy.sh           # Deploy/update script
│   ├── pf-space.nginx.conf # Nginx config template
│   └── DEPLOYMENT_GUIDE.md # Deployment documentation
│
└── docs/                   # Project documentation
```

## Features

- **Authentication & Authorization**: Login, Register, dan RBAC (User, Creator, Moderator, Admin) dengan Google OAuth.
- **Film Management**: Upload, review, approve/reject workflow dengan status `pending → published/rejected`.
- **Film Evaluation System**: Penilaian karya oleh Kurator/Moderator (Naskah, Sinematografi, Editing, Produksi) dengan feedback mendetail.
- **Study Mode**: Mode split-screen untuk menonton film sambil meninjau dokumen (Naskah, Storyboard, RAB).
- **Study Notes**: Catatan pribadi pengguna saat menonton dalam Study Mode.
- **Film Scenes**: Struktur adegan/breakdown film untuk analisis sinematografi.
- **Hybrid Film Source**: Dukungan YouTube Embed & Direct Upload.
- **Resumable Upload**: Upload file besar dengan protokol Tus.io (hingga 1 GB).
- **Discussion System**: Threaded comments dengan Adjacency List (maks. 5 level kedalaman).
- **Voting & Collection**: Sistem voting trending (per minggu/bulan/all) dan koleksi/bookmark pribadi.
- **Community Forum**: Diskusi topik aktif dengan sistem balasan.
- **Notification System**: Notifikasi real-time untuk komentar, balasan, evaluasi, dll.
- **AI Chat**: Integrasi AI asisten berbasis kontext arsip film (Groq/OpenAI/Gemini).
- **Content Reports**: Pelaporan konten dan antrian moderasi admin.
- **Settings Management**: Pengaturan aplikasi yang dapat dikonfigurasi admin.
- **Learning Materials**: Materi pembelajaran yang dikelola kurator/moderator.
- **Admin Dashboard**: Backup/restore database, audit log, statistik sistem.
- **Security**: CSP header, X-Request-ID tracing, rate limiting per-route.

## Getting Started

### 1. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Konfigurasi DB_NAME, DB_USER, DB_PASS, BETTER_AUTH_SECRET
npm run migrate
npm run seed
npm run dev
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Set Admin Pertama

```bash
cd backend
node scripts/make-admin.js email@example.com
```

## Development Status

- [x] **Backend API**: Fastify + MySQL integration.
- [x] **Frontend UI**: Vue 3 + Brutal Design.
- [x] **Authentication**: Better Auth (Email/Password + Google OAuth).
- [x] **Film Evaluation**: Complete with curator feedback & notifications.
- [x] **Study Mode**: Advanced video player with document integration.
- [x] **Study Notes**: In-player note-taking for study mode.
- [x] **Film Scenes**: Scene breakdown & structure management.
- [x] **Media Handling**: Tus.io resumable upload.
- [x] **Learning Materials**: Managed list-view for curated resources.
- [x] **Community Forum**: Topic-based discussion with replies.
- [x] **Notifications**: Event-driven notification system.
- [x] **Content Reports**: Report & moderation queue.
- [x] **Settings**: Admin-configurable application settings.
- [x] **Backend Optimization**: N+1 query fixes, static imports, async I/O, Fisher-Yates shuffle, Recursive CTE.
- [x] **Bahasa Indonesia Messages**: Semua pesan error & sukses konsisten dalam Bahasa Indonesia.

## 📚 Documentation

Dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

| Dokumen | Deskripsi |
| --- | --- |
| [API Reference](./docs/API_REFERENCE.md) | Dokumentasi lengkap API endpoints |
| [API Standards](./docs/API_STANDARDS.md) | Standar format response API |
| [Database Schema](./docs/DATABASE.md) | Schema database dan relasi |
| [Upload System](./docs/UPLOAD_SYSTEM.md) | Sistem upload resumable & draft |
| [Development Guide](./docs/DEVELOPMENT.md) | Panduan setup dan development |
| [Deployment Guide](./deploy/DEPLOYMENT_GUIDE.md) | Panduan deploy ke server production |
| [Roadmap](./docs/ROADMAP.md) | Daftar fitur masa depan |
| [Changelog](./docs/CHANGELOG.md) | Riwayat perubahan versi |
| [Contributing](./docs/CONTRIBUTING.md) | Panduan kontribusi |
