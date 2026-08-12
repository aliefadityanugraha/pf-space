# 🏗️ Architecture Proposal — Production Feed

> Dokumen ini adalah **proposal arsitektur** untuk modul baru bernama **Production Feed**.
> Production Feed adalah **bounded context baru** di backend PF Space.
>
> - **Tidak ada implementasi** di dokumen ini — hanya rancangan.
> - **Feed BUKAN bagian dari Film.** Film adalah bounded context arsip karya jadi; Feed adalah bounded context yang menampilkan perjalanan proses produksi.
> - Feed **boleh memiliki relasi optional** ke Film (post boleh menunjuk ke `film_id`, boleh juga tidak).
> - Berlaku prinsip **low coupling** (ketergantungan minimum antar module) dan **high cohesion** (semua kepentingan feed menyatu dalam satu module).
>
> Referensi pola yang dipakai project: `docs/feed/BACKEND_ANALYSIS.md`.

---

## 1. Konsep & Definisi

**Production Feed** adalah umpan (feed) konten yang menceritakan **proses pembuatan karya film** — progress update, behind-the-scenes, casting call, pengumuman, hingga wrap party. Setiap entitas inti disebut **Production Post** (selanjutnya: **Post**).

Post adalah entitas berdiri sendiri (bounded context baru), **bukan** turunan Film. Post hanya boleh **menunjuk optional** ke `films.film_id` bila relevan (misal: update produksi dari sebuah karya yang sudah masuk arsip).

Contoh konten Post:

- "Behind the scenes syuting adegan 3"
- "Casting call: cari pemain untuk film pendek"
- "Progress week 1: hunting lokasi & storyboard final"
- "Wrap! Terima kasih seluruh kru"

---

## 2. Module Responsibility

| Aspek                     | Definisi                                                                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**               | Mengelola Post produksi film: publish, list, filter, cari, moderasi, komentar, dan media.                                                                                                                |
| **Owner**                 | Module baru `productionFeed` (model, service, controller, route, schema sendiri).                                                                                                                        |
| **Bukan tanggung jawab**  | Status approval karya jadi (milik `Film`), voting/trending arsip (milik `Vote`), forum diskusi topik (milik `Community`), notifikasi global (milik `Notification`), file storage (milik `Upload`/`tus`). |
| **Relasi lintas context** | Hanya _read_: validasi eksistensi Film (bila `film_id` diisi) dan mengambil judul/slug film untuk ditampilkan di feed.                                                                                   |

### Prinsip batasan

- Feed **tidak pernah menulis** ke tabel `films`.
- Feed **tidak pernah** memodifikasi behavior `Discussion`, `Vote`, `Community`, `Notification`.
- Semua interaksi keluar hanya melalui **public API/service yang sudah ada** (misal `notificationService.create`, `deleteFile`, middleware auth).

---

## 3. Struktur Kode (sesuai konvensi project)

```
backend/src/
├── models/
│   ├── ProductionPost.js          # Entitas utama Post (tabel production_posts)
│   └── (Discussion.js diadaptasi) # Komentar Post disimpan di discussions.post_id
├── services/
│   ├── productionFeed.service.js  # Business logic post/media/tag (tanpa komentar)
│   └── productionFeed.commentAdapter.js # Adapter komentar → Comment System existing
├── controllers/
│   ├── productionFeed.controller.js
│   └── discussion.controller.js   # +handler komentar post (getCommentsByPost, dll.)
├── routes/
│   ├── productionFeed.routes.js   # Prefix: /api/production-feed (tanpa endpoint komentar)
│   └── discussion.routes.js       # + /api/discussions/post/* untuk komentar feed
├── schemas/
│   └── productionFeed.zod.js      # Schema Zod khusus feed
└── database/migrations/
    ├── 2026xxxxxx_create_production_feed_tables.js
    └── 20260807000000_add_post_id_to_discussions.js
```

Registrasi wajib mengikuti barrel export existing (tanpa mengubah isi module lain):

- `models/index.js` → `export { ProductionPost } ...`
- `services/index.js` → `export * from './productionFeed.service.js'`
- `controllers/index.js` → `export * from './productionFeed.controller.js'`
- `routes/index.js` → `fastify.register(productionFeedRoutes, { prefix: '/production-feed' })`

> Perubahan lintas module minimal: barrel export & registrasi route (mekanik, satu baris per file) + satu kolom nullable `discussions.post_id` + handler komentar Post di `discussion.controller.js` (reuse struktur existing, tidak mengubah perilaku komentar film).

---

## 4. Data Model

### Tabel `production_posts`

Mengikuti konvensi database: `snake_case`, PK auto-increment, timestamp otomatis dari `BaseModel.$beforeInsert`.

| Field        | Tipe                       | Keterangan                                                             |
| ------------ | -------------------------- | ---------------------------------------------------------------------- |
| `post_id`    | Integer (PK)               | Auto increment                                                         |
| `user_id`    | Varchar(36) (FK)           | Penulis post (FK `users.id`)                                           |
| `film_id`    | Integer (FK, **Nullable**) | **Relasi optional** ke `films.film_id`                                 |
| `judul`      | Varchar(255)               | Judul post                                                             |
| `isi_konten` | Text                       | Isi konten (disanitasi)                                                |
| `tipe`       | Enum                       | `progress` / `behind_the_scenes` / `casting` / `announcement` / `wrap` |
| `media`      | JSON                       | Array path `/uploads/...` (nullable)                                   |
| `status`     | Enum                       | `draft` / `published` / `archived` (default `draft`)                   |
| `is_pinned`  | Boolean                    | Post disematkan di atas feed (default `false`)                         |
| `created_at` | Timestamp                  | Otomatis                                                               |
| `updated_at` | Timestamp                  | Otomatis                                                               |

**Catatan desain:**

- Kolom `media` bertipe JSON mengikuti preseden `films.crew` (JSON) — tanpa tabel join, tetap satu context.
- Kolom `status` meniru pola enum status di `FILM_STATUS` (`config/constants.js`), didefinisikan sebagai konstanta baru `POST_STATUS` di dalam konteks feed — tidak menambah modul lain.
- **Index**: `(status, created_at)` untuk listing feed, `user_id` untuk "post saya", `film_id` untuk filter per film, `tipe` untuk filter tipe — mengikuti migration `add_performance_indexes`.

### Komentar Post (adapter di atas `discussions`)

Komentar **tidak memakai tabel baru**. Komentar Post disimpan di tabel `discussions` existing melalui kolom adapter `post_id` (nullable) yang ditambahkan oleh migration `20260807000000_add_post_id_to_discussions.js`.

| Kolom adapter (baru)  | Tipe                       | Keterangan                                                                                            |
| --------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `discussions.post_id` | Integer (FK, **Nullable**) | Menunjuk `production_posts.post_id` bila baris adalah komentar Post; `NULL` untuk komentar film biasa |

- Komentar film (existing) tetap memakai `film_id`; komentar Post memakai `post_id`. Keduanya saling eksklusif dan tidak mengubah perilaku komentar film.
- Aturan domain feed (post harus `published` & `public`, notifikasi ke penulis post, pagination flat) dipertahankan di `productionFeed.commentAdapter.js` — logika komentar tetap milik context feed, hanya penyimpanannya memakai tabel/struktur existing.
- **Tidak ada endpoint komentar duplikat** di `/production-feed/*`; komentar Post diakses lewat `/api/discussions/post/*` (sistem komentar existing), dan penghapusan komentar memakai `DELETE /api/discussions/:id` yang sudah ada (owner/moderator/admin + delete rekursif CTE).

> **Mengapa adapter, bukan `production_post_comments` maupun polymorphic `discussions`?** Lihat bagian Interaksi Comment (5.4).

---

## 5. Interaksi dengan Module Lain

### 5.1 Auth

**Arah ketergantungan:** feed → Auth (satu arah, outbound). Auth tidak perlu tahu tentang feed.

**Pemakaian** (semua sudah ada, tanpa modifikasi):

- `authenticate` — proteksi route tulis (buat/ubah/hapus post, komentar).
- `requireCreator` — minimal role creator untuk membuat post (analog `film.routes.js`).
- `requireModerator` — moderasi (hapus post/komentar apa pun) — analog pola `discussion.delete`.
- `optionalAuth` — endpoint publik diperkaya data owner (`is_mine`) bila ada session — analog `learningMaterial.routes.js`.
- Cek ownership di controller: `post.user_id !== request.user.id && request.user.role_id !== ROLES.ADMIN` (pola persis `film.controller.js`).

### 5.2 Notification

**Arah ketergantungan:** feed → Notification (satu arah, outbound). Notification **tidak** bergantung ke feed.

**Mekanisme:** setelah aksi, feed memanggil `notificationService.create({ user_id, type, title, message, data })` — API yang sudah ada, tanpa perubahan di module Notification.

**Trigger yang diusulkan (event feed):**

| Event                                   | Penerima                                                            | `type`               | Payload `data`               |
| --------------------------------------- | ------------------------------------------------------------------- | -------------------- | ---------------------------- |
| Komentar baru di post saya              | Penulis post (jika bukan diri sendiri)                              | `production_comment` | `{ post_id, discussion_id }` |
| Post baru terhubung ke film saya        | Pemilik film (jika post `film_id` diisi & bukan diri sendiri)       | `production_post`    | `{ post_id, film_id, slug }` |
| Nama saya disebut (`@Nama`) di komentar | Setiap user yang namanya cocok di `users.name` (kecuali komentator) | `production_mention` | `{ post_id, discussion_id }` |

> Detail lengkap ketiga event (trigger, payload, batasan, non-goal) ada di `NOTIFICATIONS_PRODUCTION_FEED.md`.

**Aturan coupling:**

- Blokir sisi-feed dibungkus `try/catch` (side-effect tidak boleh menggagalkan request utama) — mengikuti pola `vote.service.js` & `community.controller.js`.
- Feed tidak pernah membaca/menyaring tabel notifikasi.
- `title`/`message` selalu Bahasa Indonesia, `data` menyimpan id untuk deep-link (pola `film.controller.js approve/reject`).

### 5.3 Upload

**Arah ketergantungan:** feed → Upload (outbound). Upload tetap milik module infrastructure yang tidak berubah.

**Mekanisme:**

- **Upload file**: memakai endpoint Tus yang sudah ada (`POST /api/files`) — tanpa perubahan di `lib/tus.js`.
- **Path disimpan** di kolom `media` (JSON array) sebagai `/uploads/{subfolder}/{file}`.
- **Validasi path**: gunakan guard yang sudah ada di `lib/validation.js` (`uploadOrUrl` / `isSafeUploadPath`) — tidak membuat validator baru.
- **Pembersihan file**: reuse `deleteFile()` dari `lib/upload.js` (sudah berisi guard path traversal & hapus metadata tus). Dipanggil saat post dihapus / media diganti — pola `film.service.js delete/update`.
- **Serving**: otomatis oleh `routes/static.routes.js` (PDF inline, video range 206, image) — feed tidak menyentuh serving.

### 5.4 Comment

**Keputusan desain penting — tiga opsi:**

| Opsi                                                                                                    | Deskripsi                                                                                                                  | Konsekuensi                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. Generalisasi `Discussions` menjadi polymorphic (`target_type` + `film_id` nullable)                  | Mengubah struktur `discussions` secara besar dan memodifikasi `discussion.service`/`controller`/`routes` untuk semua kasus | ❌ Menyentuh logika module existing yang melayani komentar film berjalan; risiko regresi tinggi; **meningkatkan coupling**.                                                                                                          |
| B. Entitas komentar milik feed (`production_post_comments`)                                             | Komentar sederhana satu level di dalam context feed, tabel baru                                                            | ⚠️ Konsisten preseden (`CommunityReply`), tetapi **menduplikasi** struktur komentar yang sudah ada (`discussions`) dan memecah moderasi komentar menjadi dua tempat.                                                                 |
| C. **Adapter di atas `discussions` existing** (kolom `post_id` nullable + handler di module Discussion) | Komentar Post memakai tabel/struktur/endpoint `discussions`; aturan domain feed dijaga di adapter                          | ✅ **Keputusan final.** Satu sistem komentar untuk semua; tanpa tabel duplikat; perubahan `discussions` minimal (1 kolom nullable + handler read) tanpa menyentuh perilaku komentar film; moderasi komentar terpusat di satu tempat. |

**Alasan keputusan (C):**

- Project sudah memiliki **satu** sistem komentar (`discussions`). Memakai `post_id` nullable + adapter adalah **reuse** yang konsisten dengan aturan project, bukan duplikasi tabel/endpoint baru.
- Perubahan ke `discussions` minimal: tambah kolom `post_id` (nullable) + 3 handler read/add di `discussion.controller.js`; alur komentar film (`film_id`) sama sekali tidak berubah → risiko regresi rendah.
- Aturan domain feed (validasi post published & public, notifikasi penulis post, pagination flat) tetap hidup di `productionFeed.commentAdapter.js` sehingga kohesi feed terjaga dan `discussion.service` tidak dicampuri.
- Moderasi terpusat: `DELETE /api/discussions/:id` yang sudah ada (rekursif CTE) menangani komentar film maupun Post.

**Alur komentar:** validasi post ada & `published` & `public` (adapter) → insert `discussions` (sanitasi `sanitizePlainText`) → notifikasi `production_comment` ke penulis post (side-effect try/catch) → return `201`.

**Moderasi:** pemilik / moderator / admin menghapus lewat `DELETE /api/discussions/:id` existing — tanpa endpoint baru.

### 5.5 Search

**Arah ketergantungan:** feed → Search (internal, via query DB).

**Mekanisme (konsisten dengan `FilmService.getAll`):**

- **Search dasar**: `LIKE` case-insensitive pada `judul` + `isi_konten`, dikombinasikan filter `status`, `user_id`, `film_id`, `tipe`, `is_pinned`, dan pagination — persis pola `applyFilters` di `film.service.js`.
- **Filter Author**: `LIKE` pada `users.name` via subquery (`user_id IN (SELECT id FROM users WHERE name LIKE '%...%')`) — tidak ada kolom `username`.
- **Filter Date**: rentang `date_from`/`date_to` (validasi `YYYY-MM-DD` + `date_from <= date_to`); difilter pada `published_at` untuk status `published`, atau `created_at` untuk selainnya.
- **Filter Visibility**: `public`/`private` hanya menyempitkan (narrows) akses — tidak pernah memperluas.
- **Sorting**: `created_at` (default desc) + `published_at`/`judul`; `is_pinned` diutamakan (pin di atas); tiebreaker `post_id` agar urutan deterministik.
- **Pagination**: dua mode. (1) Offset: `page/limit` → `{page, limit, total, totalPages}` via `parsePagination`/`buildPagination`. (2) **Cursor keyset**: param `cursor` (opaque `base64url(JSON)`) → `{limit, next_cursor, has_more}`, tanpa count query; `sortBy`/`sortOrder` harus konsisten antar halaman. Detail: `SEARCH_PRODUCTION_FEED.md`.
- **Search semantik (opsional, future)**: feed boleh memakai `embeddingService` yang sudah ada bila `USE_SEMANTIC_SEARCH=true` dan disediakan kolom `embedding` pada `production_posts` — mengikuti pola `film.service.js`. Diusulkan sebagai **non-goal v1** agar feed tetap ringan.

---

## 6. API Endpoint Plan

Prefix: `/api/production-feed`. Nama handler mengikuti konvensi REST CRUD project.

| Method | Path           | Auth             | Handler      | Deskripsi                                                                                          |
| ------ | -------------- | ---------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| GET    | `/`            | `optionalAuth`   | `getAll`     | List feed published (filter: `user_id`, `film_id`, `tipe`, `search`, `page`, `limit`, `is_pinned`) |
| GET    | `/:id`         | `optionalAuth`   | `getById`    | Detail post (draft hanya untuk owner/admin)                                                        |
| GET    | `/my`          | `requireCreator` | `getMyPosts` | Post milik user (analog `getMyFilms`)                                                              |
| POST   | `/`            | `requireCreator` | `create`     | Buat post (validasi `productionPostSchema`)                                                        |
| PUT    | `/:id`         | `authenticate`   | `update`     | Update post (ownership check)                                                                      |
| DELETE | `/:id`         | `authenticate`   | `delete`     | Hapus post + media (komentar ikut via FK CASCADE)                                                  |
| PATCH  | `/:id/publish` | `authenticate`   | `publish`    | Terbitkan post (`draft → published`)                                                               |
| PATCH  | `/:id/archive` | `authenticate`   | `archive`    | Arsipkan post                                                                                      |

**Komentar Post tidak ada di prefix `/production-feed`** (hindari endpoint duplikat). Komentar Post diakses lewat prefix `/api/discussions`:

| Method | Path                  | Auth                          | Handler                 | Deskripsi                                        |
| ------ | --------------------- | ----------------------------- | ----------------------- | ------------------------------------------------ |
| GET    | `/post/:postId`       | public                        | `getCommentsByPost`     | Komentar post (flat, paginated)                  |
| GET    | `/post/:postId/count` | public                        | `getCommentCountByPost` | Jumlah komentar post                             |
| POST   | `/post/:postId`       | `authenticate` (rate limited) | `addCommentToPost`      | Tambah komentar (lewat adapter)                  |
| DELETE | `/:id`                | `authenticate`                | `delete`                | Hapus komentar (existing, owner/moderator/admin) |

**Rate limit per-route**: endpoint komentar & buat post diberi `config: { rateLimit: {...} }` (pola `auth.routes.js`) untuk cegah spam.

**Response**: seluruhnya via `ApiResponse` (`success`, `error`, `notFound`, `badRequest`) dengan pesan Bahasa Indonesia dan field `snake_case`.

---

## 7. Dependency Summary (Low Coupling)

```
                        ┌──────────────────────────────┐
                        │   Production Feed Context    │
                        │  (models/service/controller/ │
                        │   routes/schemas + migration)│
                        └──────┬───────────────────────┘
                               │ depends ONLY on:
     ┌─────────────────────────┼──────────────────────────┐
     │                         │                          │
     ▼                         ▼                          ▼
   Auth (middleware)      lib/ infra              Notification
   (authenticate,        (ApiResponse,            (notificationService
    requireCreator,       errors, sanitize,        .create) — OUTBOUND,
    requireModerator,     upload.deleteFile,       notification tak tahu
    optionalAuth)         constants, validate-     tentang feed)
                          Request, BaseModel)
               ▲                       │
               │                       ▼
    Film (READ-ONLY:          Upload (tus + static.routes
    cek eksistensi film_id    serving — tidak diubah)
    & ambil judul/slug)
               ▲
               │
    Discussion (adapter komentar: tulis/read
    via model Discussion + DELETE /discussions/:id
    existing — perilaku komentar film utuh)
```

**Aturan ketergantungan:**

1. **Satu arah** — feed bergantung ke module lain, tidak ada module lain yang bergantung ke feed.
2. **Read-only ke Film** — hanya validasi eksistensi & baca atribut tampilan (`judul`, `slug`); tidak pernah menulis.
3. **Notification outbound** — dipanggil via `notificationService.create`; tidak ada callback/event bus yang masuk ke feed.
4. **Auth = middleware** — dipakai sebagai gerbang (cross-cutting), bukan domain dependency.
5. **Upload & Search** — memakai infrastruktur & pola query yang sudah ada, tanpa modifikasi.
6. **Discussion = adapter outbound** — komentar Post memakai `Discussion` model & endpoint existing; perubahan ke `discussions` hanya kolom `post_id` nullable + handler, tidak menyentuh logika komentar film.

---

## 8. High Cohesion

Semua kepentingan "feed" hidup dalam satu module:

- Entitas Post → context feed (`ProductionPost`); komentarnya disimpan via adapter di `discussions` dengan aturan domain tetap di feed.
- Business logic post → satu service `productionFeed.service.js`; aturan domain komentar feed → `productionFeed.commentAdapter.js`.
- Validasi input feed → satu file schema `productionFeed.zod.js`.
- Media, status, filter, pagination, notifikasi feed → ditangani dalam module yang sama.
- Batas yang jelas: feed tidak mencampur logika approval karya (`Film`), ranking (`Vote`), atau forum (`Community`).

**Kohesi komentar:** aturan domain komentar produksi (validasi post published & public, notifikasi penulis post) hidup di adapter milik feed; `discussion.service`/`discussion.controller` hanya menyediakan handler & penyimpanan yang direuse — kohesi feed terjaga tanpa memecah moderasi.

---

## 9. Non-Goals (v1)

- ❌ Komentar ber-nesting (multi-level) — feed cukup flat.
- ❌ Voting/like pada post (arsip film yang pakai `Vote`, feed tidak).
- ❌ Search semantik berbasis embedding (diusulkan untuk iterasi berikutnya).
- ❌ FULLTEXT / keyword `LIKE '%term%'` yang di-index — batasan performa & rencana index di `docs/feed/PERFORMANCE_PRODUCTION_FEED.md` §5.
- ❌ Real-time notification (WebSocket/SSE) — masih di ROADMAP global.
- ❌ Mengubah schema `films`, `notifications`, atau mengubah perilaku komentar film di `discussions` (hanya menambah kolom `post_id` nullable + handler read/add).

---

## 10. Rencana Testing (mengikuti Testing Guide)

**Unit tests (Vitest, pola `film.service.test.js`) — TERIMPLEMENTASI:** lihat
[TESTING_PRODUCTION_FEED.md](TESTING_PRODUCTION_FEED.md) untuk detail & hasil coverage.

- `productionFeed.service.test.js` — normalisasi & sanitasi `isi_konten`/`media`; logic filter `tipe`/`status`; **search & cursor** (14 test: filter author/date/visibility, `_encodeCursor`/`_decodeCursor` round-trip, keyset predicate via SQL compile, `ValidationError` untuk cursor rusak / sort mismatch, `has_more` & `next_cursor`); cleanup media via `vi.mock('../lib/upload.js')`.
- `productionFeed.service.unit.test.js` — lifecycle (create/update/publish/archive/softDelete/hardDelete), access control `_canAccess`, tag CRUD, `_recordAudit`.
- `productionFeed.controller.test.js` — mapping query→options, envelope, `_isModerator`, ownership check.
- `productionFeed.validation.test.js` — `productionFeed.zod.js` memblokir input invalid & transformasi tipe (coerce).
- `productionFeed.upload.test.js` — `_assertUploadedMedia`/`_attachMedia` + shared `uploadOrUrl`.
- `productionFeed.comment.test.js` — ownership check, notifikasi `production_comment` & `production_mention` (mock `notificationService`).

**Integration + API (pola `build()` di TESTING_GUIDE) — TERIMPLEMENTASI:**

- `productionFeed.routes.test.js` — Fastify + `inject` (pola `tus.routes.test.js`): alur public/creator/moderator happy path; status code 400/401/403/404 + envelope API Standard; middleware `validateRequest` & `globalErrorHandler` asli, `auth` & `services` dimock.

**Manual (PowerShell `tests/test-full.ps1`)** — smoke test endpoint baru sesuai checklist API.

---

## 11. Checklist Self-Review

- [x] Arsitektur project tidak diubah (MSC tetap, barrel export tetap).
- [x] Production Feed = bounded context baru, bukan bagian dari Film.
- [x] Relasi ke Film optional & read-only.
- [x] Low coupling: feed bergantung ke module lain satu arah; tidak ada module lain bergantung ke feed.
- [x] High cohesion: post, komentar, media, notifikasi, search feed satu module.
- [x] Interaksi Auth / Notification / Upload / Comment / Search didefinisikan.
- [x] Komentar Post memakai adapter di atas `discussions` existing (kolom `post_id` nullable + handler read/add; tanpa tabel & endpoint duplikat; perilaku komentar film utuh).
- [x] Tidak ada implementasi — dokumen ini murni proposal.
- [x] Mengikuti pola existing (ApiResponse, errors, validateRequest, constants, BaseModel, snake_case, Bahasa Indonesia).

---

## 12. Frontend (Status Implementasi)

**Frontend foundation — TERIMPLEMENTASI** (hanya menampilkan feed, tanpa halaman
create/edit/detail): lihat [FRONTEND_PRODUCTION_FEED.md](FRONTEND_PRODUCTION_FEED.md).

- Module `frontend/src/modules/production-feed/` (api service, types/mapping, `useProductionFeed`).
- Halaman `/feed` (`frontend/src/pages/Feed.vue`) + tombol Feed di Navbar + route lazy.
- Komponen `frontend/src/components/production-feed/`: `FeedCard`, `FeedCardSkeleton`, `FeedErrorState`.
- Infinite scroll cursor-based (`/api/production-feed?cursor=...`) + enrich jumlah komentar per halaman via `/api/discussions/post/:postId/count` (tanpa mengubah backend).
- 26 test frontend baru (types, composable, FeedCard) — seluruh suite frontend 49 test pass; `npm run build` sukses.

**Creator Experience (create/edit post) — TERIMPLEMENTASI**: lihat
[FRONTEND_PRODUCTION_FEED_CREATOR_EXPERIENCE.md](FRONTEND_PRODUCTION_FEED_CREATOR_EXPERIENCE.md).

- Halaman `/feed/create` (`CreateFeed.vue`) & `/feed/:id/edit` (`EditFeed.vue`) — keduanya memakai komponen `FeedEditor.vue` (2 kolom: editor TipTap + galeri di kiri; Cover/Film/Tipe/Kategori/Tag/Visibility/Status+aksi di kanan, sticky).
- Module editor: `modules/production-feed/editor.js` (pure helpers) + `useProductionFeedEditor.js` (state, upload, save/publish), `api.js` diperluas (detail/create/update/publish/tags/my-films).
- Simpan draft manual (`status: draft`) & publish (`PATCH /:id/publish`; slug hanya di-generate backend) — **tanpa autosave**.
- Guard unsaved-changes (`onBeforeRouteLeave` + `beforeunload`) saat `isDirty`; baseline di-reset setelah simpan/publish.
- Upload media (Cover/Gallery foto, Video, PDF) wajib TUS via `lib/uploadFileTus.js` (hasil refactor `ArchiveUploadForm.vue`, perilaku identik); preview semua media.
- CTA creator: tombol "Buat Post" (Feed + Navbar) & tombol "Edit" (owner-only) di `FeedCard`.
- Backend read-only; 54 test baru (editor, composable, FeedEditor, +2 FeedCard) — seluruh suite frontend 103 test pass; `npm run build` sukses.

**Detail / Reading Experience (halaman `/feed/:slug`) — TERIMPLEMENTASI**: lihat
[FRONTEND_PRODUCTION_FEED_DETAIL.md](FRONTEND_PRODUCTION_FEED_DETAIL.md).

- Halaman `/feed/:slug` (`frontend/src/pages/FeedPostDetail.vue`) — layout membaca ala Medium: hero cover, badge kategori/tipe/"Terkait Film", byline creator (avatar/nama/tanggal/estimasi baca), isi artikel TipTap (`feed-prose`), komentar, Related Feed (maks. 4).
- Komponen baru: `FeedPostMedia.vue` (galeri + lightbox fullscreen + video `VideoPlayer` + PDF iframe/unduh), `FeedPostComments.vue` (reuse `CommentItem` + `ReportModal`, pola ArchiveDetail, endpoint `/api/discussions/post/:postId`), `RelatedFeed.vue` (prioritas film_id → tipe → feed terbaru, dedup, via list endpoint existing).
- Module helpers: `mapMediaItem`/`mapPostDetail` (types.js) + `fetchPostComments`/`submitPostComment`/`deletePostComment`/`fetchRelatedPosts` (api.js); judul kartu feed kini menautkan ke `/feed/:slug` (fallback postId).
- Backend read-only (tanpa endpoint baru); 35 test baru (api, media, comments, related, +7 types, +2 FeedCard) — seluruh suite frontend **140 test pass**; `npm run build` sukses.

**Homepage preview section — TERIMPLEMENTASI**: lihat
[FRONTEND_HOMEPAGE_PRODUCTION_FEED_SECTION.md](FRONTEND_HOMEPAGE_PRODUCTION_FEED_SECTION.md).

- Section baru di `Home.vue` (di antara "Karya Terbaru" & Promo) — preview maks. 6 posting terbaru memakai `useProductionFeed({ limit: 6 })` + `FeedCard` existing; tombol "Lihat Semua →" menuju `/feed`; animasi fade-in-up staggered & state skeleton/error/empty lengkap; struktur homepage tidak berubah.
- Backend bugfix yang menyertai: publish & soft-delete post gagal 400 karena `new Date()` vs schema `string|null` — diubah ke `new Date().toISOString()` di `productionFeed.service.js`.
- Screenshot tersedia (`docs/feed/homepage-production-feed.png`); frontend suite tetap 140 test pass.

## 13. Production Ready Review (UX / Perf / Loading / Responsive / A11y)

Review dilakukan di atas seluruh halaman Production Feed (`/feed`, `/feed/:slug`, create/edit)
dengan **tanpa fitur baru & tanpa mengubah business logic**. Status: **TERIMPLEMENTASI**.
Daftar lengkap temuan & perbaikan: [PRODUCTION_READY_REVIEW.md](PRODUCTION_READY_REVIEW.md).

- **Lazy Image** — komponen baru `frontend/src/components/LazyImage.vue` (IntersectionObserver rootMargin 250px, fallback ke native `loading="lazy"` bila IO tidak tersedia, `decoding="async"`, placeholder shimmer + fallback ikon saat error/empty). Dipakai di `FeedCard`, `RelatedFeed`, thumb galeri `FeedPostMedia`, & hero cover `FeedPostDetail` (hero pakai `immediate`).
- **Skeleton lebih baik** — `ui/Skeleton.vue` kini menyertakan sweep shimmer (`.skeleton-shimmer` + animasi, dimatikan saat `prefers-reduced-motion`); `FeedPostDetailSkeleton.vue` baru menggantikan skeleton inline; skeleton `RelatedFeed` memakai Skeleton.
- **Copy Link & Share** — `FeedPostDetail` punya tombol "Salin Tautan" (clipboard + fallback `execCommand`, lalu `navigator.share`), "WhatsApp", dan "X" — pola sama dengan `ArchiveDetail.vue`.
- **SEO & OpenGraph** — `FeedPostDetail`: `og:type article`, `og:site_name`, `og:url`, `og:image` (cover absolut), `twitter:card summary_large_image`, canonical link; `/feed`: `og:type website` + twitter:card; `/feed/create` & `/feed/:id/edit`: `robots noindex, nofollow`.
- **Keyboard Navigation** — global `:focus-visible` outline (teal) di `style.css`; lightbox galeri `FeedPostMedia` kini `role="dialog" aria-modal="true"`, focus ke tombol tutup saat terbuka, focus restore ke thumb, scroll-lock body, & Tab-trap; komentar: submit dengan **Ctrl/⌘ + Enter** (+ hint), `aria-label` pada textarea; tombol "Kembali ke Atas" diberi `aria-label`.
- **Scroll Restoration** — `useProductionFeed` menambah cache in-memory per opsi (key: limit+initialParams) + `restoreCache()`; `Feed.vue` memanggil `restoreCache()` sebelum `fetchFeed()` sehingga list langsung tampil saat back-navigation (dipadukan `scrollBehavior` router yang sudah ada).
- **Loading Animation** — NProgress (`useLoading`) sudah terpasang di router (before/afterEach); skeleton shimmer baru memperkuat persepsi loading.
- **Empty & Error State** — sudah ada (`FeedErrorState`, `EmptyState`) dan kini konsisten; `RelatedFeed` menambah error state + tombol "Coba Lagi" (sebelumnya error di-swallow jadi list kosong).
- **Responsive & Brutal Design System** — seluruh perubahan memakai token yang ada (`shadow-brutal-*`, `border-2 border-black`, `bg-white`, `font-display/heading/body`, kontainer `max-w-7xl`/`max-w-5xl`); tidak ada utility baru yang melenceng; responsive breakpoint mengikuti pola yang ada.
- Verifikasi: suite frontend **140 test pass**, `npm run build` sukses; probe headless (playwright-core + Chrome) memverifikasi OG/canonical, tombol share, 6 kartu feed, dan `loading="lazy"`; screenshot: `docs/feed/production-feed-detail-review.png` & `production-feed-list-review.png`.
