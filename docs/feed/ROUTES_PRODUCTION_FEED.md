# 🛣️ Routes — Production Feed

> Implementasi **Fastify Routes** untuk bounded context **Production Feed**.
>
> - Mengikuti pola `film.routes.js` / `learningMaterial.routes.js` / `discussion.routes.js`.
> - **Tanpa logic**: handler langsung memanggil `productionFeedController` (`.bind`), validasi lewat middleware `validateRequest`, akses lewat middleware auth.
> - **Permission** ditambahkan di semua endpoint mutasi (role minimum sesuai matriks).
> - **Rate limit** per-route untuk endpoint rawan spam (pola `auth.routes.js` `config.rateLimit`).
> - Dependency yang tertunda (Zod schema) ikut dibuat: `src/schemas/productionFeed.zod.js`.
>
> File route: `backend/src/routes/productionFeed.routes.js` · Prefix: `/production-feed`

---

## 1. Tabel Endpoint

| # | Method | Path | Auth | Validation | Rate limit | Controller |
|---|---|---|---|---|---|---|
| 1 | GET | `/production-feed/` | `optionalAuth` | query: `productionFeedQuerySchema` | — | `getAll` |
| 2 | GET | `/production-feed/tags` | public | — | — | `getTags` |
| 3 | POST | `/production-feed/tags` | `requireModerator` | body: `tagCreateSchema` | — | `createTag` |
| 4 | PUT | `/production-feed/tags/:tagId` | `requireModerator` | params + body: `productionTagIdParamSchema`, `tagUpdateSchema` | — | `updateTag` |
| 5 | DELETE | `/production-feed/tags/:tagId` | `requireModerator` | params: `productionTagIdParamSchema` | — | `deleteTag` |
| 6 | GET | `/production-feed/my` | `requireCreator` | — | — | `getMyPosts` |
| 7 | GET | `/production-feed/:id` | `optionalAuth` | params: `productionPostIdParamSchema` | — | `getById` |
| 8 | POST | `/production-feed/` | `requireCreator` | body: `productionPostCreateSchema` | 20/jam | `create` |
| 9 | PUT | `/production-feed/:id` | `authenticate` | params + body: `productionPostNumericIdParamSchema`, `productionPostUpdateSchema` | — | `update` |
| 10 | DELETE | `/production-feed/:id` | `authenticate` | params: `productionPostNumericIdParamSchema` | — | `delete` |
| 11 | PATCH | `/production-feed/:id/publish` | `authenticate` | params: `productionPostNumericIdParamSchema` | — | `publish` |
| 12 | PATCH | `/production-feed/:id/archive` | `authenticate` | params: `productionPostNumericIdParamSchema` | — | `archive` |

> **Komentar Post tidak ada di prefix `/production-feed`** (keputusan adapter — `docs/feed/COMMENTS_PRODUCTION_FEED.md`). Endpoint komentar Post hidup di `discussion.routes.js` (prefix `/discussions`):

| # | Method | Path | Auth | Validation | Rate limit | Controller |
|---|---|---|---|---|---|---|
| C1 | GET | `/discussions/post/:postId` | public | params: `productionPostNumericParamSchema` | — | `getCommentsByPost` |
| C2 | GET | `/discussions/post/:postId/count` | public | params: `productionPostNumericParamSchema` | — | `getCommentCountByPost` |
| C3 | POST | `/discussions/post/:postId` | `authenticate` | params + body: `productionPostNumericParamSchema`, `commentSchema` | 10/menit | `addCommentToPost` |
| C4 | DELETE | `/discussions/:id` | `authenticate` | — (existing) | — | `delete` |

> **Catatan ownership/moderasi**: `update`/`delete`/`publish`/`archive` memakai `authenticate` (memenuhi `film.routes` PUT/DELETE), lalu access check **owner/moderator/admin** dilakukan oleh service via `getById` → `_canAccess` → `404` (bukan menebak di controller/route).

---

## 2. Rute Statis vs Parametrik (ordering penting)

Rute statis **harus** diregistrasi sebelum `/:id` agar tidak tertelan oleh param:

```
GET /tags   → sebelum GET /:id
GET /my     → sebelum GET /:id
```

Di `discussion.routes.js`, rute `/post/:postId` & `/post/:postId/count` (2–3 segment) tidak bertabrakan dengan `/:id` (1 segment); tetap diletakkan sebelum `GET /:id` untuk kejelasan.

Fastify memberi prioritas segment statis, namun urutan ini tetap menjaga konsistensi & eksplisit.

---

## 3. Schema Validasi (`src/schemas/productionFeed.zod.js`)

File ini adalah **dependency** yang tertunda dari tahap schema (dibuat sekaligus agar route bisa diregistrasi dengan `validateRequest`).

| Schema | Fungsi | Catatan |
|---|---|---|
| `productionPostIdParamSchema` | `:id` berupa ID numerik **atau** slug | pola `filmIdParamSchema` |
| `productionPostNumericIdParamSchema` | `:id` wajib numerik → `transform(Number)` | pola `numericIdParamSchema` |
| `productionPostNumericParamSchema` | `:postId` (komentar) wajib numerik → Number | dipakai route `/discussions/post/*` |
| `productionTagIdParamSchema` | `:tagId` numerik → Number | |
| `productionFeedQuerySchema` | query list: `page/limit/search/author/date_from/date_to/visibility/category_id/film_id/user_id/tipe/tag_id/sortBy/sortOrder/status/is_pinned/cursor` | `sortBy` di-whitelist enum (kolom disuntik ke `.orderBy`); `date_from`/`date_to` `YYYY-MM-DD` + refine `date_from <= date_to`; `cursor` opaque (keyset mode, detail `SEARCH_PRODUCTION_FEED.md` §2–§3) |
| `productionPostCreateSchema` | body create post | `judul` required; `media[]` ≤ 20; `tags[]` ≤ 10; `tipe`/`visibility`/`media_type` enum; `film_id`/`category_id` coerced; `file_path`/`gambar_cover`/`thumbnail` pakai `uploadOrUrl` |
| `productionPostUpdateSchema` | body update = create `.partial()` | |
| `tagCreateSchema` / `tagUpdateSchema` | body tag (`nama_tag` ≤ 50) | |

**Reusability**: media & cover tidak membuat validator baru — memakai `uploadOrUrl` (yang di-`export` dari `lib/validation.js`, lihat §4). Body komentar Post memakai `commentSchema` existing dari `lib/validation.js` (tanpa re-export duplikat di schema feed).

---

## 4. Perubahan lintas module (alasan)

- **`src/lib/validation.js`**: `const uploadOrUrl` → `export const uploadOrUrl` (tambah 1 kata kunci). Diperlukan agar validator path upload/URL yang sudah ada bisa dipakai ulang oleh schema feed. **Tidak mengubah perilaku** — hanya mengekspos konstanta yang sudah ada; seluruh consumer lama (`filmCreateSchema` dll.) tetap berfungsi.
- **`src/routes/index.js`**: +1 import dan `await fastify.register(productionFeedRoutes, { prefix: '/production-feed' })` — registrasi central router, pola existing.
- **`src/routes/discussion.routes.js`** (keputusan adapter komentar): +3 endpoint `/post/*` (getCommentsByPost, getCommentCountByPost, addCommentToPost) + import `productionPostNumericParamSchema`; endpoint komentar film existing **tidak diubah**.

---

## 5. Review

- ✅ **Fastify routes** mengikuti pola existing (function `fastify` + `.get/.post/.put/.patch/.delete` + `.bind(controller)`).
- ✅ **Permission** pada semua mutasi: `requireCreator` (buat post), `requireModerator` (kelola tag), `authenticate` (update/delete/publish/archive + komentar).
- ✅ **Middleware** `optionalAuth` pada endpoint publik; `validateRequest` sebelum handler.
- ✅ **Validation** di semua endpoint yang punya input (body/query/params); `status` enum termasuk `'all'` untuk moderator.
- ✅ **Rate limit** hanya pada endpoint rawan spam (`POST /production-feed/`, `POST /discussions/post/:postId`) — pola `auth.routes.js` `config.rateLimit`; endpoint lain memakai limit global bawaan Fastify.
- ✅ **Tanpa logic** — route tidak berisi kondisi bisnis; `is_pinned` string→boolean dan `status='all'` ditangani controller/service.
- ✅ Syntax & import tervalidasi: `node --check` + import runtime → schema & controller ter-load; smoke parse `create` & `query` sukses (coerce bekerja).

### Catatan
- `GET /:id` menerima ID numerik **atau slug**; endpoint lain (update/delete/publish/archive) mewajibkan ID numerik — konsisten dengan service (`parseInt`).
- `:postId` di `/discussions/post/*` selalu ID numerik (`productionPostNumericParamSchema`), komentar Post memang diidentifikasi oleh post PK.
- Kode status & pesan error di-handle controller/service + `globalErrorHandler` (bukan di route).

---

## 6. Checklist Testing

- [ ] `node --check` route, schema, `routes/index.js`, `lib/validation.js` (✔ OK).
- [ ] Import `routes/productionFeed.routes.js` (tanpa menjalankan server) — tidak error (✔ OK).
- [ ] Smoke parse schema: create post (dengan media + tags + coerced number/boolean) dan query list (✔ OK).
- [ ] **Integration** (setelah DB di-migrate): gunakan Fastify `build()` seperti test existing —
  - [ ] `GET /api/production-feed/?page=1&tipe=progress` → 200 + pagination.
  - [ ] `GET /api/production-feed/:id` & `GET /api/production-feed/:slug` → 200; id tak dikenal → 404.
  - [ ] `POST /api/production-feed/` tanpa role creator → 401/403; dengan creator → 201 (draft).
  - [ ] `POST /api/discussions/post/:postId` 11 kali → 429 (rate limit); respon 201 + komentar terhubung `post_id`.
  - [ ] `PUT /api/production-feed/:id` oleh user lain → 404; oleh owner → 200.
  - [ ] `PATCH /api/production-feed/:id/publish` → 200; `DELETE /:id` → 200 (soft delete).
  - [ ] `POST /api/production-feed/tags` non-moderator → 403; moderator → 201.
  - [ ] Validasi gagal → 400 `Validation failed` dengan daftar field.
