# ⚡ Performa — Production Feed (Query Plan, N+1, Index, Scalability)

> Audit performa & optimasi bounded context **Production Feed**.
> Tujuan (sesuai GLOBAL RULES): optimasi query, cari N+1, gunakan eager loading,
> tambahkan index, review query plan, pastikan scalable.
>
> - **Tidak mengubah arsitektur** — semua perubahan lokal ke module feed + 1 index
>   tambahan lintas module (`users.name`, alasan di §6).
> - **Reuse penuh** — tetap `withGraphFetched` + `modifiers(selectBasic)`,
>   `applyFilters`, `buildPagination`; tidak ada helper/pola baru.
> - Hasil EXPLAIN di bawah diambil langsung dari DB (Postgres tidak; ini **MySQL**,
>   versi mendukung backward index scan — tanpa `filesort`).

---

## 1. Audit N+1 / Eager Loading

| # | Method | Relasi | Status |
|---|---|---|---|
| 1 | `getAll` | `creator(selectBasic)`, `category`, `tags` | ✅ **Eager** via `withGraphFetched` (batched `WHERE IN`) — 1 query utama + 3 query relasi per halaman, bukan per baris. |
| 2 | `getById` / `getBySlug` | `creator`, `category`, `tags`, `media` | ✅ **Eager**; `media` diurutkan `sort_order` (index `idx_pp_media_post_order`). |
| 3 | `getByPost` (adapter) | `user(selectBasic)` | ✅ **Eager**. |
| 4 | `addComment` | read-back `user(selectBasic)` | ✅ **Eager**. |
| 5 | `create` / `update` | media (bulk insert), tags | ✅ **Bulk insert** media & junction. |
| 6 | `_syncTags` | tag lookup + insert | ❌ **N+1 (write path) — DIPERBAIKI**, lihat §2. |
| 7 | `publish` / `hardDelete` | film check / media list | ✅ Query tunggal + I/O file (bukan DB). |
| 8 | `_notifyMentionedUsers` | user lookup | ✅ Single batched `WHERE name IN (...)` (bukan per-`@`). |

**Kesimpulan:** setelah perbaikan `_syncTags`, **tidak ada N+1 tersisa**. Seluruh
loop yang tersisa adalah I/O filesystem (`deleteFile`, `fileExists` di `_attachMedia`)
— bukan query DB, dan sudah dibatasi ≤20 item media.

---

## 2. Optimasi yang Diterapkan

### 2.1 `_syncTags` — hilangkan N+1 (write path)

**Sebelum** — per tag: 1 `SELECT` + (mungkin) 1 `INSERT`, lalu 1 `INSERT` junction:

- `N` tag → `2N + 1` query (maks. 21 untuk 10 tag, sequential di dalam transaksi).

**Sesudah** — 3 query tetap berapa pun jumlah tag (≤10):

1. `Tag.query(trx).whereIn('nama_tag', names)` — lookup semua tag sekali.
2. `Tag.query(trx).insert(missing).returning('*')` — bulk insert tag yang belum ada.
3. `ProductionPostTag.query(trx).insert(rows)` — bulk insert junction.

Detail implementasi (`productionFeed.service.js` `_syncTags`):
- Dedupe nama + skip kosong (perilaku identik dengan versi lama).
- Pencocokan **case-insensitive** konsisten dengan collation MySQL (`Map` ber-`toLowerCase()`).
- Order junction mengikuti urutan kemunculan nama (sama dengan versi lama).

### 2.2 Batch insert media — sudah optimal sejak awal

`_attachMedia` memakai `.insert(rows)` (single bulk). Tidak diubah.

---

## 3. Index — Migration `20260808000000`

### 3.1 Perubahan

| Tabel | Aksi | Nama index | Alasan |
|---|---|---|---|
| `production_posts` | **+** | `idx_production_posts_feed_order` `(status, visibility, is_pinned, created_at, post_id)` | Filter feed publik (`status`+`visibility`) **dan** urutan default (`is_pinned DESC, created_at DESC, post_id DESC`) terlayani index → **tanpa filesort** (lihat EXPLAIN §4). |
| `production_posts` | **−** | `idx_production_posts_pin` | Redundan — `is_pinned` sudah jadi prefix composite di atas. Kurangi write overhead (7 index aktif, turun dari 8). |
| `users` | **+** | `idx_users_name` | Mention `WHERE name IN (...)` + pencarian author prefix; `users.name` sebelumnya **tanpa index** (lintas module — alasan §6). |
| `discussions` | **+** | `idx_discussions_post_created` `(post_id, created_at)` | `getByPost` filter `post_id` + `ORDER BY created_at ASC` tanpa filesort. |

`idx_discussions_post` (single `post_id`) **dipertahankan**: MySQL mewajibkan index
pada kolom FK `discussions.post_id` (gagal bila di-drop: *"needed in a foreign key
constraint"*). Index single tersebut tetap menjadi pendukung FK; composite melayani
pagination terurut. Kompromi kecil: dua index ber-prefix `post_id` → overhead tulis
sedikit lebih tinggi, dapat dikonsolidasi di masa depan dengan drop FK bernama.

### 3.2 Tradeoff index (write overhead)

- `production_posts`: insert/update kini menyentuh PK + slug + feed_order + feed + user_published + film + category = **7 index** (sebelumnya 8). Net menurun.
- `users.name`: write auth jarang vs baca mention sering → net positif.
- Perlu diingat: index **tidak** membantu `LIKE '%term%'` (leading wildcard) — lihat §5.

### 3.3 Status di DB (terverifikasi `SHOW INDEX`)

```
production_posts: PRIMARY, idx_production_posts_slug, idx_production_posts_feed,
  idx_production_posts_user_published, idx_production_posts_film,
  idx_production_posts_category, idx_production_posts_feed_order
users: PRIMARY, users_email_unique, users_role_id_foreign, idx_users_name
discussions: PRIMARY, discussions_user_id_foreign, discussions_parent_id_foreign,
  idx_discussions_film_parent, idx_discussions_post, idx_discussions_post_created
```

Migration dijalankan: `npm run migrate` → **Batch 15 run: 1 migrations**.

---

## 4. Query Plan Review (EXPLAIN langsung dari DB)

| Query | key | type | Extra | Kesimpulan |
|---|---|---|---|---|
| Feed publik default (status+visibility+sort feed) | `idx_production_posts_feed_order` | ref | `Using where; Backward index scan` | **Tanpa filesort** — filter & sort satu index. |
| Komentar post (`WHERE post_id=? ORDER BY created_at ASC`) | `idx_discussions_post_created` | ref | — | Index menutup filter + sort. |
| Mention (`WHERE name IN (...)`) | `idx_users_name` | range | `Using index` | Covering index, tanpa scan tabel. |
| Keyword `LIKE '%x%'` | — | ALL | `Using where` | **Full scan** — batasan desain (lihat §5). |

### Catatan per skenario

- **Cursor (keyset)**: predikat tuple `(is_pinned, created_at, post_id)` memakai
  branch range pada `idx_production_posts_feed_order`; `limit+1` menghindari count
  query. Ini jalur paling scalable untuk feed besar.
- **Offset**: query count identik dengan filter (dijaga `applyFilters`), 2 query per
  request. Dibiarkan sebagai default untuk backward compatibility.
- **Logged-in (owner)** — `WHERE (status='published' OR user_id=?) AND (visibility='public' OR user_id=?)`:
  predikat OR bisa menurunkan selektivitas index (MySQL memilih satu index / `index_merge`).
  Diterima: request ber-auth jauh lebih jarang daripada feed publik, dan data milik
  user terbatas (`idx_production_posts_user_published` membantu).
- **Author filter** — subquery `users.name LIKE '%...%'`: leading wildcard → index
  tidak bisa dipakai (lihat §5); tabel `users` kecil sehingga masih wajar.
- **Tag filter** — subquery `production_post_tags WHERE tag_id=?` → `idx_pp_tags_tag`. ✅

---

## 5. Scalability — Batasan & Non-goal

| Batasan | Analisis | Keputusan |
|---|---|---|
| **Keyword `LIKE '%term%'`** pada `judul` + `isi_konten` (TEXT) | Tidak ada index yang membantu leading wildcard; `isi_konten` TEXT menghalangi index prefix scan. Ini risiko terbesar di skala besar. | Non-goal v1 (konsisten `SEARCH_PRODUCTION_FEED.md` §6). Kandidat masa depan: MySQL **FULLTEXT** (`ngram` parser untuk Bahasa Indonesia) atau search-as-you-type prefix. |
| **Offset pagination** | `OFFSET` mahal pada baris sangat dalam. | Cursor (keyset) adalah jalur skalabel; tersedia & didokumentasikan. |
| **Predikat OR access-control** | Degradasi index untuk feed ber-auth. | Diterima; bisa dikonsolidasi via kolom akses terhitung (non-goal). |
| **`withGraphFetched`** | 1+3 query per halaman (bukan join) — overhead rendah, menghindari N+1. | Dipertahankan; `withGraphJoined` ditolak (duplikasi baris pada relasi many-to-many `tags`). |

---

## 6. Perubahan lintas module (alasan)

- **`users.name` index (`idx_users_name`)** — satu-satunya sentuhan di luar module feed.
  Alasan: (1) adapter komentar feed melakukan `WHERE name IN (...)` untuk mention dan
  sebelumnya tanpa index; (2) pencarian author prefix terbantu. **Murni additive**
  (index baru), tidak mengubah skema, tidak mengubah perilaku query lama, tanpa
  perubahan model/service auth. Sesuai aturan: perubahan lintas module hanya bila
  benar-benar diperlukan untuk performa.

---

## 7. Testing Checklist

- [x] **Unit — `_syncTags` batch** (4 test baru): reuse case-insensitive + junction tunggal; bulk-insert missing + link semua; early return saat semua nama kosong; dedupe case-variant (cegah kolisi PK junction).
- [x] **Suite penuh** `npx vitest run` → 76/77 pass; hanya 2 kegagalan pre-existing di luar scope (`auth.controller.test.js` butuh env DB, `discussion.model.test.js` `updated_at`).
- [x] **Syntax** `node --check` service & migration.
- [x] **Migration** `npm run migrate` → Batch 15 OK; struktur terverifikasi `SHOW INDEX`.
- [x] **EXPLAIN** query kunci → index terpakai, tanpa filesort pada jalur utama.
- [ ] **Rollback round-trip** `npm run migrate:rollback` di DB scratch (belum diuji; hindari di DB riil sebelum ada data aman).
- [ ] **Manual (DB berisi data):** EXPLAIN feed publik, date filter, tag filter, komentar; pastikan tetap `idx_*` sesuai §4 dan tidak muncul `filesort` di jalur default.

---

## 8. Checklist Self-Review

- [x] Tidak ada perubahan arsitektur; pola project dipertahankan (Objection eager loading, `applyFilters`, constants).
- [x] N+1: audit tuntas, 1 temuan (`_syncTags`) diperbaiki, sisanya eager/bulk.
- [x] Index: ditambahkan berdasar query nyata (EXPLAIN), redundan dihapus, FK-supporting dipertahankan.
- [x] Perubahan lintas module minimal & beralasan (§6).
- [x] Dokumentasi tersinkron: `MIGRATION_PRODUCTION_FEED.md` (ref §migration 3), `SEARCH_PRODUCTION_FEED.md` (non-goal), dokumen ini.
