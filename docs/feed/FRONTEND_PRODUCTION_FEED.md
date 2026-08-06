# ✅ Frontend Foundation — Production Feed (Halaman /feed)

> Dokumentasi implementasi **frontend foundation** untuk bounded context
> **Production Feed**: menampilkan daftar postingan produksi di `/feed` dengan
> infinite scroll. **Target sprint ini hanya menampilkan feed** — tidak ada
> halaman create/edit/detail.
>
> - **Tidak mengubah backend** — seluruh data diambil dari endpoint
>   Production Feed yang sudah ada (`/api/production-feed`, `/api/discussions/post/:id/count`).
> - **Tidak mengubah arsitektur frontend** — reuse Brutal Design System
>   (`components/ui/*`), komponen existing (`PageLayout`, `PageHeader`,
>   `EmptyState`), pola composable existing (`lib/api.js`), helper
>   `assetUrl`/`formatDate` dari `lib/format.js`.
> - **Tidak membuat design system baru** — semua styling memakai token
>   `brand-*`, `shadow-brutal*`, font `display/heading/body` yang sudah ada.

---

## 1. Ringkasan Perubahan

- **Module baru** `src/modules/production-feed/` — unit mandiri berisi
  API service (`api.js`), types/mapping (`types.js`), dan composable
  (`useProductionFeed.js`), plus entry point (`index.js`).
- **Halaman baru** `/feed` (`src/pages/Feed.vue`) — daftar feed kolom tunggal
  (max-w-3xl, bukan layout grid ala Facebook), dengan **infinite scroll**
  berbasis cursor (keyset pagination backend) via `useIntersectionObserver`
  dari `@vueuse/core`.
- **Komponen baru** di `src/components/production-feed/`:
  - `FeedCard.vue` — kartu brutal: cover besar (16:9), nama/avatar creator,
    tanggal, kategori, tipe post, tags, preview isi (HTML di-strip + line-clamp),
    jumlah komentar, badge "Terkait Film" (relasi film), dan badge **"Disematkan"**
    (pinned tampil beda: border oranye + stamp merah miring).
  - `FeedCardSkeleton.vue` — skeleton loading meniru layout kartu
    (reuse `ui/Skeleton.vue`).
  - `FeedErrorState.vue` — state error dengan tombol "Muat Ulang" (`retry`).
  - Empty state memakai komponen existing `EmptyState.vue`.
- **Navigasi**: tombol **Feed** ditambahkan di Navbar (sejajar tombol
  Materi/Festival), route `/feed` terdaftar dengan lazy import.

### Data flow

```
Feed.vue (page)
  └─ useProductionFeed({ limit: 10 })      [src/modules/production-feed]
       ├─ fetchFeed()        → GET /api/production-feed?limit=10&page=1
       ├─ loadMore()         → GET /api/production-feed?limit=10&cursor=<next_cursor>
       └─ enrichCommentCounts() → GET /api/discussions/post/:postId/count (per halaman)
  ├─ mapPost() → model UI (types.js)
  └─ FeedCard.vue (render)
```

### Endpoint backend yang dipakai (tidak diubah)

| Endpoint | Dipakai untuk |
| --- | --- |
| `GET /api/production-feed?limit=&page=\|cursor=` | Daftar post (offset page 1, lalu cursor). Envelope `{ success, message, data, pagination }`; `data` = array post + eager `creator/category/tags`. |
| `GET /api/discussions/post/:postId/count` | Jumlah komentar per post (`{ comment_count }`) — enrichment non-blocking per halaman. |

### Model UI (hasil `mapPost`)

`postId, filmId, judul, slug, isiKonten, tipe, status, visibility, cover,
isPinned, publishedAt, createdAt, creator {id,name,image}, category
{categoryId,namaKategori}, tags: string[], commentCount (null sebelum di-enrich)`.

---

## 2. Daftar File Baru

| File | Deskripsi |
| --- | --- |
| `frontend/src/modules/production-feed/api.js` | API service: `fetchFeedPosts()`, `fetchPostCommentCount()`. |
| `frontend/src/modules/production-feed/types.js` | JSDoc typedefs + mapper murni `mapPost()` / `mapPosts()` (unit-testable). |
| `frontend/src/modules/production-feed/useProductionFeed.js` | Composable: state + infinite scroll (cursor) + enrich komentar. |
| `frontend/src/modules/production-feed/index.js` | Entry publik module. |
| `frontend/src/components/production-feed/FeedCard.vue` | Kartu feed. |
| `frontend/src/components/production-feed/FeedCardSkeleton.vue` | Skeleton loading. |
| `frontend/src/components/production-feed/FeedErrorState.vue` | Error state + retry. |
| `frontend/src/pages/Feed.vue` | Halaman `/feed`. |
| `frontend/src/modules/production-feed/__tests__/types.test.js` | 7 unit test mapping. |
| `frontend/src/modules/production-feed/__tests__/useProductionFeed.test.js` | 11 unit test composable (mock API). |
| `frontend/src/components/production-feed/__tests__/FeedCard.test.js` | 8 unit test komponen kartu. |

## 3. Daftar File Diubah

| File | Perubahan |
| --- | --- |
| `frontend/src/router/index.js` | Tambah route `{ path: "/feed", name: "Feed" }` (lazy import `pages/Feed.vue`). |
| `frontend/src/components/Navbar.vue` | Tambah tombol **Feed** (`Rss`) sejajar Materi/Festival. |

---

## 4. Screenshot yang Perlu Dicek (manual, `npm run dev`)

1. **Halaman `/feed` ter-load** — navbar menampilkan tombol Feed (teal), header
   "Feed Produksi", kartu-kartu feed dengan cover besar.
2. **Initial loading** — saat pertama buka, skeleton card tampil
   (`FeedCardSkeleton`) sebelum data masuk.
3. **Kartu lengkap** — verifikasi: cover besar, nama + avatar creator,
   tanggal (locale id-ID), badge kategori (oranye) + tipe, tag `#...`, preview
   isi max 3 baris, ikon + jumlah komentar.
4. **Pinned berbeda** — postingan `is_pinned` tampil pertama (backend sort),
   border oranye + stamp merah "DISEMATKAN" miring di cover.
5. **Badge film** — postingan dengan `film_id` menampilkan badge "Terkait Film"
   kiri-bawah cover; postingan tanpa film tidak.
6. **Cover kosong/gagal** — tampil fallback gradient teal + ikon Film.
7. **Infinite scroll** — scroll ke bawah, kartu baru bertambah (spinner teal saat
   loading more); di akhir feed muncul "— Akhir Feed —".
8. **Empty state** — saat feed kosong: `EmptyState` "Belum Ada Postingan"
   (dashed box).
9. **Error state** — matikan backend lalu buka `/feed`: `FeedErrorState` muncul;
   klik "Muat Ulang" setelah backend nyala → feed tampil kembali.
10. **Responsive** — cek mobile (stack, tombol Feed jadi ikon) & desktop.

---

## 5. Checklist Testing

### Otomatis (Vitest, frontend)

```bash
cd frontend
npm test                      # seluruh suite frontend (49 test: 8 file pass)
```

Suite baru (26 test, semua pass):

- `types.test.js` — mapping lengkap, `is_pinned` falsy, relasi null-safe,
  fallback judul, array + skip null.
- `useProductionFeed.test.js` — load pertama, append via cursor, guard `loadMore`
  (tanpa cursor / tanpa sisa halaman), error → `isError`, `retry` recovery,
  enrich jumlah komentar (sukses/gagal), merge saat append page, `limit` &
  `initialParams` di-pass ke request.
- `FeedCard.test.js` — render judul/creator/kategori/tag, badge pinned &
  badge film (tampil/sembunyi), komentar tampil hanya jika tersedia, preview
  HTML di-strip.

### Manual (berdasarkan section 4)

| # | Item | Status |
| --- | --- | --- |
| 1 | `/feed` load dengan navbar Feed + header | ☐ |
| 2 | Skeleton saat initial loading | ☐ |
| 3 | Semua elemen kartu (cover, creator, tanggal, kategori, tag, preview, komentar) | ☐ |
| 4 | Pinned tampil beda (border + stamp DISEMATKAN, urutan pertama) | ☐ |
| 5 | Badge film hanya jika `film_id` ada | ☐ |
| 6 | Fallback cover kosong/gagal | ☐ |
| 7 | Infinite scroll + "— Akhir Feed —" | ☐ |
| 8 | Empty state | ☐ |
| 9 | Error state + retry | ☐ |
| 10 | Responsive mobile & desktop | ☐ |

---

## 6. Catatan / Keputusan (Boundaries Sprint Ini)

- **Jumlah komentar**: endpoint list `/api/production-feed` belum mengembalikan
  `comment_count`. Untuk memenuhi kebutuhan tampilan tanpa mengubah backend,
  komentar di-enrich per halaman (N request paralel, `limit=10`) via
  `GET /api/discussions/post/:postId/count`, non-blocking dan gagal-silent
  (`commentCount` tetap `null` → ikon komentar disembunyikan).
  **Perbaikan jangka panjang**: tambahkan `comment_count` ke response list di
  backend (di luar scope sprint ini).
- **Badge film**: list hanya mengembalikan `film_id` (bukan objek film). Badge
  "Terkait Film" tampil berdasarkan keberadaan `film_id`; judul film tidak
  ditampilkan karena tidak tersedia di response list.
- **Detail post**: belum ada route/halaman detail post — kartu belum
  navigasi (display-only). Navigasi ke detail direncanakan di sprint berikutnya.
- **Gambar cover**: memakai `gambar_cover` via `assetUrl()` (auto-prepend
  `/uploads`), sama seperti gambar lain di aplikasi.
