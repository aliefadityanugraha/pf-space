<div align="center">

# 🎬 PF Space

**Platform Kearsipan Film Siswa**

Untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik pelajar.

[![CI](https://github.com/aliefadityanugraha/pf-space/actions/workflows/node.js.yml/badge.svg)](https://github.com/aliefadityanugraha/pf-space/actions/workflows/node.js.yml)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## 📖 Tentang

PF Space adalah platform web arsip film yang dibangun untuk siswa sekolah menengah (SMKN 1 Ngasem, Kediri). Platform ini memungkinkan siswa mengunggah, mendokumentasikan, dan mempelajari karya sinematik mereka — lengkap dengan sistem evaluasi, diskusi komunitas, dan mode studi interaktif.

## ✨ Fitur Utama

| Kategori                | Fitur                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| 🎬 **Manajemen Karya**  | Upload film (video + dokumen), HLS multi-resolution transcoding (1080p/720p/480p/360p), review workflow |
| 📺 **HLS Streaming**    | Adaptif HLS streaming via Plyr player dengan dropdown kualitas resolusi dinamis               |
| 📚 **Mode Studi**       | Split-screen: tonton film sambil baca naskah, storyboard, atau RAB           |
| 🎯 **Evaluasi**         | Penilaian kurator (Naskah, Sinematografi, Editing, Produksi) dengan feedback |
| 💬 **Diskusi**          | Threaded comments (5 level kedalaman), komunitas forum                       |
| 🔖 **Koleksi & Voting** | Bookmark pribadi, voting trending (mingguan/bulanan)                         |
| 🤖 **AI Chat**          | Asisten AI berbasis konteks arsip film (Groq/OpenAI/Gemini)                  |
| 📊 **Feed Production**  | Pemantauan alur dan aktivitas produksi karya film                            |
| ⚡ **Worker Monitor**   | Monitoring real-time status worker transcoder, CPU/RAM, dan log eksekusi    |
| 🔐 **RBAC**             | 4 level akses: User, Creator, Moderator, Admin                               |
| 📱 **Responsive**       | Brutal Design System, mobile-first, dark mode                                |
| 🔔 **Notifikasi**       | Real-time in-app notifications                                               |
| 🛡️ **Keamanan**         | CSP headers, rate limiting, RBAC defense-in-depth                            |
| 🌐 **SEO**              | Sitemap.xml & robots.txt dinamis via Vite plugin                             |

## 🛠️ Tech Stack

<div align="center">

| Layer          | Technology                                                         |
| -------------- | ------------------------------------------------------------------ |
| **Frontend**   | Vue 3.5 · Vite 7 · Tailwind CSS 4 · Plyr HLS · Lucide Icons        |
| **Backend**    | Fastify 5 · Node.js 20+ · MySQL 8 · Knex.js · Objection.js         |
| **Transcoder** | Standalone Worker Process · BullMQ · Redis 7 · FFmpeg              |
| **Auth**       | Better Auth (Email/Password + Google OAuth)                        |
| **Upload**     | Tus.io (Resumable, hingga 4GB) + HLS Segmenter                     |
| **AI**         | Groq · OpenAI · Gemini (pluggable)                                 |
| **DevOps**     | Docker & Docker Compose · Nginx Reverse Proxy · PM2 (non-container)|
| **Validation** | Zod (centralized schema)                                           |
| **CI/CD**      | GitHub Actions · Vitest (unit & integration tests)                 |

</div>

## 📁 Struktur Project

```
pf-space/
├── docker-compose.yaml         # Orkestrasi 5 container: db, redis, backend, transcoder, frontend
├── .env.example                # Template konfigurasi environment (Docker & manual)
├── .dockerignore               # Optimasi build context Docker
├── ecosystem.config.cjs        # Konfigurasi PM2 process manager (opsi deployment non-container)
│
├── backend/                    # API Server (Fastify + MySQL + Tus + Better Auth)
│   ├── Dockerfile              # Dockerfile Node 20 Alpine untuk Backend
│   ├── docker-entrypoint.sh    # Script auto-migrasi Knex & auto-seed admin
│   ├── src/
│   │   ├── controllers/        # Request handlers (Admin, Films, Users, Feed, dsb.)
│   │   ├── services/           # Business logic & Transcode Audit
│   │   ├── models/             # Database models (Film, TranscodeOperation, dsb.)
│   │   ├── routes/             # API routes & static uploads
│   │   ├── lib/                # Utilities, BullMQ Producer, Auth
│   │   └── database/           # Knex migrations & seeds
│   ├── scripts/                # Utility scripts (batch-retranscode, make-admin)
│   └── uploads/                # Direktori video MP4 & HLS (.m3u8)
│
├── transcoder/                 # Standalone Transcoder Worker (BullMQ + FFmpeg)
│   ├── Dockerfile              # Dockerfile dengan FFmpeg & Node 20
│   └── src/
│       ├── worker.js           # Worker consumer antrean video
│       ├── ffmpeg.js           # Multi-rendition HLS encoding engine
│       └── renditions.js       # Preset resolusi video adaptif
│
├── frontend/                   # Client SPA (Vue 3 + Vite + Tailwind)
│   ├── Dockerfile              # Multi-stage build (Vite build + Nginx Alpine)
│   ├── nginx.conf              # Nginx reverse proxy (/api/, /uploads/) + SPA routing
│   └── src/
│       ├── components/         # UI components, VideoPlayer, TranscodeStatus
│       ├── pages/              # Halaman web (Dashboard, Archives, Feed, dsb.)
│       └── composables/        # State & shared composables (useAuth, dsb.)
│
├── deploy/                     # Deployment scripts untuk VPS / aaPanel (non-container)
│   ├── deploy.sh               # Script deployment otomatis
│   ├── pf-space.nginx.conf     # Template Nginx reverse proxy sistem
│   └── DEPLOYMENT_GUIDE.md     # Panduan deployment production manual
│
└── docs/                       # Dokumentasi Teknis
    ├── API_REFERENCE.md        # Dokumentasi endpoint API
    ├── DATABASE.md             # Skema & relasi database
    ├── UPLOAD_SYSTEM.md        # Sistem resumable upload Tus.io
    ├── DEVELOPMENT.md          # Panduan local development
    ├── TESTING_GUIDE.md        # Panduan penulisan & eksekusi pengujian
    └── ROADMAP.md              # Rencana pengembangan fitur
```

## 🚀 Getting Started

### Opsi 1: Menjalankan dengan Docker (Direkomendasikan)

Metode tercepat untuk menjalankan seluruh ekosistem PF Space (MySQL 8, Redis 7, Backend, Transcoder FFmpeg, dan Frontend Nginx) dengan satu perintah:

1. **Clone repository dan siapkan environment:**
   ```bash
   cp .env.example .env
   ```
   *(Opsional: sesuaikan password database atau credential AI di `.env` jika diperlukan)*

2. **Jalankan seluruh service:**
   ```bash
   docker compose up -d
   ```
   *Docker Compose akan otomatis menginisialisasi database, menjalankan seluruh migrasi Knex (35 tabel), dan melakukan seeding akun admin & data sampel film.*

3. **Akses aplikasi:**
   - **Frontend & App:** [http://localhost](http://localhost) (port 80)
   - **Backend API & Healthcheck:** [http://localhost:3001/api/health](http://localhost:3001/api/health)
   - **Akun Default Admin:**
     - **Email:** `admin@pfspace.com`
     - **Password:** `admin123`

---

### Opsi 2: Menjalankan Manual (Local Development)

#### Prerequisites
- Node.js 20+
- MySQL 8+
- Redis Server
- FFmpeg & FFprobe (terpasang di path sistem)

#### 1. Setup Backend
```bash
cd backend
npm install
cp .env.example .env          # Sesuaikan DB_NAME, DB_USER, DB_PASSWORD, BETTER_AUTH_SECRET
npm run migrate               # Jalankan migrasi database
npm run seed                  # Seed admin dan data sampel
npm run dev                   # Berjalan di http://localhost:3001
```

#### 2. Setup Transcoder Worker
```bash
cd transcoder
npm install
npm start                     # Menghubungkan ke Redis dan MySQL
```

#### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev                   # Berjalan di http://localhost:5173
```

#### 4. Menjadikan User Sebagai Admin (Opsional)
```bash
cd backend
node scripts/make-admin.js email_kamu@example.com
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Transcoder tests
cd transcoder && npm test
```

## 📚 Dokumentasi

| Dokumen                                          | Deskripsi                                  |
| ------------------------------------------------ | ------------------------------------------ |
| [API Reference](./docs/API_REFERENCE.md)         | Endpoint lengkap + contoh request/response |
| [Database Schema](./docs/DATABASE.md)            | Struktur tabel dan relasi                  |
| [Upload System](./docs/UPLOAD_SYSTEM.md)         | Tus.io resumable upload & draft system     |
| [Development Guide](./docs/DEVELOPMENT.md)       | Panduan setup local development            |
| [Testing Guide](./docs/TESTING_GUIDE.md)         | Cara menulis dan menjalankan test          |
| [Deployment Guide](./deploy/DEPLOYMENT_GUIDE.md) | Deploy ke production server                |
| [Roadmap](./docs/ROADMAP.md)                     | Fitur masa depan                           |
| [Changelog](./docs/CHANGELOG.md)                 | Riwayat perubahan versi                    |

## 🔒 Security

- **RBAC Defense-in-Depth**: Validasi role di controller DAN service
- **Rate Limiting**: Per-route rate limits pada API autentikasi
- **Input Validation**: Zod schemas + sanitization (XSS prevention)
- **CSP Headers**: Content Security Policy untuk mencegah injection
- **Self-Edit Prevention**: User tidak bisa mengubah role diri sendiri
- **Last Admin Protection**: Admin terakhir tidak bisa diturunkan rolenya

## 📄 License

MIT License — silakan gunakan untuk projek pendidikan.

---

<div align="center">

Dibuat dengan ❤️ untuk siswa SMKN 1 Ngasem, Kediri

</div>
