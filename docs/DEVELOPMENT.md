# 🛠️ Development Guide

Panduan lengkap untuk setup dan development SI Film Archive.

---

## 📋 Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **pnpm** (untuk frontend)
- **npm** (untuk backend)

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd si-film-archive
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
DB_NAME=si_film_archive

# Authentication
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-long
BETTER_AUTH_URL=http://localhost:3000

# Frontend URL (untuk CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database

```bash
# Buat database MySQL
mysql -u root -p -e "CREATE DATABASE si_film_archive"

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
cd si-film-archive

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env
```

**Konfigurasi `.env`:**

```env
VITE_API_URL=http://localhost:3000
```

### 6. Jalankan Frontend

```bash
pnpm dev
```

Aplikasi berjalan di `http://localhost:5173`

---

## 🔐 Setup Google OAuth (Optional)

### Step 1: Buat Project di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Klik **Select a project** → **New Project**
3. Isi nama project: `SI Film Archive`
4. Klik **Create**

### Step 2: Enable API

1. Pilih **APIs & Services** → **Library**
2. Cari dan enable **Google+ API**

### Step 3: Setup OAuth Consent Screen

1. Pilih **APIs & Services** → **OAuth consent screen**
2. Pilih **External** → **Create**
3. Isi:
   - App name: `SI Film Archive`
   - User support email: email kamu
   - Developer contact: email kamu
4. Scopes: tambahkan `email`, `profile`, `openid`
5. Save and Continue

### Step 4: Buat OAuth Credentials

1. Pilih **APIs & Services** → **Credentials**
2. Klik **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Isi:
   - Name: `SI Film Archive Web Client`
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

### Frontend

| Command        | Deskripsi                |
| -------------- | ------------------------ |
| `pnpm dev`     | Development server       |
| `pnpm build`   | Build untuk production   |
| `pnpm preview` | Preview production build |

---

## 📁 Project Structure

```
si-film-archive/
├── backend/                    # Backend API (Fastify)
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Objection.js models
│   │   ├── routes/             # Route definitions
│   │   ├── middlewares/        # Auth, validation
│   │   ├── lib/                # Utilities
│   │   │   └── ai/             # AI providers
│   │   └── database/           # Migrations & seeds
│   ├── scripts/                # Utility scripts
│   ├── tests/                  # API tests
│   └── uploads/                # Uploaded files
│
├── si-film-archive/            # Frontend (Vue 3)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Application views
│   │   ├── composables/        # Shared state & logic
│   │   ├── lib/                # Utilities
│   │   └── router/             # Vue Router config
│   └── public/                 # Static assets
│
├── docs/                       # Project documentation
│   ├── README.md               # Documentation index
│   ├── API_REFERENCE.md        # API endpoints docs
│   ├── DATABASE.md             # Database schema
│   ├── API_STANDARDS.md        # Response standards
│   ├── DEVELOPMENT.md          # This file
│   └── ROADMAP.md              # Feature roadmap
│
└── README.md                   # Main project README
```

---

## 🧪 Testing

### Backend API Test

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

### Google OAuth Error

**Solusi:**

1. Pastikan redirect URI sudah benar
2. Pastikan app sudah di-publish atau email sudah ditambahkan sebagai test user

---

## 📞 Support

Jika ada pertanyaan atau masalah, buat issue di repository atau hubungi tim developer.
