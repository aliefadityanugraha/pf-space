# 📋 Analisis Backend PF Space — Persiapan Production Feed

> Dokumen ini adalah hasil kajian menyeluruh terhadap dokumentasi project dan seluruh kode backend.
> Tujuan: memahami arsitektur, pola, dan reusable module sebagai landasan implementasi **Production Feed**.
> Status: **Analisis hanya — tidak ada perubahan kode.**

---

## 1. Architecture Summary

**Monorepo:** `backend/` (Fastify) + `frontend/` (Vue 3) + `docs/` + `deploy/`

**Pattern inti: MSC (Model–Service–Controller)** dengan flow:

```
Request → Route → Middleware (Auth/Validate/RateLimit) → Controller → Service → Model → DB
```

**Teknologi backend:** Fastify 5 (ESM), Objection.js + Knex + MySQL 8, Better Auth (session cookie `better-auth.session_token`), Tus.io (resumable upload), Zod (validasi terpusat), sanitize-html (XSS), sharp (optimasi gambar), `@fastify/{helmet,cors,cookie,multipart,rate-limit,compress,static}`.

**Siklus hidup server** (`backend/src/index.js`): `validateEnv()` → register plugin → `initDatabase()` → static routes → tus routes (`/api/files`) → API routes (`/api`) → SEO routes → `globalErrorHandler`. Hook `onRequest` (SEO bot) & `onSend` (X-Request-ID).

**Lapisan yang sudah mapan:**

| Layer | Lokasi | Isi |
|---|---|---|
| Controllers | `controllers/` | 17 file + barrel export `controllers/index.js` |
| Services | `services/` | 18 service + barrel export `services/index.js` |
| Models | `models/` | 19 model Objection + barrel export `models/index.js` |
| Routes | `routes/` | 17 file route + barrel `routes/index.js` + tus/static/seo terpisah |
| Middlewares | `middlewares/` | `auth`, `validation`, `viewLimit`, `seo` + `errorHandler.js` |
| Lib | `lib/` | `response.js`, `errors.js`, `sanitize.js`, `upload.js`, `tus.js`, `audit.js`, `auth.js`, `ip.js`, `validation.js`, `sitemap.js`, `ai/` |
| Config | `config/` | `env.js` (validasi startup), `constants.js` (ROLES, FILM_STATUS, pagination helpers) |
| Database | `database/` | knexfile + 30 migration + 1 seed |
| Tests | `__tests__/` | 13 file unit test (Vitest) |

**21 route prefix** terdaftar di `routes/index.js`: `/auth`, `/films`, `/votes`, `/discussions`, `/community`, `/notifications`, `/evaluations`, `/study-notes`, `/film-scenes`, `/learning-materials`, `/reports`, `/settings`, `/collections`, `/categories`, `/users`, `/chat`, `/admin`, dst.

---

## 2. Controller Pattern

- **Class + instance singleton** diekspor dari `controllers/index.js`: `export const filmController = new FilmController()`. Dibinding per-route: `filmController.getAll.bind(filmController)`.
- **Thin controller** — logika bisnis di service; controller hanya: parse query/params → panggil service → `ApiResponse`.
- **Nama fungsi REST CRUD:** `getAll`, `getById`, `create`, `update`, `delete`. Pengecualian bisnis diizinkan (`getByFilm`, `getMyFilms`, `getStats`, `approve`, `reject`, `toggleDiscussion`, `getActiveDiscussion`, `getReplies`, `addReply`).
- **Otorisasi di controller** — cek ownership & role (contoh `film.controller.js:183`, `discussion.controller.js:178`), dengan guard `request.user.role_id` + `ROLES`.
- **Side-effect (notifikasi/audit)** — ditaruh di controller (film.approve/reject) ATAU di service (discussion.create) → **inkonsisten** (lihat Technical Debt).
- Mengikuti konvensi JSDoc dengan `@param {import('fastify').FastifyRequest}`.

---

## 3. Service Pattern

- **Class + singleton** diekspor dari `services/index.js`.
- **Satu service per domain**, fokus query & transaksi DB.
- Query paralel dengan `Promise.all` (pagination film, `getUserStats`, `getByFilm` 3 query paralel).
- **Transaksi** via `Model.transaction(async (trx) => ...)` untuk multi-langkah (film.create: insert → slug → embedding).
- **Modifier reusable:** `.modifiers(BaseModel.defaultModifiers)` dengan `selectBasic` / `selectFilm`.
- **Relasi eager:** `.withGraphFetched('[creator(selectBasic), category]')`.
- **N+1 fix pattern:** Recursive CTE untuk hapus komentar (`discussion.service.js:219`), `getCommentDepth`, Fisher-Yates shuffle untuk film acak/related.
- **Sanitasi & normalisasi data** di service (`FilmService.normalizeData` — crew cleaning + XSS).
- Return object `{ data, pagination }` untuk list.

---

## 4. Validation Pattern

- **Zod + middleware `validateRequest(schema, source)`** (`middlewares/validation.middleware.js`): `safeParse` → `ValidationError('Validation failed', errors[])` → replace `request[source]` dengan data tervalidasi (transform `coerce` number).
- **Lokasi schema dua tempat:**
  - `schemas/film.zod.js` → param schema (`filmIdParamSchema`, `numericIdParamSchema`, `filmIdNumericParamSchema`, `filmBodySchema`, `createFilmSchema`)
  - `lib/validation.js` → schema bisnis (`filmCreateSchema`, `filmUpdateSchema`, `commentSchema`, `categorySchema`, `chatSchema`, `updateRoleSchema`, `rejectionSchema`, `evaluationUpsertSchema`, `material*`, `report*`, `communityReplySchema`, `updateProfileSchema`) + legacy helper `validate()`.
- **Param transform:** `z.string().regex(/^\d+$/).transform(Number)`.
- **Upload path guard:** `isSafeUploadPath` membatasi hanya `/uploads/{videos|images|documents|avatars}/<file>`.
- Pesan schema masih campur B.Indonesia/Inggris.

---

## 5. Model Pattern

- `BaseModel extends Model` → **hook timestamp otomatis** `$beforeInsert`/`$beforeUpdate`, `modelPaths` untuk ESM, `defaultModifiers`.
- Setiap model: `tableName`, `idColumn`, `jsonSchema`, `relationMappings` (pakai `modelClass: 'string'` → resolved via `modelPaths`).
- **Catatan:** `User` sengaja TIDAK memanggil `super.$beforeInsert()` karena Better Auth pakai camelCase (`createdAt`/`updatedAt`), sementara model lain snake_case.
- Domain statis (Role, Category, Setting, AuditLog) juga memakai BaseModel.

---

## 6. Route Pattern

- `routes/index.js` mendaftarkan tiap modul dengan prefix + endpoint `/health` (cek DB + memori).
- Route: `fastify.get('/:id', { preHandler: [...] }, controller.handler.bind(controller))`.
- `preHandler` berurutan: auth → role → validate (contoh `film.routes.js:66-68`).
- **Shorthand auth:** `authenticate`, `requireRole(...)`, `requireAdmin`, `requireModerator`, `requireCreator`, `optionalAuth`.
- Cache header via preHandler inline (`film.routes.js:17-21`).
- **Rate limit per-route** HANYA ada di `auth.routes.js` (`max:15/menit`) dan `tus.routes.js` (`false`). Diskrepansi dengan klaim changelog (lihat Technical Debt).
- Tus & static & SEO terdaftar terpisah dari barrel API routes.

---

## 7. Upload Pattern

- **Tus.io resumable** (`lib/tus.js`): `FileStore` ke `UPLOAD_DIR`, `namingFunction` UUID + ekstensi (dari metadata filename/filetype), `maxSize` 2GB, `onUploadFinish` memindah file ke subfolder (`videos/`, `documents/`, `images/`) + memindah file metadata `.json` + optimasi image (sharp/webp) di background.
- **`lib/upload.js`:** `UPLOAD_DIR`, `UPLOAD_SUBDIRS`, `getSubfolderForType(mime)`, `generateUniqueName()`, `saveFile(file, subfolder)` (stream via sharp untuk image), `deleteFile(url)` (dengan guard path traversal + hapus metadata tus), `getStorageStats()` + `getDiskSpaceForPath()` (async `promisify(exec)`).
- **Serving:** `routes/static.routes.js` manual handler `/uploads/*` → PDF inline, video range-request (206), image content-type, blokir `.html/.svg/.js/.json` dll, force download untuk ekstensi dokumen.
- **CORS Tus:** hook di `tus.routes.js` dengan whitelist origin + IP LAN.
- **Avatar:** multipart 10MB (`saveFile(part,'avatars')`), gambar dioptimasi.
- **Disk space admin:** `admin.controller.js getStorageStats`.

---

## 8. Notification Pattern

- **`NotificationService`** (`services/notification.service.js`): `create({user_id, type, title, message, data})`, `getUserNotifications` (dengan `unreadCount`), `markAsRead`, `markAllAsRead`.
- Model `Notification` → field `is_read`, `data` JSON.
- **Trigger notifikasi** di beberapa titik:
  - `film.controller.js approve/reject` → creator (type `approval`/`rejection`) + audit log
  - `discussion.service.js create` → parent author + film creator (type `reply`/`comment`)
  - `discussion.controller.js create` → **juga kirim notifikasi** (duplikasi, lihat Technical Debt)
  - `community.controller.js addReply` → creator diskusi (`community_reply`)
  - `vote.service.js vote` → creator film (`vote`)
- Pola side-effect: dibungkus `try/catch` agar tidak menggagalkan request utama.

---

## 9. Response Pattern

- **`ApiResponse`** (`lib/response.js`):
  - `success(reply, data, message, code=200, pagination=null)` → `{success, message, data, pagination?}`
  - `error(reply, message, code=500, details=null)` → `{success, message, details?}`
  - Shorthand: `notFound`, `badRequest`, `unauthorized`.
- **Standar:** field `snake_case`, pesan Bahasa Indonesia, kode HTTP akurat (`201` create, `403` unauthorized access, `404` not found, `429` rate limit).
- **Pagination:** `{page, limit, total, totalPages}`; helper `parsePagination`/`buildPagination` di `config/constants.js` (meski sebagian service menghitung manual).

---

## 10. Error Handling Pattern

- **Custom error classes** (`lib/errors.js`): `AppError` (base, `statusCode`+`code`+`details`), `NotFoundError`(404), `ValidationError`(400, `VALIDATION_ERROR`), `AuthenticationError`(401, `UNAUTHORIZED`), `AuthorizationError`(403, `FORBIDDEN`), `ConflictError`(409).
- **`globalErrorHandler`** (`middlewares/errorHandler.js`) prioritas: AppError → ZodError (map `field`+`message`) → Fastify JSON validation → `ER_DUP_ENTRY` (409) → 500 (hide stack di production, `request.log.error`).
- **Dua gaya yang berdampingan:** `throw new NotFoundError(...)` (film, learningMaterial) vs `return ApiResponse.notFound(reply, ...)` (discussion, community). Perlu distandarkan (lihat Technical Debt).
- **Error code tidak konsisten dengan dokumentasi:** docs menyebut `DATA_NOT_FOUND` & `DUPLICATE_ENTRY`, kode memakai `NOT_FOUND` & `CONFLICT`.

---

## ♻️ Reusable Modules untuk Production Feed

Asumsi: **Production Feed** = feed/timeline karya produksi (kemungkinan feed film yang sedang/sudah diproduksi). Tidak ada modul "feed" eksisting; komponen siap pakai:

| Kebutuhan Feed | Modul Reusable | Catatan |
|---|---|---|
| Listing + pagination + filter | `FilmService.getAll` (`film.service.js:66`) | Sudah support `status`, `category_id`, `search`, `user_id`, `sortBy/Order`, `is_banner_active`, owner-aware |
| Item feed (judul, poster, creator) | `Film` + `.withGraphFetched('[creator(selectBasic), category]')` | Relasi sudah lengkap |
| Feed trending / ranking | `VoteService.getTrending` (`vote.service.js:112`) | Period week/month/all + `ORDER BY FIELD` |
| Feed terbaru | `FilmService.getLatest`, `getRelated`, `getRandom` | |
| Konten komentar/balasan di feed | `DiscussionService.getByFilm` | Tree nested + pagination DB-level |
| Bookmark/koleksi item feed | `CollectionService` | `is_in_collection` sudah dipakai film |
| Notifikasi event feed | `notificationService` | `create` + unread count |
| Badge/status creator di feed | `gamificationService.getUserBadges` | |
| Validasi & transform param | `validateRequest` + `schemas/film.zod.js` + `lib/validation.js` | `filmIdNumericParamSchema`, dst. |
| Pembatasan rate feed | `@fastify/rate-limit` + `getClientIp` | |
| Media (video/poster) feed | `lib/tus.js` + `lib/upload.js` | Upload + delete + serve range request |
| SEO item feed | `seoMiddleware` + `lib/sitemap.js` | Pola OG/Twitter tags per item |
| Status produksi | `FILM_STATUS` (`pending/published/rejected`) | Jika feed butuh status approval |
| Selector field minimal | `BaseModel.defaultModifiers` | `selectBasic`/`selectFilm` |

**Kesimpulan:** Modul `film`, `vote`, `notification`, `discussion`, `collection`, dan infrastruktur (`ApiResponse`, `errors`, `validateRequest`, pagination helpers, `constants`) bisa langsung direuse tanpa menulis ulang. Feed baru cukup: 1 model baru (jika butuh tabel feed terpisah), 1 service, 1 controller, 1 route file — mengikuti pola modul `film`/`learningMaterial`.

---

## 🐛 Technical Debt

1. **File duplikat yatim di root `src/` (ter-tracked di git):**
   `src/upload.js`, `src/validation.js`, `src/viewLimit.middleware.js`, `src/report.controller.js`, `src/static.routes.js`, `src/sitemap.js`, `src/ip.js` — **byte-identical** dengan versi di `lib/`/`middlewares/`/`controllers/`/`routes/`. `src/routes/tus.routes.jst` — versi lama tus.routes dengan ekstensi salah. Semua tidak diimport (versi root malah import `./response.js` yang tak ada → pasti crash bila dipanggil). **Harus dihapus.**

2. **Notifikasi komentar dobel:** `discussion.service.create` sudah kirim notifikasi, lalu `discussion.controller.create` kirim lagi → **2 notifikasi per komentar/balasan**. Service & controller harus memilih satu titik.

3. **Schema validasi terpecah dua lokasi** (`schemas/film.zod.js` vs `lib/validation.js`) dengan `createFilmSchema` vs `filmCreateSchema` (hampir sama) — dua source of truth. Legacy `validate()` di `lib/validation.js` tampak tidak terpakai.

4. **Kontradiksi changelog vs kode:** changelog mengklaim per-route rate limit di "auth, discussion, votes", tetapi faktanya hanya `auth.routes.js` yang punya rateLimit. `discussion`/`vote` belum.

5. **Pesan belum seragam Bahasa Indonesia** di: `auth.middleware.js` (`'Unauthorized'`, `'Forbidden: insufficient permissions'`), `validation.middleware.js` (`'Validation failed'`), `errorHandler.js` (`'Duplicate entry found'`), `viewLimit.middleware.js`, `static.routes.js` (`'File not found'`), `admin.controller.js` (`'Audit logs retrieved'`, `'Unknown'`), sebagian pesan Zod di `lib/validation.js`.

6. **Gaya error handling tidak konsisten:** `throw NotFoundError` vs `return ApiResponse.notFound`. Perlu distandarkan (rekomendasi: `throw` + global handler).

7. **Error code beda dengan dokumentasi:** kode `NOT_FOUND`/`CONFLICT` vs docs `DATA_NOT_FOUND`/`DUPLICATE_ENTRY`.

8. **`trustProxy` hardcoded `true`** di `index.js` & `lib/auth.js`, sementara ada env `TRUST_PROXY` di docs/`.env.example` — env diabaikan.

9. **Dynamic import masih ada di hot path:** `admin.controller.js` (`await import('child_process'/'util'/'stream')`) — meski admin-only, bertentangan dengan klaim "semua dynamic import → static".

10. **In-memory rate limiter** (`viewStore` di `viewLimit.middleware.js`) — ROADMAP sendiri mencatat perlu Redis untuk multi-instance.

11. **Dokumentasi vs package.json:** docs menyebut script `test:coverage`, `test:integration`, dan pakai `pnpm` di frontend (CONTRIBUTING) sementara package.json hanya `vitest run`; frontend memakai npm. Kredibilitas docs perlu disinkronkan.

12. **Pagination helper** (`parsePagination`/`buildPagination`) tersedia tapi banyak service menghitung manual `offset`/`totalPages` — peluang konsolidasi.

---

## ✅ Checklist Self-Review

- [x] Arsitektur project tidak diubah
- [x] Seluruh dokumentasi dipelajari (README, API_REFERENCE, API_STANDARDS, DATABASE, DEVELOPMENT, UPLOAD_SYSTEM, TESTING_GUIDE, ROADMAP, CHANGELOG, CONTRIBUTING)
- [x] Seluruh backend dianalisis (entry point, routes, middlewares, controllers, services, models, lib, config, tests)
- [x] Pola Controller/Service/Validation/Model/Route/Upload/Notification/Response/Error Handling didokumentasikan
- [x] Reusable module untuk Production Feed diidentifikasi
- [x] Technical debt diidentifikasi
- [x] Tidak ada perubahan kode
