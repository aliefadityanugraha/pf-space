<div align="center">

# 🎬 PF Space

**Platform Kearsipan Film Siswa**

Untuk apresiasi, dokumentasi, dan pembelajaran karya sinematik pelajar.

[![CI](https://github.com/aliefadityanugraha/pf-space/actions/workflows/node.js.yml/badge.svg)](https://github.com/aliefadityanugraha/pf-space/actions/workflows/node.js.yml)
![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## 📖 Tentang

PF Space adalah platform web arsip film yang dibangun untuk siswa sekolah menengah (SMKN 1 Ngasem, Kediri). Platform ini memungkinkan siswa mengunggah, mendokumentasikan, dan mempelajari karya sinematik mereka — lengkap dengan sistem evaluasi, diskusi komunitas, dan mode studi interaktif.

## ✨ Fitur Utama

| Kategori                | Fitur                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| 🎬 **Manajemen Karya**  | Upload film (video + dokumen), HLS multi-resolution transcoding (720p/360p), review workflow |
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

| Layer          | Technology                                                   |
| -------------- | ------------------------------------------------------------ |
| **Frontend**   | Vue 3.5 · Vite 7 · Tailwind CSS 4 · Plyr HLS · Lucide Icons  |
| **Backend**    | Fastify 5 · Node.js 20+ · MySQL · Knex.js · Objection.js     |
| **Transcoder** | Worker Process · BullMQ · Redis · FFmpeg                     |
| **Auth**       | Better Auth (Email/Password + Google OAuth)                  |
| **Upload**     | Tus.io (Resumable, hingga 4GB) + HLS Segmenter              |
| **AI**         | Groq · OpenAI · Gemini (pluggable)                           |
| **Validation** | Zod (centralized schema)                                     |
| **CI/CD**      | GitHub Actions · Vitest (174 tests pass)                     |

</div>

## 📁 Struktur Project

```
pf-space/
├── backend/                    # API Server (Fastify + Mysql + Tus)
│   ├── src/
│   │   ├── controllers/        # Request handlers (Admin, Films, Users, Feed)
│   │   ├── services/           # Business logic & Transcode Audit
│   │   ├── models/             # Database models (Film, TranscodeOperation, etc.)
│   │   ├── routes/             # API routes
│   │   ├── lib/                # Utilities & BullMQ Queue producer
│   │   └── database/           # Migrations & seeds
│   ├── scripts/                # Utility scripts (batch-retranscode.js)
│   └── uploads/                # Video MP4 & HLS (.m3u8) directory
│
├── transcoder/                 # Standalone Transcoder Worker (BullMQ + FFmpeg)
│   ├── src/
│   │   ├── worker.js           # Main Queue Worker process
│   │   └── ffmpeg.js           # Multi-rendition HLS encoding engine
│
├── frontend/                   # SPA Client (Vue 3 + Vite + Tailwind)
│   ├── src/
│   │   ├── components/         # UI components & TranscodeStatus / VideoPlayer
│   │   ├── pages/              # Page views (WorkerMonitor, Archives, etc.)
│   │   └── composables/        # Shared composables
│   └── public/                 # Static assets
│
├── deploy/                     # Deployment configs (Nginx, aaPanel, Cloudflare)
└── ecosystem.config.cjs        # PM2 process manager configuration
│
├── deploy/                     # Deployment configs
│   ├── deploy.sh               # One-command deploy script
│   ├── pf-space.nginx.conf     # Nginx config template
│   └── DEPLOYMENT_GUIDE.md     # Step-by-step guide
│
└── docs/                       # Documentation
    ├── API_REFERENCE.md        # API endpoint docs
    ├── DATABASE.md             # Schema & relations
    ├── UPLOAD_SYSTEM.md        # Tus.io upload system
    ├── DEVELOPMENT.md          # Dev setup guide
    ├── TESTING_GUIDE.md        # Test coverage docs
    └── ROADMAP.md              # Future features
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- MySQL 8+
- npm or pnpm

### Backend

```bash
cd backend
npm install
cp .env.example .env      # isi DB_NAME, DB_USER, DB_PASS, BETTER_AUTH_SECRET
npm run migrate
npm run seed
npm run dev                # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

### Set Admin Pertama

```bash
cd backend
node scripts/make-admin.js email@example.com
```

## 🧪 Testing

```bash
# Backend (185 tests)
cd backend && npm test

# Frontend (84 tests)
cd frontend && npm test

# Semua test via CI
gh run list                # lihat status GitHub Actions
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

## 📈 Status

- [x] Backend API — Fastify + MySQL
- [x] Frontend UI — Vue 3 + Brutal Design
- [x] Authentication — Better Auth (Email + Google OAuth)
- [x] Film Evaluation — Kurator feedback & notifikasi
- [x] Study Mode — Video player + dokumen split-screen
- [x] Production Feed — Pemantauan aktivitas produksi
- [x] Media Handling — Tus.io resumable upload (4GB)
- [x] Community Forum — Threaded discussions
- [x] AI Chat — Context-aware film assistant
- [x] Learning Materials — Curated resource management
- [x] Content Reports — Moderation queue
- [x] SEO — Dynamic sitemap.xml & robots.txt
- [x] CI/CD — GitHub Actions (21 backend + 16 frontend test files)
- [x] Security Audit — 18 fixes (S1-S12, R1-R8)

## 📄 License

MIT License — silakan gunakan untuk projek pendidikan.

---

<div align="center">

Dibuat dengan ❤️ untuk siswa SMKN 1 Ngasem, Kediri

</div>
