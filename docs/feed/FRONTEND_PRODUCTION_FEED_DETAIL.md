# 📖 Detail Production Feed (Halaman /feed/:slug)

> Dokumentasi implementasi **halaman detail** Production Feed di `/feed/:slug` —
> pengalaman membaca ala **Medium** untuk satu postingan produksi: cover besar,
> judul, byline creator, isi artikel, galeri fullscreen, video responsive, PDF,
> komentar (reuse comment system existing), dan Related Feed (maks. 4 posting).
>
> - **Tidak ada endpoint baru** — seluruh data dari endpoint Production Feed &
>   Discussion yang sudah ada.
> - **Reuse comment system existing** — `CommentItem.vue`, `ReportModal.vue`,
>   pola wiring ArchiveDetail, dan endpoint `/api/discussions/post/:postId` /
>   `/api/discussions/:id`.
> - **Backend read-only** — tidak ada perubahan backend sama sekali.

---

## 1. Ringkasan Perubahan

- **Halaman baru** `/feed/:slug` (`src/pages/FeedPostDetail.vue`) — layout
  membaca berpusat (constrained): hero cover 16:9, header dengan badge kategori/
  tipe/badge film, judul `font-display`, byline avatar + nama creator + tanggal +
  estimasi baca, isi artikel (`isi_konten` HTML) dengan typography khusus, media,
  tags, komentar, dan Related Feed.
- **Komponen media** `FeedPostMedia.vue` — galeri foto (grid + **lightbox
  fullscreen** dengan navigasi prev/next, counter, keyboard Esc/←/→), video
  memakai `VideoPlayer.vue` existing (`aspect-video`, HLS/mp4/YouTube), dan PDF
  via `<iframe>` + tombol unduh.
- **Komponen komentar** `FeedPostComments.vue` — self-contained, **mereuse**
  `CommentItem.vue` (termasuk badge Kreator via `filmOwnerId` = `post.creator.id`)
  dan `ReportModal.vue`; pola state/event persis `ArchiveDetail.vue` tapi memakai
  endpoint post (`/api/discussions/post/:postId`, `DELETE /api/discussions/:id`).
- **Komponen related** `RelatedFeed.vue` — maks. 4 posting, memakai endpoint
  **terbaru** `GET /api/production-feed` (prioritas `film_id` sama → `tipe` sama →
  feed terbaru; dedup & buang post saat ini), kartu kompak Medium-style menuju
  `/feed/:slug`.
- **Module helpers**: `types.js` + `mapMediaItem`/`mapPostDetail`; `api.js` +
  `fetchPostComments`, `submitPostComment`, `deletePostComment`, `fetchRelatedPosts`.
- **Navigasi**: judul kartu `FeedCard` sekarang menautkan ke `/feed/:slug`
  (fallback `/feed/:postId` bila slug kosong).

### Data flow

```
FeedPostDetail.vue (/feed/:slug)
  ├─ fetchPostDetail(slug)  → GET /api/production-feed/:slug
  │    └─ mapPostDetail()   → post + media[] ter-sort (types.js)
  ├─ FeedPostMedia.vue      → galeri fullscreen + VideoPlayer + iframe PDF
  ├─ FeedPostComments.vue
  │    ├─ fetchPostComments()  → GET  /api/discussions/post/:postId
  │    ├─ submitPostComment()  → POST /api/discussions/post/:postId
  │    ├─ deletePostComment()  → DELETE /api/discussions/:commentId
  │    └─ ReportModal          → POST /api/reports (target_type=comment)
  └─ RelatedFeed.vue
       └─ fetchRelatedPosts()  → GET /api/production-feed (film_id/tipe/latest)
```

### Endpoint backend yang dipakai (tidak diubah)

| Endpoint | Dipakai untuk |
| --- | --- |
| `GET /api/production-feed/:id\|:slug` | Detail post (id numerik / slug); eager `creator`, `category`, `tags`, `media` (di-sort `sort_order` asc). |
| `GET /api/discussions/post/:postId` | Daftar komentar post (flat). |
| `POST /api/discussions/post/:postId` | Kirim komentar/balasan `{ isi_pesan, parent_id }`. |
| `DELETE /api/discussions/:id` | Hapus komentar (owner/moderator/admin) — endpoint shared existing. |
| `POST /api/reports` | Laporan komentar (`target_type: 'comment'`) via `ReportModal`. |
| `GET /api/production-feed?film_id=\|tipe=\|page=` | Related feed (list endpoint terbaru). |

> **Catatan adapter**: komentar post saat ini **flat** (adapter `addComment`
> tidak menyimpan `parent_id`, dan `GET /post/:postId` tidak membentuk tree
> `replies`). `CommentItem` tetap berfungsi — balasan muncul sebagai komentar
> level atas. Ini perilaku backend existing, tidak diubah.

---

## 2. Keputusan Desain

- **Layout membaca (Medium-inspired)**: lebar konten dibatasi — hero `max-w-5xl`,
  header/komentar `max-w-3xl`, teks artikel `max-w-2xl` (≈680px) dengan
  `font-body`, `leading-relaxed`, dan `feed-prose` typography kustom (h2–h4,
  daftar, link, quote, kode, gambar).
- **Gallery fullscreen**: lightbox `fixed inset-0 z-[100]`, backdrop hitam,
  tombol prev/next (hanya bila >1 foto), counter `N / M`, tutup via tombol /
  backdrop / `Esc`, navigasi keyboard `←`/`→`.
- **Video responsive**: `aspect-video` + `VideoPlayer.vue` existing (auto HLS/
  mp4/YouTube, resume progress, poster dari `thumbnail`/`cover`).
- **PDF**: `<iframe :src="assetUrl(path) + '#toolbar=0&view=FitH'">` + tautan
  "Unduh PDF" — pola `LearningAsset.vue`.
- **Related Feed**: 1 call `GET /api/production-feed` per sumber relevansi
  (film → tipe) lalu fallback feed terbaru; dedup by `post_id`, buang post
  sekarang, cap `limit` (4). Tidak ada request berantai berlebihan.
- **Komentar tetap system existing**: komponen, style, dan endpoint sama persis
  dengan komentar film; perbedaan hanya id target (`post_id`) dan
  `filmOwnerId` diganti `postOwnerId`.
- **Route aman**: `/feed/create` (static) tetap menang atas `/feed/:slug`
  (ranking Vue Router), dan `/feed/:id/edit` tidak bentrok (2 segmen).

---

## 3. Daftar File Baru

| File | Deskripsi |
| --- | --- |
| `frontend/src/pages/FeedPostDetail.vue` | Halaman detail `/feed/:slug` (loading skeleton, error + retry, hero, artikel, media, komentar, related). |
| `frontend/src/components/production-feed/FeedPostMedia.vue` | Galeri foto + lightbox fullscreen + video (`VideoPlayer`) + PDF. |
| `frontend/src/components/production-feed/FeedPostComments.vue` | Section komentar post (reuse `CommentItem`, `ReportModal`, pola ArchiveDetail). |
| `frontend/src/components/production-feed/RelatedFeed.vue` | Related feed maks. 4 posting (kartu kompak → `/feed/:slug`). |
| `frontend/src/modules/production-feed/__tests__/api.test.js` | 8 unit test comment helpers + `fetchRelatedPosts`. |
| `frontend/src/components/production-feed/__tests__/FeedPostMedia.test.js` | 8 unit test galeri/lightbox/video/pdf. |
| `frontend/src/components/production-feed/__tests__/FeedPostComments.test.js` | 6 unit test komentar (mock API). |
| `frontend/src/components/production-feed/__tests__/RelatedFeed.test.js` | 4 unit test related feed. |

## 4. Daftar File Diubah

| File | Perubahan |
| --- | --- |
| `frontend/src/modules/production-feed/types.js` | Tambah typedef + `mapMediaItem` + `mapPostDetail` (media di-sort `sort_order`). |
| `frontend/src/modules/production-feed/api.js` | Tambah `fetchPostComments`, `submitPostComment`, `deletePostComment`, `fetchRelatedPosts`. |
| `frontend/src/router/index.js` | Tambah route `/feed/:slug` (`FeedPostDetail`, lazy). |
| `frontend/src/components/production-feed/FeedCard.vue` | Judul menjadi `router-link` ke `/feed/:slug` (fallback postId). |
| `frontend/src/components/production-feed/__tests__/FeedCard.test.js` | +2 test: tautan judul (slug & fallback postId). |
| `frontend/src/modules/production-feed/__tests__/types.test.js` | +7 test `mapMediaItem`/`mapPostDetail`. |

---

## 5. Checklist Testing

### Otomatis (Vitest, frontend)

```bash
cd frontend
npm test                      # seluruh suite frontend (140 test: 15 file pass)
npm run build                 # produksi build sukses
```

Suite baru / bertambah (35 test baru):

- `api.test.js` — comment helpers hit endpoint benar; `fetchRelatedPosts`:
  buang post saat ini, prioritas `film_id` → `tipe`, cap limit, fallback feed
  terbaru, input kosong → `[]`.
- `types.test.js` (+7) — `mapMediaItem` (defaults & null-safe), `mapPostDetail`
  (media ter-normalisasi, ter-sort, default `[]`, null-safe).
- `FeedPostMedia.test.js` — tanpa media → tidak render; galeri foto; video lewat
  `VideoPlayer`; PDF iframe + unduh; lightbox buka/tutup; navigasi prev/next;
  counter; nav disembunyikan bila 1 foto.
- `FeedPostComments.test.js` — fetch & render komentar + hitung; login CTA saat
  logout; empty state; submit `{ isi_pesan, parent_id }` lalu refetch; delete;
  report (modal `comment:id`).
- `RelatedFeed.test.js` — render maks. limit; link `/feed/:slug`; skeleton
  loading; sembunyi bila kosong.
- `FeedCard.test.js` (+2) — tautan judul ke detail (slug & fallback postId).

### Manual (perlu dicek di `npm run dev`)

| # | Item | Status |
| --- | --- | --- |
| 1 | Buka `/feed` → klik judul kartu → halaman `/feed/:slug` terbuka | ☐ |
| 2 | Cover besar tampil; fallback gradient bila cover kosong/gagal | ☐ |
| 3 | Badge kategori + tipe + "Terkait Film" (hanya bila `film_id`) | ☐ |
| 4 | Byline: avatar, nama creator (link `/p/:id`), tanggal, estimasi baca | ☐ |
| 5 | Isi artikel: heading, list, quote, kode, gambar tampil rapi (max-w-2xl) | ☐ |
| 6 | Galeri foto: klik thumbnail → lightbox fullscreen, prev/next + Esc | ☐ |
| 7 | Video: responsive, play/HLS/mp4, poster dari thumbnail/cover | ☐ |
| 8 | PDF: iframe preview + tombol "Unduh PDF" | ☐ |
| 9 | Komentar: login → kirim; logout → CTA login; hapus/report (owner) | ☐ |
| 10 | Related Feed: maks 4 posting relevan; klik → detail lain | ☐ |
| 11 | Loading skeleton & error state (backend mati → retry) | ☐ |
| 12 | Responsive mobile & desktop | ☐ |

---

## 6. Catatan / Boundaries

- **Backend tidak diubah** — tidak ada endpoint baru; komentar post tetap flat
  (balasan muncul level atas, sesuai perilaku adapter existing).
- **Badge film** hanya menampilkan "Terkait Film" (relasi `film_id`); judul/link
  film tidak tersedia di response detail (`graphFetched` tidak memuat relasi
  `film`), konsisten dengan kartu feed.
- **Related Feed** menggunakan list endpoint existing (bukan endpoint khusus);
  relevansi = `film_id` sama → `tipe` sama → feed terbaru.
- **Route `/feed/:slug`** tidak diproteksi (postingan publik; backend menolak
  post draft/private untuk non-owner).
