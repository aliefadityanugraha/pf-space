# 📚 PF Space Documentation

Dokumentasi teknis resmi untuk pengembangan, arsitektur, dan pengelolaan platform PF Space.

---

## 📂 Core Documentation Index

| File                                   | Deskripsi                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| [DEVELOPMENT.md](./DEVELOPMENT.md)     | Panduan setup, arsitektur micro-services/monorepo, konvensi penamaan, dan HLS Transcoder. |
| [API_REFERENCE.md](./API_REFERENCE.md) | Daftar lengkap seluruh endpoint API (22 route groups) termasuk Worker Audit & Retranscode. |
| [API_STANDARDS.md](./API_STANDARDS.md) | Standar format response JSON, kode error, dan konvensi Bahasa Indonesia.               |
| [DATABASE.md](./DATABASE.md)           | Schema database, relasi antar tabel, migration, dan tabel audit `transcode_operations`. |
| [UPLOAD_SYSTEM.md](./UPLOAD_SYSTEM.md) | Penjelasan sistem upload Tus.io resumable, HLS Transcoding pipeline, dan MP4 Fallback. |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Panduan pengujian Vitest (174 unit test suites) & integrasi pipeline CI/CD.             |
| [CHANGELOG.md](./CHANGELOG.md)         | Riwayat perubahan versi komprehensif (Added, Changed, Fixed, Optimized).               |
| [ROADMAP.md](./ROADMAP.md)             | Status pengembangan fitur dan rencana pengembangan masa depan.                         |
| [CONTRIBUTING.md](./CONTRIBUTING.md)   | Panduan kontribusi dan standar kualitas kode bagi pengembang.                           |

---

## 🚀 Deployment & Operations

| File                                                 | Deskripsi                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| [DEPLOYMENT_GUIDE.md](../deploy/DEPLOYMENT_GUIDE.md) | Panduan lengkap deploy ke aaPanel Linux, Nginx Port 80, PM2, dan Cloudflare Tunnel. |

---

## 🛠️ System Architecture Overview

- **Frontend**: Vue 3 SPA + Vite + TailwindCSS + Plyr HLS Player (`frontend/`)
- **Backend API**: Fastify + Objection.js / Knex + Tus Resumable Upload + MySQL (`backend/`)
- **Transcoder Worker**: Standalone Worker + BullMQ + Redis + FFmpeg (`transcoder/`)
- **Admin Dashboard**: Monitoring Worker, Kinerja Server, & Log Auditing Real-time (`/admin/workers`)

---

Untuk panduan instalasi cepat, silakan merujuk ke [README.md utama](../README.md).
