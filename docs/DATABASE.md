# 📊 Database Schema

Dokumentasi lengkap schema database PF Space.

---

## 📋 Overview

- **Database Engine**: MySQL 8.0+
- **ORM**: Objection.js (dengan Knex.js query builder)
- **Total Tables**: 13 (termasuk Better Auth auto-generated)

---

## 🗂️ Daftar Tabel

### A. Tabel Roles

Role-based access control.

| Field       | Tipe         | Keterangan                                         |
| ----------- | ------------ | -------------------------------------------------- |
| `role_id`   | Integer (PK) | Auto Increment                                     |
| `role_name` | Varchar(50)  | Nama role: `USER`, `CREATOR`, `MODERATOR`, `ADMIN` |

---

### B. Tabel Users

Data pengguna terdaftar.

| Field           | Tipe             | Keterangan              |
| --------------- | ---------------- | ----------------------- |
| `id`            | Varchar(36) (PK) | UUID (Better Auth)      |
| `name`          | Varchar(100)     | Nama lengkap            |
| `email`         | Varchar(255)     | Email (unique)          |
| `emailVerified` | Boolean          | Status verifikasi email |
| `image`         | Text             | URL foto profil         |
| `role_id`       | Integer (FK)     | Referensi ke `roles`    |
| `banned`        | Boolean          | Status banned           |
| `banReason`     | Text             | Alasan banned           |
| `banExpires`    | Timestamp        | Masa berlaku ban        |
| `created_at`    | Timestamp        | Waktu registrasi        |
| `updated_at`    | Timestamp        | Waktu update terakhir   |

---

### C. Tabel Films

Arsip film utama.

| Field              | Tipe             | Keterangan                        |
| ------------------ | ---------------- | --------------------------------- |
| `film_id`          | Integer (PK)     | Auto Increment                    |
| `user_id`          | Varchar(36) (FK) | ID creator                        |
| `category_id`      | Integer (FK)     | ID kategori                       |
| `judul`            | Varchar(255)     | Judul film                        |
| `slug`             | Varchar(255)     | URL-friendly slug (unique)        |
| `sinopsis`         | Text             | Deskripsi sinopsis                |
| `tahun`            | Year             | Tahun produksi                    |
| `poster_url`       | Text             | URL gambar poster                 |
| `video_url`        | Text             | URL video (YouTube / Tus.io)      |
| `crew`             | JSON             | Daftar kru film                   |
| `status`           | Varchar(20)      | `pending`, `approved`, `rejected` |
| `rejection_reason` | Text             | Alasan penolakan                  |
| `is_featured`      | Boolean          | Status featured                   |
| `view_count`       | Integer          | Jumlah views                      |
| `duration`         | Integer          | Durasi dalam detik                |
| `created_at`       | Timestamp        | Waktu upload                      |
| `updated_at`       | Timestamp        | Waktu update terakhir             |

---

### D. Tabel Categories

Kategori genre film.

| Field         | Tipe         | Keterangan                 |
| ------------- | ------------ | -------------------------- |
| `category_id` | Integer (PK) | Auto Increment             |
| `name`        | Varchar(50)  | Nama kategori (unique)     |
| `slug`        | Varchar(50)  | URL-friendly slug (unique) |

---

### E. Tabel Discussions

Sistem komentar film (Adjacency List, maks 5 level).

| Field        | Tipe             | Keterangan                      |
| ------------ | ---------------- | ------------------------------- |
| `comment_id` | Integer (PK)     | Auto Increment                  |
| `film_id`    | Integer (FK)     | ID film                         |
| `user_id`    | Varchar(36) (FK) | ID pengomentar                  |
| `content`    | Text             | Isi komentar                    |
| `parent_id`  | Integer (FK)     | ID komentar induk (null = root) |
| `depth`      | Integer          | Kedalaman level (maks 5)        |
| `created_at` | Timestamp        | Waktu komentar                  |
| `updated_at` | Timestamp        | Waktu update terakhir           |

---

### F. Tabel Votes

Sistem voting film (trending per periode).

| Field        | Tipe             | Keterangan           |
| ------------ | ---------------- | -------------------- |
| `vote_id`    | Integer (PK)     | Auto Increment       |
| `user_id`    | Varchar(36) (FK) | ID user yang vote    |
| `film_id`    | Integer (FK)     | ID film yang di-vote |
| `created_at` | Timestamp        | Waktu vote           |

**Unique Constraint:** `(user_id, film_id)` - Satu user hanya bisa vote satu kali per film.

---

### G. Tabel Collections

Bookmark/simpan film per pengguna.

| Field           | Tipe             | Keterangan              |
| --------------- | ---------------- | ----------------------- |
| `collection_id` | Integer (PK)     | Auto Increment          |
| `user_id`       | Varchar(36) (FK) | ID user pemilik koleksi |
| `film_id`       | Integer (FK)     | ID film yang disimpan   |
| `created_at`    | Timestamp        | Waktu ditambahkan       |

**Unique Constraint:** `(user_id, film_id)` - Satu user tidak bisa menyimpan film yang sama dua kali.

---

### H. Tabel Film_Evaluations

Penyimpanan feedback kurator/moderator untuk karya film.

| Field                    | Tipe             | Keterangan                   |
| ------------------------ | ---------------- | ---------------------------- |
| `id`                     | Integer (PK)     | Auto Increment               |
| `film_id`                | Integer (FK)     | Referensi ke `films.film_id` |
| `moderator_id`           | Varchar(36) (FK) | ID Moderator yang menilai    |
| `script_score`           | Integer          | Skor naskah (1-10)           |
| `script_comment`         | Text             | Komentar naskah              |
| `cinematography_score`   | Integer          | Skor sinematografi (1-10)    |
| `cinematography_comment` | Text             | Komentar sinematografi       |
| `editing_score`          | Integer          | Skor editing (1-10)          |
| `editing_comment`        | Text             | Komentar editing             |
| `production_score`       | Integer          | Skor produksi/dokumen (1-10) |
| `production_comment`     | Text             | Komentar produksi            |
| `overall_feedback`       | Text             | Kesimpulan kurator           |
| `created_at`             | Timestamp        | Waktu publikasi              |
| `updated_at`             | Timestamp        | Waktu update terakhir        |

---

### I. Tabel Notifications

Sistem notifikasi dalam aplikasi.

| Field        | Tipe             | Keterangan                           |
| ------------ | ---------------- | ------------------------------------ |
| `id`         | Integer (PK)     | Auto Increment                       |
| `user_id`    | Varchar(36) (FK) | ID penerima notifikasi               |
| `type`       | Varchar(50)      | Tipe: `EVALUATION_POSTED`, `COMMENT` |
| `title`      | Varchar(255)     | Judul notifikasi                     |
| `message`    | Text             | Isi pesan                            |
| `data`       | JSON             | Metadata (link, payload, dsb)        |
| `read`       | Boolean          | Status dibaca                        |
| `created_at` | Timestamp        | Waktu notifikasi                     |

---

### J. Tabel Chat_History

Riwayat percakapan dengan AI.

| Field         | Tipe             | Keterangan            |
| ------------- | ---------------- | --------------------- |
| `chat_id`     | Integer (PK)     | Auto Increment        |
| `user_id`     | Varchar(36) (FK) | ID user               |
| `user_prompt` | Text             | Pertanyaan/input user |
| `ai_response` | Text             | Jawaban AI            |
| `created_at`  | Timestamp        | Waktu percakapan      |

---

### K. Tabel Production_Posts

Feed produksi dan aktivitas karya film.

| Field          | Tipe                   | Keterangan                                                         |
| -------------- | ---------------------- | ------------------------------------------------------------------ |
| `post_id`      | Integer (PK)           | Auto Increment                                                     |
| `user_id`      | Varchar(36) (FK)       | ID user creator                                                    |
| `film_id`      | Integer (FK, nullable) | ID film terkait (opsional)                                         |
| `category_id`  | Integer (FK, nullable) | ID kategori opsional                                               |
| `judul`        | Varchar(255)           | Judul postingan (wajib)                                            |
| `slug`         | Varchar(255)           | URL-friendly slug                                                  |
| `isi_konten`   | Text                   | Isi konten postingan                                               |
| `tipe`         | Enum                   | `progress`, `behind_the_scenes`, `casting`, `announcement`, `wrap` |
| `status`       | Enum                   | `draft`, `published`, `archived`                                   |
| `visibility`   | Enum                   | `public`, `private`                                                |
| `gambar_cover` | Text                   | URL gambar cover                                                   |
| `is_pinned`    | Boolean                | Status pin postingan                                               |
| `published_at` | Timestamp              | Waktu publikasi                                                    |
| `deleted_at`   | Timestamp              | Soft delete timestamp                                              |
| `created_at`   | Timestamp              | Waktu pembuatan                                                    |
| `updated_at`   | Timestamp              | Waktu update terakhir                                              |

---

### L. Tabel Production_Post_Media

Media (foto, video, pdf) dalam postingan produksi.

| Field        | Tipe         | Keterangan                 |
| ------------ | ------------ | -------------------------- |
| `media_id`   | Integer (PK) | Auto Increment             |
| `post_id`    | Integer (FK) | ID postingan induk         |
| `media_type` | Enum         | `photo`, `video`, `pdf`    |
| `url`        | Text         | URL file media             |
| `caption`    | Varchar(255) | Deskripsi/keterangan media |
| `sort_order` | Integer      | Urutan tampilan            |
| `created_at` | Timestamp    | Waktu upload               |

---

### M. Tabel Production_Post_Tags (Junction)

Relasi many-to-many antara postingan produksi dan tag.

| Field     | Tipe         | Keterangan            |
| --------- | ------------ | --------------------- |
| `post_id` | Integer (FK) | ID postingan produksi |
| `tag`     | Varchar(50)  | Nama tag              |

**Primary Key:** Composite `(post_id, tag)`

---

### N. Tabel Better Auth (Auto-generated)

Tabel yang di-generate oleh Better Auth:

| Table           | Deskripsi                          |
| --------------- | ---------------------------------- |
| `sessions`      | Session management (token, expiry) |
| `accounts`      | OAuth accounts (Google, etc.)      |
| `verifications` | Email verification tokens          |

---

## 🔗 Relasi Antar Tabel

| Relasi                     | Deskripsi                            |
| -------------------------- | ------------------------------------ |
| `Roles → Users`            | One-to-Many                          |
| `Users → Films`            | One-to-Many (Creator)                |
| `Films → Film_Evaluations` | One-to-One / Many (Feedback kurator) |
| `Users → Notifications`    | One-to-Many (Penerima notifikasi)    |
| `Categories → Films`       | One-to-Many                          |
| `Users → Discussions`      | One-to-Many                          |
| `Films → Discussions`      | One-to-Many                          |
| `Users → Votes`            | One-to-Many                          |
| `Users → Collections`      | One-to-Many                          |
| `Users → Production_Posts` | One-to-Many (Creator)                |
| `Films → Production_Posts` | One-to-Many (opsional)               |
| `Production_Posts → Media` | One-to-Many                          |
| `Production_Posts → Tags`  | Many-to-Many (junction table)        |

---

## 📝 Migration Files

Lokasi: `backend/src/database/migrations/`

| File                                     | Deskripsi                 |
| ---------------------------------------- | ------------------------- |
| `...` (Legacy migrations)                | Core tables               |
| `20251231_create_collections_table.js`   | Bookmark system           |
| `20260129161137_create_notifications.js` | Notifications system      |
| `20260221114500_create_settings.js`      | Global settings           |
| `20260221160941_create_evaluations.js`   | Film Evaluations feedback |

### Menjalankan Migration

```bash
cd backend

# Jalankan semua migration
npm run migrate

# Rollback migration terakhir
npm run migrate:rollback

# Jalankan seed data
npm run seed
```
