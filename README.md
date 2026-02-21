#PF Space

Platform kearsipan film siswa untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik. Aplikasi ini menggunakan arsitektur Monorepo yang terdiri dari Frontend (Vue 3) dan Backend (Fastify).

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
- **Language:** JavaScript (Node.js)
- **Database:** MySQL
- **ORM/Query Builder:** Objection.js & Knex
- **Authentication:** Better Auth
- **File Handling:** Tus.io (Resumable Uploads)
- **Static Serving:** @fastify/static

## Project Structure

```
.
├── backend/                # Server-side code (API)
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models (Objection.js)
│   │   ├── routes/         # API routes definition
│   │   └── database/       # Migrations & Seeds
│   └── ...
│
├── frontend/               # Client-side code (Frontend)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page views
│   │   ├── composables/    # Shared logic
│   │   └── lib/            # Utilities
│   └── ...
└── README.md               # Documentation
```

## Features

- **Authentication & Authorization**: Login, Register, dan RBAC (User, Creator, Moderator, Admin).
- **Film Evaluation System**: Modul penilaian karya oleh Kurator/Moderator dengan feedback mendetail (Naskah, Sinematografi, Editing, Produksi).
- **Study Mode**: Mode split-screen untuk menonton film sambil meninjau aset dokumen (Naskah, Storyboard, RAB).
- **Hybrid Film Source**: Dukungan YouTube Embed & Direct Upload.
- **Resumable Upload**: Upload file besar dengan protokol Tus.io.
- **Discussion System**: Threaded comments untuk diskusi antar pengguna.
- **Voting & Collection**: Sistem voting trending dan koleksi/bookmark pribadi.
- **Brutal Design**: Antarmuka modern dengan gaya Neo-Brutalism yang kontras dan bold.

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

## Development Status

- [x] **Backend API**: Fastify + MySQL integration.
- [x] **Frontend UI**: Vue 3 + Brutal Design.
- [x] **Authentication**: Better Auth implemented.
- [x] **Film Evaluation**: Complete with curator feedback & notifications.
- [x] **Study Mode**: Advanced video player with document integration.
- [x] **Media Handling**: Tus.io resumable upload.
- [x] **Learning Materials**: Managed as list-view for better UX.
- [ ] **Testing**: Unit & E2E Testing (In Progress).

## 📚 Documentation

Dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

| Dokumen                                          | Deskripsi                              |
| ------------------------------------------------ | -------------------------------------- |
| [Project Structure](./docs/PROJECT_STRUCTURE.md) | Struktur folder dan arsitektur project |
| [API Reference](./docs/API_REFERENCE.md)         | Dokumentasi lengkap API endpoints      |
| [Database Schema](./docs/DATABASE.md)            | Schema database dan relasi             |
| [Upload System](./docs/UPLOAD_SYSTEM.md)         | Sistem upload resumable & draft        |
| [Development Guide](./docs/DEVELOPMENT.md)       | Panduan setup dan development          |
| [Roadmap](./docs/ROADMAP.md)                     | Daftar fitur masa depan                |
