# 🗄️ Database Schema

Dokumentasi schema database untuk SI Film Archive.

## 📊 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┐         ┌──────────┐         ┌─────────────┐         │
│   │  ROLES   │◄───────┤│  USERS   │────────►│ COLLECTIONS │         │
│   └──────────┘    1:N  └──────────┘    1:N  └─────────────┘         │
│                             │                      │                 │
│                             │ 1:N                  │ N:1             │
│                             ▼                      ▼                 │
│   ┌──────────┐         ┌──────────┐         ┌──────────┐            │
│   │CATEGORIES│◄────────┤│  FILMS   │◄───────┤│  VOTES   │            │
│   └──────────┘    1:N  └──────────┘    1:N  └──────────┘            │
│                             │                                        │
│                             │ 1:N                                    │
│                             ▼                                        │
│                       ┌────────────┐                                 │
│                       │DISCUSSIONS │◄──┐                             │
│                       └────────────┘   │ Self-referencing            │
│                             │          │ (parent_id)                 │
│                             └──────────┘                             │
│                                                                      │
│   ┌────────────┐       ┌──────────┐       ┌───────────────┐         │
│   │  SESSIONS  │       │ ACCOUNTS │       │ VERIFICATIONS │         │
│   │(Better Auth)│       │(OAuth)   │       │ (Email Token) │         │
│   └────────────┘       └──────────┘       └───────────────┘         │
│                                                                      │
│   ┌────────────┐                                                     │
│   │CHAT_HISTORY│  (AI Chat)                                          │
│   └────────────┘                                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Tabel Detail

### A. Tabel Roles

Menyimpan daftar role pengguna.

| Field         | Tipe         | Keterangan     |
| ------------- | ------------ | -------------- |
| `role_id`     | Integer (PK) | Auto Increment |
| `name`        | Varchar(50)  | Nama role      |
| `description` | Text         | Deskripsi role |
| `created_at`  | Timestamp    | Waktu dibuat   |

**Default Roles:**

| role_id | name      | Deskripsi                           |
| ------- | --------- | ----------------------------------- |
| 1       | user      | Default - bisa vote dan comment     |
| 2       | creator   | Bisa upload dan manage film sendiri |
| 3       | moderator | Bisa moderasi komentar dan diskusi  |
| 4       | admin     | Full access ke semua fitur          |

---

### B. Tabel Users

Data pengguna aplikasi.

| Field            | Tipe             | Keterangan              |
| ---------------- | ---------------- | ----------------------- |
| `id`             | Varchar(36) (PK) | UUID dari Better Auth   |
| `email`          | Varchar(255)     | Email unik              |
| `name`           | Varchar(255)     | Nama lengkap            |
| `role_id`        | Integer (FK)     | Referensi ke `roles`    |
| `image`          | Varchar(255)     | URL foto profil         |
| `email_verified` | Boolean          | Status verifikasi email |
| `created_at`     | Timestamp        | Waktu registrasi        |
| `updated_at`     | Timestamp        | Waktu update terakhir   |

---

### C. Tabel Categories

Kategori film.

| Field           | Tipe         | Keterangan         |
| --------------- | ------------ | ------------------ |
| `category_id`   | Integer (PK) | Auto Increment     |
| `nama_kategori` | Varchar(100) | Nama kategori      |
| `deskripsi`     | Text         | Deskripsi kategori |
| `created_at`    | Timestamp    | Waktu dibuat       |

---

### D. Tabel Films

Tabel utama penyimpanan data film.

| Field              | Tipe             | Keterangan                         |
| ------------------ | ---------------- | ---------------------------------- |
| `film_id`          | Integer (PK)     | Auto Increment                     |
| `user_id`          | Varchar(36) (FK) | ID Creator yang mengupload         |
| `category_id`      | Integer (FK)     | Kategori film                      |
| `judul`            | Varchar(255)     | Judul film                         |
| `sinopsis`         | Text             | Sinopsis film                      |
| `tahun_karya`      | Year             | Tahun pembuatan                    |
| `link_video_utama` | Varchar(500)     | URL video utama (YouTube/direct)   |
| `link_trailer`     | Varchar(500)     | URL trailer                        |
| `gambar_poster`    | Varchar(500)     | Path file poster                   |
| `filosofi_poster`  | Text             | Deskripsi makna poster             |
| `file_naskah`      | Varchar(500)     | Path file naskah (PDF)             |
| `file_storyboard`  | Varchar(500)     | Path file storyboard (PDF)         |
| `file_rab`         | Varchar(500)     | Path file RAB (PDF)                |
| `crew`             | JSON             | Data kru dalam format array        |
| `status`           | Enum             | `pending`, `published`, `rejected` |
| `is_banner`        | Boolean          | Ditampilkan di banner homepage     |
| `created_at`       | Timestamp        | Waktu upload                       |
| `updated_at`       | Timestamp        | Waktu update terakhir              |

**Format JSON `crew`:**

```json
[
  { "jabatan": "Sutradara", "anggota": ["John Doe"] },
  { "jabatan": "Penulis", "anggota": ["Jane Doe", "Bob"] }
]
```

---

### E. Tabel Discussions

Komentar dan diskusi pada film (Adjacency List pattern).

| Field        | Tipe                   | Keterangan                     |
| ------------ | ---------------------- | ------------------------------ |
| `diskusi_id` | Integer (PK)           | Auto Increment                 |
| `film_id`    | Integer (FK)           | ID film yang dikomentari       |
| `user_id`    | Varchar(36) (FK)       | ID user yang berkomentar       |
| `isi_pesan`  | Text                   | Isi komentar                   |
| `parent_id`  | Integer (FK, Nullable) | ID diskusi induk (untuk reply) |
| `created_at` | Timestamp              | Waktu posting                  |
| `updated_at` | Timestamp              | Waktu edit terakhir            |

---

### F. Tabel Votes

Sistem voting untuk trending.

| Field        | Tipe             | Keterangan                        |
| ------------ | ---------------- | --------------------------------- |
| `vote_id`    | Integer (PK)     | Auto Increment                    |
| `film_id`    | Integer (FK)     | ID film yang di-vote              |
| `user_id`    | Varchar(36) (FK) | ID user yang vote                 |
| `created_at` | Timestamp        | Waktu vote (untuk filter periode) |

**Unique Constraint:** `(film_id, user_id)` - Satu user hanya bisa vote sekali per film.

---

### G. Tabel Collections (Bookmark/Simpanan)

Fitur bookmark film untuk user.

| Field           | Tipe             | Keterangan              |
| --------------- | ---------------- | ----------------------- |
| `collection_id` | Integer (PK)     | Auto Increment          |
| `user_id`       | Varchar(36) (FK) | ID user pemilik koleksi |
| `film_id`       | Integer (FK)     | ID film yang disimpan   |
| `created_at`    | Timestamp        | Waktu ditambahkan       |

**Unique Constraint:** `(user_id, film_id)` - Satu user tidak bisa menyimpan film yang sama dua kali.

---

### H. Tabel Chat_History

Riwayat percakapan dengan AI.

| Field         | Tipe             | Keterangan            |
| ------------- | ---------------- | --------------------- |
| `chat_id`     | Integer (PK)     | Auto Increment        |
| `user_id`     | Varchar(36) (FK) | ID user               |
| `user_prompt` | Text             | Pertanyaan/input user |
| `ai_response` | Text             | Jawaban AI            |
| `created_at`  | Timestamp        | Waktu percakapan      |

---

### I. Tabel Better Auth (Auto-generated)

Tabel yang di-generate oleh Better Auth:

| Table           | Deskripsi                          |
| --------------- | ---------------------------------- |
| `sessions`      | Session management (token, expiry) |
| `accounts`      | OAuth accounts (Google, etc.)      |
| `verifications` | Email verification tokens          |

---

## 🔗 Relasi Antar Tabel

| Relasi                      | Deskripsi                                         |
| --------------------------- | ------------------------------------------------- |
| `Roles → Users`             | One-to-Many (1 role memiliki banyak user)         |
| `Users → Films`             | One-to-Many (1 creator mengupload banyak film)    |
| `Categories → Films`        | One-to-Many (1 kategori menaungi banyak film)     |
| `Users → Discussions`       | One-to-Many (1 user menulis banyak komentar)      |
| `Films → Discussions`       | One-to-Many (1 film memiliki banyak komentar)     |
| `Discussions → Discussions` | Self-referencing (reply to comment)               |
| `Users → Votes`             | One-to-Many (1 user vote banyak film)             |
| `Films → Votes`             | One-to-Many (1 film mendapat banyak vote)         |
| `Users → Collections`       | One-to-Many (1 user menyimpan banyak film)        |
| `Films → Collections`       | One-to-Many (1 film disimpan banyak user)         |
| `Users → Chat_History`      | One-to-Many (1 user memiliki banyak riwayat chat) |

---

## 📝 Migration Files

Lokasi: `backend/src/database/migrations/`

| File                                    | Deskripsi          |
| --------------------------------------- | ------------------ |
| `20241220_create_roles_table.js`        | Tabel roles        |
| `20241220_create_users_table.js`        | Tabel users        |
| `20241220_create_categories_table.js`   | Tabel categories   |
| `20241220_create_films_table.js`        | Tabel films        |
| `20241220_create_discussions_table.js`  | Tabel discussions  |
| `20241220_create_votes_table.js`        | Tabel votes        |
| `20241220_create_chat_history_table.js` | Tabel chat_history |
| `20251231_create_collections_table.js`  | Tabel collections  |

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
