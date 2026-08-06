# 🔍 Search Production Feed — Filter Lengkap + Cursor Pagination

> Dokumentasi **Search** pada bounded context **Production Feed**:
> filter **Keyword, Author, Category, Tag, Film, Date, Visibility** + **Cursor Pagination**.
>
> - **Reuse**: pola `applyFilters` + `like` persis `FilmService.getAll` (`film.service.js`); pagination offset memakai `parsePagination`/`buildPagination` (`config/constants.js`).
> - **Tanpa duplikasi**: tidak ada service/query baru di luar `ProductionFeedService.getAll`; tidak ada kolom/utility baru.
> - **Backward compatible**: pagination offset `page/limit` tetap default; cursor adalah mode alternatif (keyset) yang diaktifkan hanya bila param `cursor` diberikan.

---

## 1. Prinsip & Pola Existing

Search feed mengikuti pola yang sudah dipakai project:

```js
const applyFilters = (q) => { /* ... */ };
applyFilters(query);
applyFilters(countQuery);   // count query identik untuk total
```

Semua filter adalah **AND**, diterapkan pada query utama maupun count. Access control status/visibility tetap menang pertama (filter tidak pernah memperluas akses).

---

## 2. Parameter Query

| Param | Tipe | Deskripsi |
|---|---|---|
| `search` | string ≤255 | **Keyword**: `LIKE` case-insensitive pada `judul` + `isi_konten` |
| `author` | string ≤255 | **Author**: `LIKE` pada `users.name` via subquery `WHERE user_id IN (SELECT id FROM users WHERE name LIKE ...)` |
| `user_id` | string | Filter author by ID persis (existing) |
| `category_id` | int | **Category** (existing) |
| `tag_id` | int | **Tag** via junction `production_post_tags` (existing) |
| `film_id` | int | **Film** (existing) |
| `date_from` | `YYYY-MM-DD` | Awal rentang tanggal (inklusif) |
| `date_to` | `YYYY-MM-DD` | Akhir rentang tanggal (inklusif, s.d. 23:59:59) |
| `visibility` | `public` / `private` | **Visibility** filter eksplisit (menyempit, tidak memperluas akses) |
| `tipe` | enum | `progress`/`behind_the_scenes`/`casting`/`announcement`/`wrap` |
| `status` | enum | `draft`/`published`/`archived`/`all` (khusus moderator) |
| `is_pinned` | `true`/`false` | Filter pin |
| `sortBy` | enum | `created_at` (default) / `published_at` / `judul` / `is_pinned` |
| `sortOrder` | `asc`/`desc` | default `desc` |
| `page` | int ≥1 | Offset pagination (default 1) |
| `limit` | int 1–100 | default 10 |
| `cursor` | string | **Cursor pagination** (opaque); mengaktifkan mode keyset |

### Date — kolom yang difilter

- Status `published` (default feed publik) → filter pada **`published_at`**.
- Status lain (`draft`/`archived`/`all` oleh moderator) → filter pada **`created_at`** (draft belum punya `published_at`).

Validasi Zod (`productionFeedQuerySchema`): `date_from`/`date_to` wajib `YYYY-MM-DD` dan `date_from <= date_to` (ditolak `ValidationError` bila terbalik).

---

## 3. Cursor Pagination (Keyset)

### 3.1 Kapan dipakai

- Bila query membawa `cursor`, `page` diabaikan → mode keyset. Cocok untuk infinite scroll feed.
- Bila tidak ada `cursor` → offset `page/limit` (default, backward compatible).

### 3.2 Format cursor (opaque)

`base64url(JSON)`:

```json
{ "v": 1, "sortBy": "created_at", "sortOrder": "desc",
  "is_pinned": 0, "sort_value": "2026-08-01 10:00:00", "post_id": 42 }
```

- `sort_value` bertipe string (tanggal diformat `YYYY-MM-DD HH:mm:ss` **waktu lokal server**, konsisten dengan serialisasi Date oleh mysql2).
- Klien **tidak boleh** menebak/meracik cursor; cursor hanya dipakai sebagai token `next_cursor` dari respons sebelumnya.

### 3.3 Urutan & predikat keyset

Ordering selalu deterministik (stable):

```
ORDER BY is_pinned DESC, <sortBy> <sortOrder>, post_id <sortOrder>
```

Predikat halaman berikutnya (tuple compare, arah per kolom mengikuti sort):

```sql
WHERE (is_pinned < ?)
   OR (is_pinned = ? AND (<sortBy> <sortBy?> OR (<sortBy> = ? AND post_id < ?)))
-- operator '<' untuk DESC, '>' untuk ASC
```

Ketika `sortBy = is_pinned`, kolom duplikat dihilangkan → `(is_pinned, post_id)` saja.

### 3.4 Respons

```
{
  "posts": [...],
  "pagination": { "limit": 10, "next_cursor": "eyJ2Ijo..." | null, "has_more": true | false }
}
```

- `has_more` ditentukan dengan ambil `limit + 1` baris (tanpa count query — keunggulan keyset).
- `next_cursor` = cursor baris terakhir halaman ini; `null` bila `has_more = false`.
- Tidak ada `total`/`totalPages` pada mode keyset (menghindari count query).

### 3.5 Validasi cursor

- Cursor rusak / versi tidak dikenal → `ValidationError('Cursor tidak valid')`.
- `sortBy`/`sortOrder` pada cursor tidak cocok dengan request → `ValidationError('Cursor tidak valid untuk urutan saat ini')` (klien wajib meneruskan sort yang sama saat berpindah halaman).

---

## 4. Contoh Request

```
GET /api/production-feed/?search=casting&author=Doni&category_id=3&tag_id=5&film_id=2&date_from=2026-07-01&date_to=2026-07-31&visibility=public&sortBy=published_at&sortOrder=desc&limit=20

GET /api/production-feed/?search=wrap&cursor=eyJ2IjoiMSIsInNvcnRCeSI6...&limit=20
```

Moderator dapat menambah `status=all` atau `status=draft` dan filter `visibility=private`.

---

## 5. Lokasi Implementasi

| File | Perubahan |
|---|---|
| `backend/src/services/productionFeed.service.js` | `getAll` + filter `author`/`date_from`/`date_to`/`visibility`; mode cursor; `_encodeCursor`/`_decodeCursor`/`_applyCursor`/`_formatDateTime`; perbaikan urutan argumen `buildPagination(total, page, limit)`; `orderBy('post_id', sortOrder)` tiebreaker |
| `backend/src/schemas/productionFeed.zod.js` | `productionFeedQuerySchema`: + `author`, `date_from`, `date_to`, `visibility`, `cursor` + refine `date_from <= date_to` |
| `backend/src/controllers/productionFeed.controller.js` | `getAll` meneruskan param baru ke service |
| `backend/src/services/productionFeed.commentAdapter.js` | perbaikan urutan argumen `buildPagination` (bug pre-existing yang ditemukan saat self-review) |
| `backend/src/__tests__/productionFeed.service.test.js` | **Baru** — 14 test search + cursor |

---

## 6. Non-goal (dokumentasi)

- **Search semantik** (embedding) — tetap non-goal v1 (lihat `ARCHITECTURE_PRODUCTION_FEED.md` §5.5); feed sengaja memakai `LIKE` agar ringan.
- **FTS / FULLTEXT index** — MySQL FULLTEXT tidak dipakai karena konsistensi dengan pola `LIKE` existing; bila performa jadi masalah, ini kandidat optimasi index lanjutan.
- **Filter multi-tag / multi-kategori** — v1 hanya satu `tag_id`/`category_id` (konsisten dengan `FilmService.getAll`).
- **Real-time / WebSocket** — ROADMAP global.

---

## 7. Testing

- `cd backend && npx vitest run src/__tests__/productionFeed.service.test.js` — 14 test.
- Predikat keyset diverifikasi dengan compile SQL nyata (knex mysql2, tanpa koneksi) untuk `desc`, `asc`, dan `sortBy=is_pinned`.

| Case | Ekspektasi |
|---|---|
| `author=Doni` | subquery `users.name LIKE '%Doni%'` diterapkan |
| `date_from`/`date_to` (published) | filter pada `published_at` |
| `date_from` (status draft) | filter pada `created_at` |
| `visibility=private` | `WHERE visibility='private'` di atas access control |
| `cursor` rusak / salah sort | `ValidationError`, tanpa query |
| Cursor mode, halaman penuh | `has_more: true` + `next_cursor` valid |
| Cursor mode, halaman terakhir | `has_more: false` + `next_cursor: null` |

**Checklist manual (perlu DB + auth):**
- [ ] Offset default: `{page, limit, total, totalPages}` benar (regresi `buildPagination`).
- [ ] Semua filter digabung AND menghasilkan subset yang tepat.
- [ ] Paginate penuh dengan cursor berurutan sampai `next_cursor: null`, tanpa baris terlewat/duplikat.
- [ ] Cursor tetap valid saat `limit` berubah antar halaman; `sortBy`/`sortOrder` harus sama.
