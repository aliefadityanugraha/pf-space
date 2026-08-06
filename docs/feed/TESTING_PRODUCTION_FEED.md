# ✅ Testing — Production Feed (Unit, Integration, API, Validation, Upload + Coverage)

> Dokumentasi implementasi pengujian **bounded context Production Feed**
> mengikuti `docs/TESTING_GUIDE.md` (piramida test: Unit → Integration → API → E2E,
> Vitest). Semua test di bawah berjalan offline (tanpa DB/file nyata) via mock.
>
> - **Tidak mengubah arsitektur** — murni menambah test + konfigurasi coverage
>   (devDependency `@vitest/coverage-v8`, script `test:coverage`).
> - **Reuse penuh** — memakai pola test existing: `tus.routes.test.js` (Fastify +
>   `inject`), `productionFeed.service.test.js` (chain mock Objection/Knex),
>   `productionFeed.commentAdapter.test.js` (mock model/service lib).
> - **Coverage target** (Testing Guide): Unit ≥ 80% ✅, Integration ≥ 60% ✅.

---

## 1. Setup & Cara Menjalankan

```bash
# (sekali) dependensi coverage — versi disamakan dengan vitest 3.2.7
npm i -D @vitest/coverage-v8@3.2.7

# semua test feed
npm test -- src/__tests__/productionFeed

# semua test backend
npm test

# coverage scoped ke module feed + shared lib yang dipakai feed
npm run test:coverage -- src/__tests__/productionFeed \
  --coverage.include="src/services/productionFeed.service.js" \
  --coverage.include="src/controllers/productionFeed.controller.js" \
  --coverage.include="src/routes/productionFeed.routes.js" \
  --coverage.include="src/schemas/productionFeed.zod.js" \
  --coverage.include="src/lib/validation.js" \
  --coverage.include="src/lib/upload.js" \
  --coverage.include="src/lib/errors.js" \
  --coverage.include="src/lib/response.js" \
  --coverage.include="src/middlewares/validation.middleware.js" \
  --coverage.include="src/middlewares/errorHandler.js"
```

Script `test:coverage` ditambahkan ke `backend/package.json`
(`"test:coverage": "vitest run --coverage"`).

---

## 2. Matriks Test Feed

| # | File | Kategori | Test | Fokus |
|---|---|---|---|---|
| 1 | `productionFeed.service.test.js` | Unit (existing) | 18 | `getAll` search/cursor/filter, `_syncTags` batch |
| 2 | `productionFeed.commentAdapter.test.js` | Unit (existing) | 9 | adapter komentar feed→discussion |
| 3 | `productionFeed.service.unit.test.js` | Unit (baru) | 32 | lifecycle post, access control, tag CRUD, audit |
| 4 | `productionFeed.controller.test.js` | Unit (baru) | 17 | mapping query→options, envelope, `_isModerator` |
| 5 | `productionFeed.routes.test.js` | Integration + API (baru) | 19 | Fastify+inject happy path & status code |
| 6 | `productionFeed.validation.test.js` | Validation (baru) | 21 | Zod query/params/body/tag |
| 7 | `productionFeed.upload.test.js` | Upload (baru) | 13 | `_assertUploadedMedia`, `_attachMedia`, `uploadOrUrl` |

**Total test feed: 129** (102 baru). Semua pass.

### 2.1 Hasil full suite backend

```
Test Files: 20 → 18 passed, 2 failed (pre-existing, out of scope)
Tests:      179 → 178 passed, 1 failed (pre-existing)
```

2 kegagalan **pre-existing** (sudah ada sebelum tugas ini, di luar bounded context feed):
- `auth.controller.test.js` — butuh env/DB.
- `discussion.model.test.js` — test `updated_at` insert.

---

## 3. Detail Per Kategori

### 3.1 Unit Test

**`productionFeed.service.unit.test.js` (32)** — lifecycle service:
- `normalizeData` — sanitize `isi_konten`.
- `getById` / `getBySlug` — access control: owner / moderator / anonymous,
  draft-private disembunyikan dari user lain, `null` saat tak ditemukan.
- `create` — insert draft (`is_pinned=false`), film tidak ada → `ValidationError`,
  cover tidak valid → `ValidationError`, media+tags di-attach.
- `update` — `null` bila post hilang, replace media (hapus file lama + row, insert baru)
  + replace tag + `patchAndFetchById`, regenerasi slug saat judul berubah,
  film tidak ada → `ValidationError`.
- `publish` — slug digenerate sekali, notifikasi ke pemilik film (dan skip bila
  author = pemilik film), audit `PUBLISH_PRODUCTION_POST`.
- `archive` / `softDelete` / `hardDelete` — status/`deleted_at`/hapus fisik + audit.
- Tag CRUD — `createTag` (sanitize, `ConflictError` duplikat, reject kosong),
  `getTags` (order by nama), `updateTag` (slug regenerasi), `deleteTag`.
- `_canAccess` — matriks akses (moderator/owner/published+public).
- `_recordAudit` — skip tanpa actor, format `targetType: 'production_post'`.

**`productionFeed.controller.test.js` (17)** — thin controller:
- `getAll` — default `page=1/limit=10/sortBy=created_at/sortOrder=desc`,
  parse `is_pinned`, moderator meneruskan `status` (dan `'all'`→`null`),
  envelope `{success,message,data,pagination}`.
- `getById` — numerik→`getById`, slug→`getBySlug`, `NotFoundError` bila null.
- `getMyPosts` / `create` / `update` / `delete` / `publish` / `archive` —
  ownership check dulu (`getById`), `actorId`+`ipAddress` diteruskan, status 201
  untuk create.
- Tags controller + `_isModerator` (role 3/4 = true, selainnya false).

### 3.2 Integration Test

**`productionFeed.routes.test.js` — happy path (Fastify + `inject`)**, pola
`tus.routes.test.js`:
- Membangun `Fastify({ logger: false })`, `register(productionFeedRoutes, { prefix })`,
  `setErrorHandler(globalErrorHandler)` (error → envelope API Standard).
- `GET /` → 200 + pagination; filter query diteruskan ke service.
- `GET /:id` (numerik vs slug) → routing service yang tepat.
- `POST /` (creator) → 201; `PUT /:id` (ownership→update); `DELETE /:id`
  (softDelete + `actorId`/`ip`); `PATCH /:id/publish` & `/:id/archive`.
- `GET /my` → `getByAuthor`.
- Tags: `GET /tags` publik, `POST /tags` moderator 201, `PUT/DELETE /tags/:tagId`.

Mock strategy (lihat file):
- `vi.mock('../services/index.js')` — service barrel diganti mock; controller
  asli tetap dites (mapping nyata) tanpa DB.
- `vi.mock('../middlewares/auth.middleware.js')` — `authenticate/requireCreator/
  requireModerator/optionalAuth` ditirukan via `vi.hoisted` context (role dapat
  di-set per test); `validation.middleware.js` & `errorHandler.js` **asli**.
- Barrel `middlewares/index.js` & `controllers/index.js` re-export otomatis
  mengikuti mock module (tanpa mengubah app).

### 3.3 API Test

Status code + envelope (masih di `productionFeed.routes.test.js`):
- **400** — `GET /?limit=0`, `date_from > date_to`, `PUT /:id` id non-numerik,
  `POST /` tanpa `judul` — dicegah oleh `validateRequest` nyata sebelum service
  dipanggil (`service.*` **tidak** dipanggil).
- **401** — route protected tanpa user (`GET /my`) → `AuthenticationError`.
- **403** — creator memanggil route moderator (`POST /tags`) → `AuthorizationError`.
- **404** — post tidak ada / tidak diizinkan → `NotFoundError`, `message:
  'Post tidak ditemukan'`.
- Envelope error: `{ success: false, message, details? }`.

### 3.4 Validation Test

**`productionFeed.validation.test.js` (21)** — Zod:
- Query: batas `limit` 1–100, `page` ≥1, enum `tipe/sortBy/sortOrder/status/
  visibility/is_pinned`, format tanggal `YYYY-MM-DD` + `date_from ≤ date_to`,
  `search/author` trim ≤255, `cursor` ≤500.
- Params: `id` string min 1 (id/slug), param numerik coerce + tolak non-digit.
- Create/Update: `judul` wajib (create), media ≤20 & item valid (enum +
  `uploadOrUrl`), tags ≤10 & nama ≤50 non-empty, cover valid.
- Tag: `nama_tag` 1–50.

### 3.5 Upload Test

**`productionFeed.upload.test.js` (13)** — integritas upload (reuse Upload System):
- Service `_assertUploadedMedia`: tolak tipe tidak didukung / path kosong /
  subfolder salah / file fisik tidak ada; terima path valid.
- Service `_attachMedia`: insert bulk, `sort_order` fallback ke index, `duration`
  diteruskan, tolak thumbnail hilang, validasi semua item sebelum insert.
- Shared `uploadOrUrl` (`lib/validation.js`): terima `''`, URL valid,
  `/uploads/{videos|images|documents|avatars}/file`; tolak `..`, absolute di luar
  `/uploads`, subfolder tak dikenal, path bersarang, string non-URL.

---

## 4. Output Coverage (v8 — scoped feed)

Perintah & hasil di bawah sesuai §1. **Tidak ada threshold yang dilanggar.**

| File | % Stmts | % Branch | % Funcs | % Lines | Catatan uncovered |
|---|---|---|---|---|---|
| `services/productionFeed.service.js` | 94.00 | 88.41 | 96.55 | 94.00 | filter owner/search/tag-id di `getAll`; cabang cover-replacement & catch notif di `update/publish` |
| `controllers/productionFeed.controller.js` | 97.43 | 91.66 | 100 | 97.43 | jalur `delete/publish/archive` yang gagal ownership (throw 404) |
| `routes/productionFeed.routes.js` | 100 | 100 | 100 | 100 | — |
| `schemas/productionFeed.zod.js` | 100 | 100 | 100 | 100 | — |
| `lib/validation.js` | 93.13 | 95.00 | 66.67 | 93.13 | helper `validate()` (dipakai controller lain) |
| `lib/response.js` | 91.42 | 100 | 40.00 | 91.42 | helper `notFound/badRequest/unauthorized` (dipakai di luar feed) |
| `lib/errors.js` | 100 | 100 | 100 | 100 | — |
| `lib/upload.js` | 33.23 | 66.66 | 0 | 33.23 | lib filesystem bersama; fungsi yang dipakai feed dimock di test service (lihat catatan) |
| `middlewares/validation.middleware.js` | 91.30 | 80.00 | 100 | 91.30 | cabang rawErrors non-array |
| `middlewares/errorHandler.js` | 31.11 | 33.33 | 100 | 31.11 | cabang `ZodError` / `error.validation` / `ER_DUP_ENTRY` (di luar jalur feed) |
| **All files** | **81.99** | **89.10** | **77.46** | **81.99** | |

> Catatan `lib/upload.js`: `getSubfolderForMediaType`/`deleteFile`/`fileExists`
> **diuji melalui service** (mock) sesuai pola test existing; implementasi fs
> aslinya tidak di-import agar test tetap offline. Coverage rendah bukan berarti
> feed tidak teruji — fungsi feed yang bersangkutan terverifikasi 94–100%.
> `validation.middleware.js` & `errorHandler.js` adalah shared middleware lintas
> module; dihitung karena feed memakainya.

---

## 5. Checklist Testing Guide

| Aspek | Status |
|---|---|
| Unit test (service lifecycle, access control, tag, audit) | ✅ 50 (18 existing + 32 baru) |
| Unit test controller | ✅ 17 |
| Integration test (Fastify route + middleware asli) | ✅ 19 |
| API test (400/401/403/404 + envelope) | ✅ dalam 19 di atas |
| Validation test (Zod query/params/body/tag) | ✅ 21 |
| Upload test (integritas file/uploadOrUrl) | ✅ 13 |
| Coverage Unit ≥ 80% (feed modules) | ✅ service 94%, controller 97.4%, routes 100%, schemas 100% |
| Coverage Integration ≥ 60% | ✅ |
| Test berjalan offline (mock DB/file/auth) | ✅ |
| Tidak mengubah arsitektur / module luar | ✅ (hanya `package.json` + devDep) |

---

## 6. Temuan (tidak diperbaiki — di luar scope)

1. **Zod v4 — `error.errors` sudah diganti `error.issues`.** `validation.middleware.js`
   (`result.error?.errors`) dan `errorHandler.js` (`error.errors`) membaca properti
   lama sehingga `details` validasi selalu `[]` (status 400 tetap benar, tapi detail
   field kosong). Berlaku **app-wide**, bukan khusus feed → test di bagian 3.3
   menegaskan status/message, bukan isi `details`. Jika ingin diperbaiki di masa
   depan: ganti `errors` → `issues` di kedua file (tanpa perubahan kontrak API).
2. Dua kegagalan suite **pre-existing** (`auth.controller.test.js`,
   `discussion.model.test.js`) — di luar bounded context feed.
