# 🛠️ Development Guide

Panduan lengkap untuk setup dan development PF Space.

---

## 📋 Prerequisites

- **Node.js** v23+
- **MySQL** 8.0+
- **npm** (untuk backend & frontend)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd pf-space
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi database kamu
```

**Konfigurasi `.env` wajib:**

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

# Authentication
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-long
BETTER_AUTH_URL=http://localhost:3000

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost:5173

# Trust proxy (set true jika di belakang Nginx)
TRUST_PROXY=false
```

### 3. Setup Database

```bash
# Buat database MySQL
mysql -u root -p -e "CREATE DATABASE pf_space"

# Jalankan migration
npm run migrate

# (Optional) Jalankan seed data kategori
npm run seed
```

### 4. Jalankan Backend

```bash
npm run dev
```

Server berjalan di `http://localhost:3000`

### 5. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

**Konfigurasi `.env`:**

```env
VITE_API_URL=http://localhost:3000
```

### 6. Jalankan Frontend

```bash
npm run dev
```

Aplikasi berjalan di `http://localhost:5173`

---

## 🔐 Setup Google OAuth (Optional)

### Step 1: Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Isi nama project: `PF Space`
4. Klik **Create**

### Step 2: Enable API

1. Pilih **APIs & Services** → **Library**
2. Cari dan enable **Google+ API**

### Step 3: Setup OAuth Consent Screen

1. Pilih **APIs & Services** → **OAuth consent screen**
2. Pilih **External** → **Create**
3. Isi:
   - App name: `PF Space`
   - User support email: email kamu
   - Developer contact: email kamu
4. Scopes: tambahkan `email`, `profile`, `openid`
5. Save and Continue

### Step 4: Buat OAuth Credentials

1. Pilih **APIs & Services** → **Credentials**
2. Klik **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Isi:
   - Name: `PF Space Web Client`
   - Authorized JavaScript origins:
     ```
     http://localhost:3000
     http://localhost:5173
     ```
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
5. Copy **Client ID** dan **Client Secret** ke `.env`:

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

---

## 🤖 Setup AI Provider

### Option 1: Groq (Recommended - Free)

1. Daftar di [console.groq.com](https://console.groq.com)
2. Buat API key
3. Update `.env`:

```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

### Option 2: OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini
```

### Option 3: Google Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-1.5-flash
```

---

## 👤 Set Admin Pertama

Setelah register user pertama, jalankan:

```bash
cd backend
node scripts/make-admin.js email@example.com
```

---

## 📜 NPM Scripts

### Backend

| Command                    | Deskripsi                         |
| -------------------------- | --------------------------------- |
| `npm run dev`              | Development server dengan nodemon |
| `npm start`                | Production server                 |
| `npm run migrate`          | Jalankan database migrations      |
| `npm run migrate:rollback` | Rollback migration terakhir       |
| `npm run seed`             | Jalankan database seeds           |
| `npm test`                 | Jalankan unit tests               |

### Frontend

| Command           | Deskripsi                |
| ----------------- | ------------------------ |
| `npm run dev`     | Development server       |
| `npm run build`   | Build untuk production   |
| `npm run preview` | Preview production build |

---

## 📁 Project Structure

```
pf-space/
├── backend/                    # Backend API (Fastify)
│   ├── src/
│   │   ├── controllers/        # Request handlers (18 controllers)
│   │   │   ├── film.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── discussion.controller.js
│   │   │   ├── community.controller.js
│   │   │   ├── vote.controller.js
│   │   │   ├── evaluation.controller.js
│   │   │   ├── learningMaterial.controller.js
│   │   │   ├── notification.controller.js
│   │   │   ├── report.controller.js
│   │   │   ├── collection.controller.js
│   │   │   ├── chat.controller.js
│   │   │   ├── filmScene.controller.js
│   │   │   ├── studyNote.controller.js
│   │   │   ├── setting.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── admin.controller.js
│   │   ├── services/           # Business logic
│   │   ├── models/             # Objection.js models
│   │   ├── routes/             # Route definitions (21 route files)
│   │   ├── middlewares/        # Auth, validateRequest (Zod)
│   │   ├── lib/                # Utilities
│   │   │   ├── ai/             # AI providers (Groq/OpenAI/Gemini)
│   │   │   ├── upload.js       # Tus.io upload handler (async exec)
│   │   │   ├── sanitize.js     # XSS sanitization
│   │   │   ├── response.js     # ApiResponse helper
│   │   │   ├── errors.js       # Custom error classes
│   │   │   └── audit.js        # Audit log helper
│   │   └── database/           # Migrations & seeds
│   ├── scripts/                # Utility scripts (make-admin.js)
│   ├── tests/                  # Unit & integration tests
│   └── uploads/                # Uploaded files (gitignored)
│
├── frontend/                   # Frontend (Vue 3)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application views
│   │   ├── composables/        # Shared state & logic
│   │   ├── lib/                # Utilities
│   │   └── router/             # Vue Router config
│   └── public/                 # Static assets
│
├── deploy/                     # Deployment scripts & configs
│   ├── setup.sh                # Server setup (one-time)
│   ├── deploy.sh               # Deploy/update script
│   ├── pf-space.nginx.conf     # Nginx config template
│   └── DEPLOYMENT_GUIDE.md     # Deployment docs
│
├── docs/                       # Project documentation
│   ├── README.md               # Documentation index
│   ├── API_REFERENCE.md        # API endpoints docs
│   ├── API_STANDARDS.md        # Response standards
│   ├── DATABASE.md             # Database schema
│   ├── DEVELOPMENT.md          # This file
│   ├── UPLOAD_SYSTEM.md        # Upload system docs
│   ├── CHANGELOG.md            # Version history
│   ├── ROADMAP.md              # Feature roadmap
│   ├── CONTRIBUTING.md         # Contribution guide
│   └── TESTING_GUIDE.md        # Testing guide
│
└── README.md                   # Main project README
```

---

## 🏗️ Arsitektur Backend

### Pattern MSC (Model-Service-Controller)

```
Request → Route → Middleware (Auth/Validate) → Controller → Service → Model → DB
```

### Konvensi Penamaan

Semua fungsi controller mengikuti standar REST CRUD:

| Operasi     | Nama Fungsi |
| ----------- | ----------- |
| Ambil semua | `getAll`    |
| Ambil by ID | `getById`   |
| Buat baru   | `create`    |
| Update      | `update`    |
| Hapus       | `delete`    |

Pengecualian yang diizinkan karena konteks bisnis yang unik:

- `getActiveDiscussion`, `toggleDiscussion`, `getReplies`, `addReply`, `getByFilm`, `getMyCollections`, `getStats`, dsb.

### Validasi Request

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

### Response Format

Semua response menggunakan `ApiResponse` helper yang **konsisten dalam Bahasa Indonesia**:

```javascript
import { ApiResponse } from "../lib/response.js";

return ApiResponse.success(reply, data, "Data berhasil diambil");
return ApiResponse.notFound(reply, "Film tidak ditemukan");
return ApiResponse.error(reply, "Anda tidak memiliki izin", 403);
```

---

## 🧪 Testing

### Backend Unit Test

```bash
cd backend
npm test
```

### Backend API Test (PowerShell)

```bash
cd backend
powershell -ExecutionPolicy Bypass -File tests/test-full.ps1
```

---

## 🐛 Troubleshooting

### Database Connection Error

```
Error: Knex: Timeout acquiring a connection. The pool is probably full.
```

**Solusi:** Restart backend server dan pastikan tidak ada koneksi yang bocor.

### CORS Error

**Solusi:** Pastikan `FRONTEND_URL` di `.env` backend sesuai dengan URL frontend.

### Google OAuth `state_mismatch`

**Solusi:**

1. Pastikan `TRUST_PROXY=true` jika di belakang reverse proxy
2. Pastikan `BETTER_AUTH_URL` menggunakan domain yang sama dengan frontend

### Upload Gagal

**Solusi:** Periksa konfigurasi `client_max_body_size` di Nginx (minimal 512m untuk video).

---

## 📞 Support

Jika ada pertanyaan atau masalah, buat issue di repository atau hubungi tim developer.
