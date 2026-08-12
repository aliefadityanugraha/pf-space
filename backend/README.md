# PF Space - Backend API

Backend API untuk aplikasi PF Space — platform arsip film karya siswa.

## Tech Stack

- **Fastify** — Web framework
- **Objection.js + Knex** — ORM dan query builder
- **MySQL** — Database
- **Better Auth** — Authentication (Email/Password + Google OAuth)
- **Groq/OpenAI/Gemini** — AI Provider (pluggable)
- **Zod** — Centralized request validation
- **JavaScript (ESM)** — Non-TypeScript

## Arsitektur

Menggunakan **Model-Service-Controller (MSC)** pattern:

```
Request → Route → Middleware (Auth/Validate) → Controller → Service → Model → DB
```

```
src/
├── controllers/    # Handle request/response (18 controllers)
├── services/       # Business logic
├── models/         # Objection.js models
├── routes/         # Route definitions (21 route files)
├── middlewares/    # Auth, validateRequest (Zod)
├── lib/            # Utilities
│   ├── ai/         # AI providers (Groq/OpenAI/Gemini, pluggable)
│   ├── upload.js   # Tus.io + disk space check (async exec)
│   ├── sanitize.js # XSS sanitization
│   ├── response.js # ApiResponse helper
│   ├── errors.js   # Custom error classes
│   └── audit.js    # Audit log helper
└── database/       # Migrations & seeds
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi database

# 3. Buat database MySQL
mysql -u root -p -e "CREATE DATABASE pf_space"

# 4. Jalankan migration
npm run migrate

# 5. (Optional) Seed data kategori
npm run seed

# 6. Jalankan server
npm run dev
```

## Environment Variables

```env
# Server
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pf_space

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Trust proxy (set true di belakang Nginx)
TRUST_PROXY=false

# AI Provider (groq, openai, gemini)
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
```

---

## Role System

| role_id | name      | Deskripsi                              |
| ------- | --------- | -------------------------------------- |
| 1       | user      | Default — bisa vote, komentar, koleksi |
| 2       | creator   | Bisa upload dan manage film sendiri    |
| 3       | moderator | Bisa moderasi komentar & komunitas     |
| 4       | admin     | Full access ke semua fitur             |

### Set Admin Pertama

```bash
node scripts/make-admin.js email@example.com
```

---

## Konvensi Penamaan Controller

Semua fungsi controller mengikuti standar REST CRUD:

| Operasi     | Nama Fungsi |
| ----------- | ----------- |
| Ambil semua | `getAll`    |
| Ambil by ID | `getById`   |
| Buat baru   | `create`    |
| Update      | `update`    |
| Hapus       | `delete`    |

Spesifik per domain diizinkan: `getByFilm`, `toggleDiscussion`, `getReplies`, `addReply`, `getActiveDiscussion`, `getStats`, dll.

---

## Validasi Request

Menggunakan **Zod** dengan middleware `validateRequest`:

```javascript
import { validateRequest } from "../middlewares/index.js";
import { createFilmSchema } from "../middlewares/schemas/film.schema.js";

fastify.post(
  "/films",
  {
    preHandler: [authenticate, validateRequest(createFilmSchema)],
  },
  filmController.create.bind(filmController),
);
```

---

## Format Response

Semua response menggunakan `ApiResponse` helper. Pesan **selalu dalam Bahasa Indonesia**.

### Success

```json
{
  "success": true,
  "message": "Film berhasil diambil",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Film tidak ditemukan"
}
```

### Validation Error

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validasi input gagal",
  "errors": [{ "field": "judul", "message": "Judul wajib diisi" }]
}
```

### Paginated

```json
{
  "success": true,
  "message": "Film berhasil diambil",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## Daftar Endpoint

Lihat dokumentasi lengkap di [`docs/API_REFERENCE.md`](../docs/API_REFERENCE.md).

Ringkasan route prefix:

| Prefix                        | Modul                            |
| ----------------------------- | -------------------------------- |
| `/api/auth/...`               | Authentication & User management |
| `/api/films/...`              | Film CRUD + approval workflow    |
| `/api/film-scenes/...`        | Struktur adegan film             |
| `/api/votes/...`              | Voting & trending                |
| `/api/discussions/...`        | Komentar bersarang               |
| `/api/community/...`          | Forum diskusi topik              |
| `/api/collections/...`        | Koleksi/bookmark                 |
| `/api/notifications/...`      | Notifikasi                       |
| `/api/evaluations/...`        | Penilaian kurator                |
| `/api/study-notes/...`        | Catatan Study Mode               |
| `/api/learning-materials/...` | Materi pembelajaran              |
| `/api/reports/...`            | Pelaporan konten                 |
| `/api/categories/...`         | Kategori film                    |
| `/api/users/...`              | Profil publik pengguna           |
| `/api/settings/...`           | Pengaturan aplikasi              |
| `/api/chat/...`               | AI Chat                          |
| `/api/files/...`              | Upload (Tus.io)                  |
| `/api/upload/...`             | Upload utilities                 |
| `/api/admin/...`              | Admin (backup, statistik)        |

---

## HTTP Status Codes

| Code  | Kondisi                      |
| ----- | ---------------------------- |
| `200` | Berhasil                     |
| `201` | Data berhasil dibuat         |
| `400` | Bad Request / Validasi gagal |
| `401` | Belum login                  |
| `403` | Tidak memiliki izin          |
| `404` | Data tidak ditemukan         |
| `429` | Too Many Requests            |
| `500` | Internal Server Error        |

---

## Optimasi Backend

Beberapa implementasi performa penting:

| Fitur                    | Implementasi                                   |
| ------------------------ | ---------------------------------------------- |
| Hapus komentar bersarang | Recursive CTE (1 DB round-trip)                |
| Paginasi komentar        | DB-level pagination (3 parallel queries)       |
| Film acak                | Fisher-Yates shuffle (bukan `ORDER BY RAND()`) |
| Penghapusan file         | `Promise.all` (paralel, bukan sequential loop) |
| Disk space check         | `promisify(exec)` async (bukan `execSync`)     |
| Dynamic import           | Semua static import di atas file controller    |
| Request tracking         | `X-Request-ID` header pada semua response      |
| Security                 | CSP header aktif + per-route rate limiting     |

---

## Testing

```bash
# Unit tests
npm test

# API integration test (PowerShell)
powershell -ExecutionPolicy Bypass -File tests/test-full.ps1
```
