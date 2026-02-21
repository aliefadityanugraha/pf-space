# SI Film Archive - Backend API

Backend API untuk aplikasi SI Film Archive - platform arsip film karya siswa.

## Tech Stack

- **Fastify** - Web framework
- **Objection.js + Knex** - ORM dan query builder
- **MySQL** - Database
- **Better Auth** - Authentication (Email/Password + Google OAuth)
- **Groq/OpenAI/Gemini** - AI Provider (pluggable)
- **JavaScript (ESM)** - Non-TypeScript

## Arsitektur

Menggunakan **Model-Service-Controller (MSC)** pattern:

```
src/
├── controllers/    # Handle request/response
├── services/       # Business logic
├── models/         # Objection.js models
├── routes/         # Route definitions
├── middlewares/    # Auth, validation
├── lib/            # Utilities (auth, ai)
│   └── ai/         # AI providers (pluggable)
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
mysql -u root -p -e "CREATE DATABASE si_film_archive"

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
DB_NAME=si_film_archive

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173

# AI Provider (groq, openai, gemini)
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key
```

---

## Role System

| role_id | name | Deskripsi |
|---------|------|-----------|
| 1 | user | Default - bisa vote dan comment |
| 2 | creator | Bisa upload dan manage film sendiri |
| 3 | moderator | Bisa moderasi komentar |
| 4 | admin | Full access ke semua fitur |

### Set Admin Pertama

```bash
# Setelah register user, jalankan:
node scripts/make-admin.js email@example.com
```

---

## API Endpoints

Base URL: `http://localhost:3000/api`

### Health Check

```
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-12-30T10:00:00.000Z"
}
```

---

## Authentication

### Register

```
POST /api/auth/sign-up/email
Origin: http://localhost:5173
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

Response:
```json
{
  "redirect": false,
  "token": "xxx",
  "user": {
    "id": "WlXaQBE3IcTcBr55dwU0tYExlMC7Onxf",
    "email": "user@example.com",
    "name": "John Doe",
    "role_id": 1
  }
}
```

### Login

```
POST /api/auth/sign-in/email
Origin: http://localhost:5173
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response: Same as register + Set-Cookie header dengan session token

### Get Session

```
GET /api/auth/session
Origin: http://localhost:5173
Cookie: better-auth.session_token=xxx
```

### Logout

```
POST /api/auth/sign-out
Origin: http://localhost:5173
Cookie: better-auth.session_token=xxx
```

### Get Profile

```
GET /api/auth/profile
Cookie: better-auth.session_token=xxx
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "WlXaQBE3IcTcBr55dwU0tYExlMC7Onxf",
    "email": "user@example.com",
    "name": "John Doe",
    "role": {
      "role_id": 4,
      "name": "admin",
      "description": "Full access to all features"
    },
    "image": null
  }
}
```

### Get All Roles

```
GET /api/auth/roles
Cookie: better-auth.session_token=xxx
```

### Get All Users (Admin)

```
GET /api/auth/users
Cookie: better-auth.session_token=xxx
```

### Update User Role (Admin)

```
PATCH /api/auth/users/:userId/role
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "role_id": 2
}
```

---

## Categories

### Get All Categories (Public)

```
GET /api/categories
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "category_id": 1,
      "nama_kategori": "Film Pendek",
      "deskripsi": "Film dengan durasi di bawah 30 menit",
      "created_at": "2024-12-30T10:00:00.000Z"
    }
  ]
}
```

### Get Categories with Film Count (Public)

```
GET /api/categories/with-count
```

### Get Single Category (Public)

```
GET /api/categories/:id
```

### Create Category (Admin)

```
POST /api/categories
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "nama_kategori": "Film Pendek",
  "deskripsi": "Film dengan durasi di bawah 30 menit"
}
```

Response:
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category_id": 1,
    "nama_kategori": "Film Pendek",
    "deskripsi": "Film dengan durasi di bawah 30 menit"
  }
}
```

### Update Category (Admin)

```
PUT /api/categories/:id
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "nama_kategori": "Film Pendek Updated",
  "deskripsi": "Deskripsi baru"
}
```

### Delete Category (Admin)

```
DELETE /api/categories/:id
Cookie: better-auth.session_token=xxx
```

---

## Films

### Get All Films (Public - Published Only)

```
GET /api/films?page=1&limit=10&category_id=1&search=pendek&sortBy=created_at&sortOrder=desc
```

Query Parameters:
- `page` - Halaman (default: 1)
- `limit` - Jumlah per halaman (default: 10)
- `category_id` - Filter by kategori
- `search` - Cari by judul
- `sortBy` - Field sorting (default: created_at)
- `sortOrder` - asc/desc (default: desc)

Response:
```json
{
  "success": true,
  "data": [
    {
      "film_id": 1,
      "judul": "Film Pendek Pertama",
      "sinopsis": "Cerita tentang...",
      "tahun_karya": 2024,
      "gambar_poster": "/uploads/poster.jpg",
      "status": "published",
      "created_at": "2024-12-30T10:00:00.000Z",
      "creator": {
        "id": "xxx",
        "name": "John Doe",
        "image": null
      },
      "category": {
        "category_id": 1,
        "nama_kategori": "Film Pendek"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Get Latest Films (Public)

```
GET /api/films/latest?limit=10
```

### Get Single Film (Public)

```
GET /api/films/:id
```

Response:
```json
{
  "success": true,
  "data": {
    "film_id": 1,
    "user_id": "xxx",
    "category_id": 1,
    "judul": "Film Pendek Pertama",
    "sinopsis": "Cerita tentang...",
    "tahun_karya": 2024,
    "link_video_utama": "https://youtube.com/watch?v=xxx",
    "link_trailer": "https://youtube.com/watch?v=yyy",
    "gambar_poster": "/uploads/poster.jpg",
    "filosofi_poster": "Makna dari poster...",
    "file_naskah": "/uploads/naskah.pdf",
    "file_storyboard": "/uploads/storyboard.pdf",
    "file_rab": "/uploads/rab.pdf",
    "crew": [
      { "jabatan": "Sutradara", "anggota": ["John Doe"] },
      { "jabatan": "Penulis", "anggota": ["Jane Doe"] }
    ],
    "status": "published",
    "creator": { "id": "xxx", "name": "John Doe" },
    "category": { "category_id": 1, "nama_kategori": "Film Pendek" }
  }
}
```

### Get My Films (Creator)

```
GET /api/films/my-films?page=1&limit=10&status=pending
Cookie: better-auth.session_token=xxx
```

### Get Pending Films (Admin)

```
GET /api/films/pending
Cookie: better-auth.session_token=xxx
```

### Create Film (Creator/Admin)

```
POST /api/films
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "judul": "Film Pendek Pertama",
  "category_id": 1,
  "sinopsis": "Ini adalah sinopsis film.",
  "tahun_karya": 2024,
  "link_video_utama": "https://youtube.com/watch?v=abc123",
  "link_trailer": "https://youtube.com/watch?v=xyz789",
  "gambar_poster": "/uploads/poster.jpg",
  "filosofi_poster": "Makna poster...",
  "file_naskah": "/uploads/naskah.pdf",
  "file_storyboard": "/uploads/storyboard.pdf",
  "file_rab": "/uploads/rab.pdf",
  "crew": [
    { "jabatan": "Sutradara", "anggota": ["John Doe"] },
    { "jabatan": "Penulis", "anggota": ["Jane Doe", "Bob"] }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Film created successfully. Waiting for admin approval.",
  "data": {
    "film_id": 1,
    "judul": "Film Pendek Pertama",
    "status": "pending"
  }
}
```

### Update Film (Owner)

```
PUT /api/films/:id
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "judul": "Film Pendek Pertama (Revisi)",
  "sinopsis": "Sinopsis yang sudah direvisi"
}
```

### Delete Film (Owner)

```
DELETE /api/films/:id
Cookie: better-auth.session_token=xxx
```

### Approve Film (Admin)

```
PATCH /api/films/:id/approve
Cookie: better-auth.session_token=xxx
```

Response:
```json
{
  "success": true,
  "message": "Film approved and published",
  "data": {
    "film_id": 1,
    "judul": "Film Pendek Pertama",
    "status": "published"
  }
}
```

### Reject Film (Admin)

```
PATCH /api/films/:id/reject
Cookie: better-auth.session_token=xxx
```

---

## Votes (Trending System)

### Get Trending Films (Public)

```
GET /api/votes/trending?period=week&limit=10
```

Query Parameters:
- `period` - `week`, `month`, atau `all` (default: week)
- `limit` - Jumlah film (default: 10)

Response:
```json
{
  "success": true,
  "data": [
    {
      "film_id": 1,
      "judul": "Film Trending",
      "vote_count": 42,
      "creator": { "id": "xxx", "name": "John Doe" },
      "category": { "category_id": 1, "nama_kategori": "Film Pendek" }
    }
  ]
}
```

### Get Vote Count (Public/Auth)

```
GET /api/votes/film/:filmId
Cookie: better-auth.session_token=xxx (optional - untuk has_voted)
```

Response:
```json
{
  "success": true,
  "data": {
    "vote_count": 42,
    "has_voted": true
  }
}
```

### Vote Film (Auth)

```
POST /api/votes/film/:filmId
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{}
```

Response:
```json
{
  "success": true,
  "message": "Vote recorded successfully",
  "data": { "vote_count": 43 }
}
```

### Toggle Vote (Auth)

```
POST /api/votes/film/:filmId/toggle
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{}
```

Response:
```json
{
  "success": true,
  "message": "Vote removed",
  "data": { "voted": false, "vote_count": 42 }
}
```

### Unvote Film (Auth)

```
DELETE /api/votes/film/:filmId
Cookie: better-auth.session_token=xxx
```

### Get My Votes (Auth)

```
GET /api/votes/my-votes
Cookie: better-auth.session_token=xxx
```

---

## Discussions (Comments)

Menggunakan **Adjacency List** pattern untuk nested comments (max 5 level depth).

### Get Comments (Public - Nested Tree)

```
GET /api/discussions/film/:filmId?page=1&limit=20
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "diskusi_id": 1,
      "film_id": 1,
      "isi_pesan": "Film yang bagus!",
      "parent_id": null,
      "created_at": "2024-12-30T10:00:00.000Z",
      "user": { "id": "xxx", "name": "John Doe", "image": null },
      "reply_count": 2,
      "replies": [
        {
          "diskusi_id": 2,
          "isi_pesan": "Setuju!",
          "parent_id": 1,
          "depth": 1,
          "user": { "id": "yyy", "name": "Jane" },
          "replies": [
            {
              "diskusi_id": 3,
              "isi_pesan": "Iya bener",
              "parent_id": 2,
              "depth": 2,
              "replies": []
            }
          ]
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

### Get Comment Count (Public)

```
GET /api/discussions/film/:filmId/count
```

Response:
```json
{
  "success": true,
  "data": { "comment_count": 15 }
}
```

### Post Comment (Auth)

```
POST /api/discussions/film/:filmId
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "isi_pesan": "Film yang bagus!"
}
```

### Reply to Comment (Auth)

```
POST /api/discussions/film/:filmId
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "isi_pesan": "Setuju banget!",
  "parent_id": 1
}
```

### Update Comment (Owner)

```
PUT /api/discussions/:id
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "isi_pesan": "Komentar yang sudah diedit"
}
```

### Delete Comment (Owner/Moderator/Admin)

```
DELETE /api/discussions/:id
Cookie: better-auth.session_token=xxx
```

### Get All Comments - Flat (Moderator/Admin)

```
GET /api/discussions/all?page=1&limit=50&film_id=1
Cookie: better-auth.session_token=xxx
```

---

## AI Chat

### Send Message (Auth)

```
POST /api/chat
Cookie: better-auth.session_token=xxx
Content-Type: application/json

{
  "message": "Rekomendasikan film pendek Indonesia yang bagus"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "chat_id": 1,
    "user_prompt": "Rekomendasikan film pendek Indonesia yang bagus",
    "ai_response": "Berikut beberapa rekomendasi...",
    "model": "llama-3.3-70b-versatile"
  }
}
```

### Get Chat History (Auth)

```
GET /api/chat/history?page=1&limit=20
Cookie: better-auth.session_token=xxx
```

### Clear Chat History (Auth)

```
DELETE /api/chat/history
Cookie: better-auth.session_token=xxx
```

---

## Error Responses

```json
{
  "success": false,
  "message": "Error message here"
}
```

HTTP Status Codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Testing

### Run Full API Test

```bash
cd backend
powershell -ExecutionPolicy Bypass -File tests/test-full.ps1
```

### Test Output Example

```
========================================
SI Film Archive - Full API Test
========================================

=== LOGIN ===
Logged in as: Test User (role_id: 4)

=== CREATE FILM 1 ===
Created: Film Pendek Pertama (film_id: 8)

=== CREATE FILM 2 ===
Created: Dokumenter Kampus (film_id: 9)

=== GET PENDING FILMS ===
Pending films: 2
  - Film Pendek Pertama (id: 8)
  - Dokumenter Kampus (id: 9)

=== APPROVE FILM 1 ===
Approved: Film Pendek Pertama -> published

=== APPROVE FILM 2 ===
Approved: Dokumenter Kampus -> published

=== GET PUBLISHED FILMS ===
Published films: 9

=== VOTE FILM ===
Vote recorded successfully - vote_count: 1

=== GET VOTE COUNT ===
Film 8 - votes: 1, has_voted: True

=== TOGGLE VOTE ===
Vote removed - voted: False, count: 0

=== GET TRENDING ===
Trending films:
  - Dokumenter Kampus (votes: 0)
  - Film Pendek Pertama (votes: 0)

=== POST COMMENT ===
Comment: 'Film yang sangat bagus! Suka banget.' (id: 5)

=== POST COMMENT 2 ===
Comment: 'Ceritanya menarik!'

=== REPLY TO COMMENT ===
Reply: 'Setuju banget!' (parent: 5)

=== NESTED REPLY ===
Nested reply: 'Iya bener!'

=== GET COMMENTS (Nested Tree) ===
Root comments: 2
  - Film yang sangat bagus! Suka banget. [replies: 2]
    - Setuju banget!
      - Iya bener!
  - Ceritanya menarik! [replies: 0]

=== GET COMMENT COUNT ===
Total comments: 4

=== UPDATE COMMENT ===
Updated: 'Film yang sangat bagus! (edited)'

=== GET ALL COMMENTS (Flat) ===
All comments: 8

========================================
TEST COMPLETE!
========================================
```

---

## Scripts

| Command | Deskripsi |
|---------|-----------|
| `npm run dev` | Development server dengan nodemon |
| `npm start` | Production server |
| `npm run migrate` | Jalankan migrations |
| `npm run migrate:rollback` | Rollback migration terakhir |
| `npm run seed` | Jalankan seeds (kategori default) |

### Utility Scripts

```bash
# Set user sebagai admin
node scripts/make-admin.js email@example.com

# List semua users
node scripts/list-users.js
```

---

## Database Schema

### Tables

| Table | Deskripsi |
|-------|-----------|
| `roles` | Daftar role (user, creator, moderator, admin) |
| `users` | Data user dengan role_id |
| `sessions` | Session management (Better Auth) |
| `accounts` | OAuth accounts (Better Auth) |
| `verifications` | Email verification tokens |
| `categories` | Kategori film |
| `films` | Data film/karya |
| `discussions` | Komentar dan diskusi (Adjacency List) |
| `votes` | Vote/like untuk trending |
| `chat_history` | Riwayat chat AI |

### Relationships

```
roles (1) ──────< users (many)
users (1) ──────< films (many)
users (1) ──────< discussions (many)
users (1) ──────< votes (many)
users (1) ──────< chat_history (many)
categories (1) ─< films (many)
films (1) ──────< discussions (many)
films (1) ──────< votes (many)
discussions (1) < discussions (many) [self-referencing for replies]
```

---

## Setup Google OAuth

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru
3. Enable Google+ API
4. Setup OAuth consent screen
5. Buat OAuth credentials (Web application)
6. Set redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID & Secret ke `.env`

---

## Setup AI Provider

### Groq (Recommended - Free)

1. Daftar di [console.groq.com](https://console.groq.com)
2. Buat API key
3. Update `.env`:
```env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxx
GROQ_MODEL=llama-3.3-70b-versatile
```

### OpenAI

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o-mini
```

### Google Gemini

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=xxxxx
GEMINI_MODEL=gemini-1.5-flash
```
