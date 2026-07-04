# PF Space — Backend API Reference

Dokumentasi lengkap API endpoints untuk PF Space — platform arsip film karya siswa.

**Base URL:** `http://localhost:3000/api`

> Semua response mengikuti format standar. Lihat [API Standards](./API_STANDARDS.md) untuk detail format.

---

## Autentikasi

Semua endpoint yang memerlukan login menggunakan cookie `better-auth.session_token`.

| Header / Cookie | Nilai |
| --- | --- |
| `Cookie` | `better-auth.session_token=xxx` |
| `Origin` | `http://localhost:5173` (required untuk Better Auth) |

### Sistem Role

| role_id | name | Hak Akses |
| --- | --- | --- |
| 1 | user | Vote, komentar, koleksi |
| 2 | creator | Semua user + upload & kelola film sendiri |
| 3 | moderator | Semua creator + moderasi komentar & komunitas |
| 4 | admin | Full akses ke semua fitur |

---

## Health Check

```
GET /api/health
```

```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-04-18T10:00:00.000Z"
}
```

---

## 🔐 Auth (`/api/auth/...`)

Better Auth menangani `sign-up`, `sign-in`, `sign-out`, `session`, dan Google OAuth secara built-in. Endpoint custom ada di `/api/auth/`:

### Register

```
POST /api/auth/sign-up/email
```

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Budi Santoso"
}
```

### Login

```
POST /api/auth/sign-in/email
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Logout

```
POST /api/auth/sign-out
Cookie: better-auth.session_token=xxx
```

### Get Session

```
GET /api/auth/session
```

### Google OAuth

```
GET /api/auth/google          → redirect ke Google consent screen
GET /api/auth/callback/google → callback handler (otomatis)
```

### Get Profil Saya (Auth)

```
GET /api/auth/profile
Cookie: better-auth.session_token=xxx
```

```json
{
  "success": true,
  "data": {
    "id": "WlXaQBE3IcTcBr55dwU0tYExlMC7Onxf",
    "email": "user@example.com",
    "name": "Budi Santoso",
    "image": null,
    "role": {
      "role_id": 1,
      "name": "user"
    }
  }
}
```

### Update Profil (Auth)

```
PUT /api/auth/profile
Cookie: better-auth.session_token=xxx
```

```json
{
  "name": "Nama Baru",
  "image": "/uploads/photo.jpg"
}
```

### Get Semua Role (Admin)

```
GET /api/auth/roles
```

### Get Semua User (Admin)

```
GET /api/auth/users?page=1&limit=20
```

### Update Role User (Admin)

```
PATCH /api/auth/users/:userId/role
```

```json
{ "role_id": 2 }
```

---

## 🎬 Films (`/api/films/...`)

### Get Semua Film (Public)

```
GET /api/films?page=1&limit=10&category_id=1&search=pendek&sortBy=created_at&sortOrder=desc
```

Query params: `page`, `limit`, `category_id`, `search`, `sortBy`, `sortOrder`

### Get Film Terbaru (Public)

```
GET /api/films/latest?limit=10
```

### Get Film Acak (Public)

```
GET /api/films/random?limit=6
```

> Menggunakan Fisher-Yates shuffle di level aplikasi (bukan `ORDER BY RAND()`).

### Get Single Film (Public)

```
GET /api/films/:id
GET /api/films/slug/:slug
```

### Get Film Saya (Creator/Auth)

```
GET /api/films/my-films?page=1&limit=10&status=pending
Cookie: better-auth.session_token=xxx
```

### Get Statistik Film Saya (Auth)

```
GET /api/films/stats
Cookie: better-auth.session_token=xxx
```

### Get Film Pending (Admin/Moderator)

```
GET /api/films/pending?page=1&limit=10
Cookie: better-auth.session_token=xxx
```

### Buat Film (Creator/Admin)

```
POST /api/films
Cookie: better-auth.session_token=xxx
```

```json
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
    { "jabatan": "Sutradara", "anggota": ["Budi Santoso"] },
    { "jabatan": "Penulis", "anggota": ["Ani", "Budi"] }
  ]
}
```

Response:
```json
{
  "success": true,
  "message": "Film berhasil dibuat. Menunggu persetujuan admin.",
  "data": { "film_id": 1, "status": "pending" }
}
```

### Update Film (Owner/Admin)

```
PUT /api/films/:id
Cookie: better-auth.session_token=xxx
```

### Hapus Film (Owner/Admin)

```
DELETE /api/films/:id
Cookie: better-auth.session_token=xxx
```

### Approve Film (Admin)

```
PATCH /api/films/:id/approve
Cookie: better-auth.session_token=xxx
```

Response: `"Film disetujui dan dipublikasikan"`

### Reject Film (Admin)

```
PATCH /api/films/:id/reject
Cookie: better-auth.session_token=xxx
```

```json
{ "rejection_reason": "Kualitas video tidak memenuhi standar." }
```

Response: `"Film ditolak"`

---

## 🎞️ Film Scenes (`/api/film-scenes/...`)

### Get Adegan Film (Public/Auth)

```
GET /api/film-scenes/:filmId
```

### Simpan Struktur Adegan (Owner/Admin/Moderator)

```
POST /api/film-scenes/:filmId
Cookie: better-auth.session_token=xxx
```

```json
[
  { "scene_order": 1, "title": "Opening", "description": "Adegan pembuka", "timestamp": "00:00" },
  { "scene_order": 2, "title": "Konflik", "description": "...", "timestamp": "01:30" }
]
```

---

## 🗳️ Votes (`/api/votes/...`)

### Get Trending Films (Public)

```
GET /api/votes/trending?period=week&limit=10
```

`period`: `week` | `month` | `all`

### Get Jumlah Vote Film (Public)

```
GET /api/votes/film/:filmId
Cookie: better-auth.session_token=xxx  (optional — untuk field has_voted)
```

```json
{
  "success": true,
  "data": { "vote_count": 42, "has_voted": true }
}
```

### Vote Film (Auth)

```
POST /api/votes/film/:filmId
Cookie: better-auth.session_token=xxx
```

### Hapus Vote Film (Auth)

```
DELETE /api/votes/film/:filmId
Cookie: better-auth.session_token=xxx
```

### Toggle Vote (Auth)

```
POST /api/votes/film/:filmId/toggle
Cookie: better-auth.session_token=xxx
```

### Get Vote Saya (Auth)

```
GET /api/votes/my-votes
Cookie: better-auth.session_token=xxx
```

### Reset Semua Vote (Admin)

```
DELETE /api/votes/reset
Cookie: better-auth.session_token=xxx
```

---

## 💬 Discussions (`/api/discussions/...`)

Menggunakan **Adjacency List** untuk threaded comments (maks. 5 level kedalaman).

### Get Komentar Film (Public — Nested Tree, Paginated)

```
GET /api/discussions/film/:filmId?page=1&limit=20
```

```json
{
  "success": true,
  "data": [
    {
      "diskusi_id": 1,
      "isi_pesan": "Film yang bagus!",
      "parent_id": null,
      "user": { "id": "xxx", "name": "Budi" },
      "reply_count": 2,
      "replies": [
        {
          "diskusi_id": 2,
          "isi_pesan": "Setuju!",
          "depth": 1,
          "replies": []
        }
      ]
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

### Get Jumlah Komentar (Public)

```
GET /api/discussions/film/:filmId/count
```

### Get Single Komentar (Public)

```
GET /api/discussions/:id
```

### Buat Komentar / Balasan (Auth)

```
POST /api/discussions/film/:filmId
Cookie: better-auth.session_token=xxx
```

```json
{
  "isi_pesan": "Komentar saya",
  "parent_id": null
}
```

Untuk balasan, isi `parent_id` dengan ID komentar induk. Batas kedalaman: 5 level.

### Edit Komentar (Owner)

```
PUT /api/discussions/:id
Cookie: better-auth.session_token=xxx
```

```json
{ "isi_pesan": "Komentar yang sudah diedit" }
```

### Hapus Komentar (Owner/Moderator/Admin)

```
DELETE /api/discussions/:id
Cookie: better-auth.session_token=xxx
```

> Menghapus komentar beserta semua balasan bersarangnya menggunakan Recursive CTE (1 round-trip).

### Get Semua Komentar Flat (Moderator/Admin)

```
GET /api/discussions/all?page=1&limit=50&film_id=1
Cookie: better-auth.session_token=xxx
```

---

## 🏘️ Community (`/api/community/...`)

### Get Diskusi Aktif (Public)

```
GET /api/community/active
```

### Get Single Diskusi (Public)

```
GET /api/community/:id
```

### Get Semua Diskusi (Moderator/Admin)

```
GET /api/community?page=1&limit=20
GET /api/community/discussions?page=1&limit=20
Cookie: better-auth.session_token=xxx
```

### Get Balasan Diskusi (Moderator/Admin)

```
GET /api/community/:id/replies
Cookie: better-auth.session_token=xxx
```

### Buat Diskusi (Moderator/Admin)

```
POST /api/community
Cookie: better-auth.session_token=xxx
```

### Update Diskusi (Moderator/Admin)

```
PUT /api/community/:id
Cookie: better-auth.session_token=xxx
```

### Toggle Aktif Diskusi (Moderator/Admin)

```
PATCH /api/community/:id/toggle
Cookie: better-auth.session_token=xxx
```

### Hapus Diskusi (Moderator/Admin)

```
DELETE /api/community/:id
Cookie: better-auth.session_token=xxx
```

### Tambah Balasan Diskusi (Auth)

```
POST /api/community/:id/replies
Cookie: better-auth.session_token=xxx
```

```json
{ "content": "Balasan saya terhadap topik ini." }
```

### Hapus Balasan (Owner)

```
DELETE /api/community/replies/:replyId
Cookie: better-auth.session_token=xxx
```

### Hapus Balasan oleh Moderator

```
DELETE /api/community/moderator/replies/:replyId
Cookie: better-auth.session_token=xxx
```

---

## 🔖 Collections (`/api/collections/...`)

### Toggle Koleksi (Auth)

```
POST /api/collections/film/:filmId
Cookie: better-auth.session_token=xxx
```

```json
{
  "success": true,
  "data": { "is_in_collection": true },
  "message": "Film ditambahkan ke koleksi"
}
```

### Status Koleksi (Public/Auth)

```
GET /api/collections/film/:filmId/status
```

### Koleksi Saya (Auth)

```
GET /api/collections/my?page=1&limit=10
Cookie: better-auth.session_token=xxx
```

---

## 🔔 Notifications (`/api/notifications/...`)

### Get Notifikasi Saya (Auth)

```
GET /api/notifications?page=1&limit=20
Cookie: better-auth.session_token=xxx
```

### Tandai Dibaca (Auth)

```
PATCH /api/notifications/:id/read
Cookie: better-auth.session_token=xxx
```

### Tandai Semua Dibaca (Auth)

```
PATCH /api/notifications/read-all
Cookie: better-auth.session_token=xxx
```

### Buat Notifikasi Sistem (Auth)

```
POST /api/notifications
Cookie: better-auth.session_token=xxx
```

```json
{
  "type": "system",
  "title": "Pengumuman penting",
  "message": "Konten pesan notifikasi.",
  "data": {}
}
```

---

## ⭐ Evaluations (`/api/evaluations/...`)

### Get Evaluasi Film (Owner/Admin/Moderator)

```
GET /api/evaluations/film/:filmId
Cookie: better-auth.session_token=xxx
```

```json
{
  "success": true,
  "data": {
    "script_score": 85,
    "script_comment": "Naskah sangat terstruktur.",
    "cinematography_score": 90,
    "cinematography_comment": "Sinematografi sangat baik.",
    "editing_score": 80,
    "editing_comment": "Editing halus.",
    "production_score": 88,
    "production_comment": "Produksi rapi.",
    "overall_feedback": "Karya yang sangat matang."
  }
}
```

### Create/Update Evaluasi (Admin/Moderator)

```
POST /api/evaluations/film/:filmId
Cookie: better-auth.session_token=xxx
```

```json
{
  "script_score": 85,
  "script_comment": "Naskah terstruktur.",
  "cinematography_score": 90,
  "cinematography_comment": "...",
  "editing_score": 80,
  "editing_comment": "...",
  "production_score": 88,
  "production_comment": "...",
  "overall_feedback": "Karya yang matang."
}
```

---

## 📝 Study Notes (`/api/study-notes/...`)

### Get Catatan Film Saya (Auth)

```
GET /api/study-notes/film/:filmId
Cookie: better-auth.session_token=xxx
```

### Simpan Catatan (Auth)

```
POST /api/study-notes/film/:filmId
Cookie: better-auth.session_token=xxx
```

### Hapus Catatan (Auth)

```
DELETE /api/study-notes/:id
Cookie: better-auth.session_token=xxx
```

---

## 📚 Learning Materials (`/api/learning-materials/...`)

### Get Semua Materi (Public)

```
GET /api/learning-materials?page=1&limit=10&status=all
```

### Get Single Materi (Public)

```
GET /api/learning-materials/:id
```

### Buat Materi (Admin/Moderator)

```
POST /api/learning-materials
Cookie: better-auth.session_token=xxx
```

### Update Materi (Owner/Admin)

```
PUT /api/learning-materials/:id
Cookie: better-auth.session_token=xxx
```

### Hapus Materi (Owner/Admin)

```
DELETE /api/learning-materials/:id
Cookie: better-auth.session_token=xxx
```

### Toggle Status Materi (Owner/Admin)

```
PATCH /api/learning-materials/:id/toggle
Cookie: better-auth.session_token=xxx
```

---

## 🚨 Reports (`/api/reports/...`)

### Kirim Laporan (Auth)

```
POST /api/reports
Cookie: better-auth.session_token=xxx
```

```json
{
  "target_type": "film",
  "target_id": 5,
  "reason": "Konten tidak pantas",
  "description": "Film mengandung konten yang melanggar pedoman."
}
```

### Get Semua Laporan (Admin)

```
GET /api/reports?page=1&limit=20&status=pending&target_type=film
Cookie: better-auth.session_token=xxx
```

### Update Status Laporan (Admin)

```
PATCH /api/reports/:id/status
Cookie: better-auth.session_token=xxx
```

```json
{
  "status": "resolved",
  "admin_notes": "Konten telah ditinjau dan tidak melanggar pedoman."
}
```

---

## 🏷️ Categories (`/api/categories/...`)

### Get Semua Kategori (Public)

```
GET /api/categories
```

### Get Kategori dengan Jumlah Film (Public)

```
GET /api/categories/with-count
```

### Get Single Kategori (Public)

```
GET /api/categories/:id
```

### Buat Kategori (Admin)

```
POST /api/categories
Cookie: better-auth.session_token=xxx
```

```json
{
  "nama_kategori": "Film Dokumenter",
  "deskripsi": "Film non-fiksi berbasis fakta."
}
```

### Update Kategori (Admin)

```
PUT /api/categories/:id
Cookie: better-auth.session_token=xxx
```

### Hapus Kategori (Admin)

```
DELETE /api/categories/:id
Cookie: better-auth.session_token=xxx
```

---

## 👤 Users (`/api/users/...`)

### Get Profil Publik User

```
GET /api/users/:id
```

---

## ⚙️ Settings (`/api/settings/...`)

### Get Pengaturan Publik (Public)

```
GET /api/settings/public
```

### Get Semua Pengaturan (Admin)

```
GET /api/settings
Cookie: better-auth.session_token=xxx
```

### Get Pengaturan by Key (Admin)

```
GET /api/settings/:key
Cookie: better-auth.session_token=xxx
```

### Update Pengaturan (Admin)

```
PUT /api/settings/:key
Cookie: better-auth.session_token=xxx
```

---

## 🤖 AI Chat (`/api/chat/...`)

### Kirim Pesan (Auth)

```
POST /api/chat
Cookie: better-auth.session_token=xxx
```

```json
{ "message": "Rekomendasikan film pendek Indonesia yang bagus" }
```

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

### Get Riwayat Chat (Auth)

```
GET /api/chat/history?page=1&limit=20
Cookie: better-auth.session_token=xxx
```

### Hapus Semua Riwayat Chat (Auth)

```
DELETE /api/chat/history
Cookie: better-auth.session_token=xxx
```

### Hapus Single Chat (Auth)

```
DELETE /api/chat/:id
Cookie: better-auth.session_token=xxx
```

---

## 📤 Upload (`/api/upload/...` & `/api/files/...`)

### Upload Resumable via Tus.io

```
POST /api/files
PATCH /api/files/:uploadId
```

Header khusus Tus: `Tus-Resumable`, `Upload-Length`, `Upload-Offset`, `Content-Type: application/offset+octet-stream`

### Cek Disk Space (Admin)

```
GET /api/upload/disk-space
Cookie: better-auth.session_token=xxx
```

---

## 🛡️ Admin (`/api/admin/...`)

### Get Statistik Sistem (Admin)

```
GET /api/admin/stats
Cookie: better-auth.session_token=xxx
```

### Backup Database (Admin)

```
POST /api/admin/backup
Cookie: better-auth.session_token=xxx
```

### List Backup (Admin)

```
GET /api/admin/backups
Cookie: better-auth.session_token=xxx
```

### Restore Database (Admin)

```
POST /api/admin/restore
Cookie: better-auth.session_token=xxx
```

### Hapus Backup (Admin)

```
DELETE /api/admin/backups/:filename
Cookie: better-auth.session_token=xxx
```

---

## ❌ Error Responses

```json
{
  "success": false,
  "message": "Pesan error dalam Bahasa Indonesia"
}
```

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validasi input gagal",
  "errors": [
    { "field": "judul", "message": "Judul wajib diisi" }
  ]
}
```

| HTTP Status | Kondisi |
| --- | --- |
| `200` | Berhasil |
| `201` | Data berhasil dibuat |
| `400` | Bad Request / Validasi gagal |
| `401` | Belum login |
| `403` | Tidak memiliki izin |
| `404` | Data tidak ditemukan |
| `429` | Too Many Requests (rate limit) |
| `500` | Internal Server Error |

> **Catatan:** Semua pesan error & sukses menggunakan **Bahasa Indonesia** secara konsisten.
