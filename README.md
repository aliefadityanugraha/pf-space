# CineArchive

Platform kearsipan film siswa untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik. Aplikasi ini menggunakan arsitektur Monorepo yang terdiri dari Frontend (Vue 3) dan Backend (Fastify).

## Tech Stack

### Frontend (`si-film-archive/`)

- **Framework:** Vue 3 (Composition API `<script setup>`)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 (Custom Brutal Design System)
- **UI Components:** shadcn/ui Vue (Radix Vue)
- **Rich Text Editor:** Tiptap
- **Icons:** Lucide Vue
- **State Management:** Vue Composables (Native Reactivity)
- **Routing:** Vue Router
- **SEO:** Unhead

### Backend (`backend/`)

- **Framework:** Fastify
- **Language:** JavaScript (Node.js)
- **Database:** MySQL
- **ORM/Query Builder:** Objection.js & Knex (with Kysely for some types)
- **Authentication:** Better Auth
- **File Handling:** @fastify/multipart (Streaming upload support)
- **Static Serving:** @fastify/static

## Project Structure

```
.
├── backend/                # Server-side code (API)
│   ├── src/
│   │   ├── controllers/    # Request handlers (Film, Auth, Upload, etc.)
│   │   ├── models/         # Database models (Objection.js)
│   │   ├── routes/         # API routes definition
│   │   └── database/       # Migrations & Seeds
│   └── ...
│
├── si-film-archive/        # Client-side code (Frontend)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application views/pages
│   │   ├── composables/    # Shared state & logic (useAuth, useToast, etc.)
│   │   └── lib/            # Utilities (API wrapper, formatter)
│   └── ...
└── README.md               # Documentation
```

## Features

- **Authentication & Authorization**: Login, Register, dan Role-Based Access Control (User, Creator, Moderator, Admin).
- **Hybrid Film Archive**:
  - **Streaming**: Dukungan dual source (Embed YouTube & Direct MP4/WebM Upload).
  - **Catalog**: Pencarian, filter kategori, dan status film.
  - **Detail Page**: Informasi lengkap, sinopsis, dan diskusi.
- **Resumable Upload**: Upload file besar dengan Tus.io protocol yang dapat dilanjutkan jika koneksi terputus.
- **Draft System**: Auto-save form data ke localStorage untuk mencegah kehilangan data saat upload.
- **Dynamic Banner System**: Banner halaman depan diambil langsung dari film unggulan (Curated/Banner Active status).
- **Learning Assets**: Akses ke aset pembelajaran seperti Naskah Film, Storyboard, dan RAB (PDF Viewer).
- **Discussion System**: Komentar dan balasan (threaded comments) pada setiap film.
- **Voting & Collection**: Sistem voting untuk trending dan fitur "Simpan ke Koleksi" pribadi.
- **Creator Studio**: Upload karya mandiri dengan progress bar dan validasi file.
- **Admin Dashboard**: Manajemen User, Film (termasuk Banner), Kategori, dan Moderasi Konten.
- **Brutal Design**: Antarmuka modern dengan gaya Neo-Brutalism (High contrast, bold borders).

## Getting Started

### 1. Setup Backend

Masuk ke folder backend, instal dependensi, dan jalankan server.

```bash
cd backend

# Install dependencies
npm install

# Setup Environment Variables
cp .env.example .env
# Konfigurasi wajib di .env:
# - DB_NAME, DB_USER, DB_PASS (MySQL Connection)
# - BETTER_AUTH_SECRET (Auth Security)
# - ALLOWED_ORIGINS (CORS, e.g., http://localhost:5173)

# Run Database Migrations & Seeds
npm run migrate
npm run seed

# Start Server
npm run dev
```

Server akan berjalan di `http://localhost:3000`.

### 2. Setup Frontend

Masuk ke folder frontend, instal dependensi, dan jalankan server development.

```bash
cd si-film-archive

# Install dependencies
pnpm install

# Setup Environment Variables
# Pastikan file .env (atau .env.local) memiliki:
# VITE_API_URL=http://localhost:3000

# Start Development Server
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:5173`.

## Design System

**Neo-Brutalist Style:**

- **Border:** Tebal dan hitam (`border-2 border-black` / `border-stone-800`).
- **Shadow:** Hard shadow tanpa blur (`shadow-brutal`).
- **Radius:** Siku tajam atau rounded minimal.
- **Colors:**
  - Red: `#ef4444` (Accent / Action)
  - Teal: `#265C5C` (Primary / Brand)
  - Orange: Brand Orange (Highlight)
  - Cream: `#F2EEE3` (Background)

## Development Status

- [x] **Backend API**: Terintegrasi (Fastify + MySQL).
- [x] **Frontend UI**: Terimplementasi (Vue 3 + Brutal Design).
- [x] **Authentication**: Terimplementasi (Better Auth).
- [x] **Media Handling**: Upload & Streaming (YouTube/Local) berfungsi.
- [x] **Resumable Upload**: Tus.io protocol untuk upload yang dapat dilanjutkan.
- [x] **Draft System**: Auto-save form data untuk mencegah kehilangan data.
- [x] **Database**: Migrations & Seeding ready.
- [x] **Voting System**: Trending films berdasarkan periode.
- [x] **Collections**: Fitur bookmark/simpan film.
- [ ] **Testing**: Unit & E2E Testing (In Progress).
- [ ] **CI/CD**: Automated deployment pipeline.

## 📚 Documentation

Dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

| Dokumen                                          | Deskripsi                              |
| ------------------------------------------------ | -------------------------------------- |
| [Project Structure](./docs/PROJECT_STRUCTURE.md) | Struktur folder dan arsitektur project |
| [API Reference](./docs/API_REFERENCE.md)         | Dokumentasi lengkap API endpoints      |
| [Database Schema](./docs/DATABASE.md)            | Schema database dan relasi             |
| [API Standards](./docs/API_STANDARDS.md)         | Standar format response API            |
| [Upload System](./docs/UPLOAD_SYSTEM.md)         | Sistem upload resumable & draft        |
| [Development Guide](./docs/DEVELOPMENT.md)       | Panduan setup dan development          |
| [Roadmap](./docs/ROADMAP.md)                     | Daftar fitur yang akan dikembangkan    |
