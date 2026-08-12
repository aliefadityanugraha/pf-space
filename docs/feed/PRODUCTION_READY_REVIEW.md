# 🚀 Production Ready Review — Production Feed (UX / Perf / Loading / Responsive / A11y)

> Hasil audit & perbaikan di atas seluruh halaman Production Feed:
> `/feed` (list), `/feed/:slug` (detail), `/feed/create` & `/feed/:id/edit` (editor).
>
> - **Tanpa fitur baru** & **tanpa mengubah business logic** — hanya UX, performa,
>   loading, responsive, dan accessibility.
> - Verifikasi: suite frontend **140 test pass**, `npm run build` sukses,
>   probe headless (playwright-core + system Chrome) di `localhost:5173`.
> - Screenshot: `production-feed-detail-review.png` & `production-feed-list-review.png`.

---

## 1. Ringkasan Perubahan

| #   | Area               | Perbaikan                                                                                                                                                                                                                                               | File                                           |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | Perf / Lazy Image  | Komponen `LazyImage.vue` baru: IntersectionObserver (rootMargin 250px) → fetch gambar hanya saat mendekati viewport; fallback native `loading="lazy"` bila IO tak ada; `decoding="async"`; placeholder shimmer; fallback ikon saat gambar error/kosong. | `frontend/src/components/LazyImage.vue` (baru) |
| 2   | Perf               | Cover `FeedCard` memakai `LazyImage` (ganti `<img loading="lazy">` manual + state `imageFailed`).                                                                                                                                                       | `FeedCard.vue`                                 |
| 3   | Perf               | Thumbnail galeri `FeedPostMedia` memakai `LazyImage`.                                                                                                                                                                                                   | `FeedPostMedia.vue`                            |
| 4   | Perf               | Hero cover `FeedPostDetail` memakai `LazyImage` dengan `immediate` (hero harus langsung muncul).                                                                                                                                                        | `FeedPostDetail.vue`                           |
| 5   | Loading            | `ui/Skeleton.vue` + sweep shimmer global (`.skeleton-shimmer`, animasi dimatikan saat `prefers-reduced-motion`).                                                                                                                                        | `style.css`, `ui/Skeleton.vue`                 |
| 6   | Loading            | Skeleton detail dipindah ke komponen baru `FeedPostDetailSkeleton.vue` (`role="status"`).                                                                                                                                                               | `FeedPostDetailSkeleton.vue` (baru)            |
| 7   | Loading            | Skeleton `RelatedFeed` memakai `ui/Skeleton.vue` (konsisten + shimmer).                                                                                                                                                                                 | `RelatedFeed.vue`                              |
| 8   | UX / Share         | Bar "Bagikan" di detail: **Salin Tautan** (clipboard → fallback `execCommand` → `navigator.share`), **WhatsApp**, **X** — pola sama dgn `ArchiveDetail.vue`.                                                                                            | `FeedPostDetail.vue`                           |
| 9   | SEO / OG           | `FeedPostDetail`: `og:type=article`, `og:site_name`, `og:url`, `og:image` (cover absolut), `twitter:card=summary_large_image`, canonical link.                                                                                                          | `FeedPostDetail.vue`                           |
| 10  | SEO                | `/feed`: `og:type=website`, `og:site_name`, `twitter:card=summary`.                                                                                                                                                                                     | `Feed.vue`                                     |
| 11  | SEO                | `/feed/create` & `/feed/:id/edit`: `robots noindex, nofollow` (halaman autentik, tidak untuk indeks).                                                                                                                                                   | `CreateFeed.vue`, `EditFeed.vue`               |
| 12  | A11y               | Global `:focus-visible` outline teal (seluruh app, keyboard users).                                                                                                                                                                                     | `style.css`                                    |
| 13  | A11y               | Lightbox galeri: `role="dialog"` + `aria-modal="true"` + `aria-label`; focus ke tombol tutup saat terbuka; focus restore ke thumb saat tutup; scroll-lock `body`; **Tab-trap** di dalam lightbox.                                                       | `FeedPostMedia.vue`                            |
| 14  | A11y               | Komentar: `aria-label` pada textarea + submit dengan **Ctrl/⌘ + Enter** (hint diperbarui).                                                                                                                                                              | `FeedPostComments.vue`                         |
| 15  | A11y               | Tombol "Kembali ke Atas" diberi `aria-label` (sebelumnya hanya `title`).                                                                                                                                                                                | `ScrollToTop.vue`                              |
| 16  | Scroll Restoration | `useProductionFeed` punya cache in-memory per opsi (key: limit + initialParams) + `restoreCache()`; `Feed.vue` memanggilnya sebelum `fetchFeed()` → list langsung tampil saat back-nav (dipadukan `scrollBehavior` router yang sudah ada).              | `useProductionFeed.js`, `Feed.vue`             |
| 17  | Error State        | `RelatedFeed` menambah error state + tombol "Coba Lagi" (`role="alert"`) — sebelumnya error di-swallow menjadi list kosong.                                                                                                                             | `RelatedFeed.vue`                              |

---

## 2. Detail Temuan & Perbaikan

### 2.1 Performa gambar (Lazy Image)

Sebelum: semua gambar memakai `<img loading="lazy">` manual dan tiap komponen punya
state `imageFailed` sendiri-sendiri (dup logic). Sekarang ada satu komponen
`LazyImage.vue` yang:

- Mengamati kontainernya via `IntersectionObserver` (`rootMargin: '250px'`) → src
  baru di-set saat hampir terlihat, jadi gambar di bawah fold tidak pernah dimuat.
- Fallback: bila `IntersectionObserver` tidak ada (test env / browser tua) → langsung
  render seperti `<img loading="lazy">` biasa.
- Menampilkan shimmer saat pending dan slot `#fallback` (default ikon `Film`) saat
  `src` kosong atau gagal dimuat — menggantikan blok fallback duplikat di tiap komponen.
- Tidak mengubah layout: kontainer `relative overflow-hidden bg-stone-200` + `aspect-*`
  tetap di parent (no CLS).

### 2.2 Loading state & skeleton

- `ui/Skeleton.vue` menambahkan layer shimmer (`.skeleton-shimmer` global di `style.css`),
  tetap memakai `animate-pulse` sehingga selector test `.animate-pulse` tidak berubah.
- `FeedPostDetailSkeleton.vue` (baru) membungkus skeleton detail dengan `role="status"`
  - `aria-label="Memuat postingan"` untuk screen reader.
- `prefers-reduced-motion: reduce` mematikan animasi shimmer & pulse.

### 2.3 Copy Link & Share (detail post)

Tombol "Bagikan:" di bawah tag artikel:

- **Salin Tautan** → `navigator.clipboard.writeText(url)`; bila gagal → textarea
  - `execCommand('copy')`; bila masih gagal → `navigator.share()`; terakhir → toast error.
- **WhatsApp** / **X** → `window.open(intent, '_blank', 'noopener,noreferrer')`
  (share text: `Lihat update produksi <judul> di PF Space`).

Pola identik dengan `ArchiveDetail.vue` (`handleShare`/`shareTo`).

### 2.4 SEO & OpenGraph

`FeedPostDetail.vue` kini menghasilkan (saat data post sudah ada):

```
og:type=article · og:site_name=PF Space · og:url=<canonical>
og:title / og:description (stripHtml isiKonten, 160 char)
og:image=<cover absolut> · twitter:card=summary_large_image
<link rel="canonical" href="https://<origin>/feed/<slug>">
```

`og:image` memakai `assetUrl(cover)` (sudah absolut dari origin) — hanya disertakan
bila cover ada (meta dinamis bereaksi terhadap perubahan `post`).

### 2.5 Keyboard navigation & accessibility

- `:focus-visible` global di `style.css`: outline teal 3px, offset 2px — melengkapi
  ring yang sudah ada di beberapa elemen (mis. tombol galeri).
- Lightbox `FeedPostMedia`:
  - `role="dialog" aria-modal="true" aria-label="Galeri gambar"`.
  - Saat terbuka: simpan `document.activeElement`, kunci scroll body, focus tombol tutup.
  - Saat tutup: pulihkan scroll body & focus ke thumbnail asal.
  - Tab-trap: Tab/Shift+Tab dibatasi dalam elemen focusable lightbox.
  - Escape/panah kiri-kanan tetap jalan (sudah ada sebelumnya).
- `FeedPostComments`: textarea diberi `aria-label="Komentar baru"`; **Ctrl/⌘+Enter**
  langsung mengirim (hint diperbarui: `CTRL + ENTER: KIRIM · SHIFT + ENTER: BARIS BARU`).
- `ScrollToTop`: `aria-label="Kembali ke atas halaman"` (mengganti `focus:outline-none`
  yang sebelumnya menonaktifkan indikator fokus).

### 2.6 Scroll restoration (back navigation)

Masalah: kembali dari detail ke `/feed` → komponen di-mount ulang → list kosong
saat `scrollBehavior` mengembalikan posisi → lompatan / skeleton flash.

Solusi: `useProductionFeed` menyimpan snapshot state (posts + pagination + hasMore)
di cache modul dengan key `{ limit, initialParams }`. `Feed.vue` memanggil
`restoreCache()` (opsional, tanpa cache → return `false` tanpa efek) sebelum
`fetchFeed()`, sehingga:

1. List langsung ter-render dari cache (posisi scroll valid).
2. `fetchFeed()` menyegarkan data di latar belakang lalu mengganti list.

### 2.7 Error & empty state

- Sudah ada: `FeedErrorState` + retry (detail & list), `EmptyState` (list kosong).
- Baru: `RelatedFeed` — bila `fetchRelatedPosts` gagal, kini menampilkan
  `role="alert"` + pesan + tombol "Coba Lagi", bukan diam-diam list kosong.

---

## 3. Konsistensi Brutal Design System

Semua perubahan memakai token/utility yang sudah ada:

- Kartu/tombol: `border-2 border-black`, `shadow-brutal(-xs/-sm/-md/-lg)`, hover
  translate/scale (pola kartu feed & tombol aksi detail).
- Warna: `bg-white`, `bg-brand-teal`, `bg-brand-orange`, `bg-brand-red`, `bg-stone-*`
  (bisa ter-invert di dark mode via CSS var `--color-*`).
- Tipografi: `font-display` (judul), `font-heading` (badge), `font-body` (teks).
- Kontainer: `max-w-7xl` (list/editor) & `max-w-5xl`/`max-w-3xl`/`max-w-2xl` (detail).
- Ikon `lucide-vue-next`; logo X memakai inline SVG (sama seperti `DetailActionBar.vue`).

Tidak ada utility/style baru yang menyimpang dari sistem yang ada.

---

## 4. Verifikasi

- **Frontend suite**: 140 test pass (15 files) — termasuk test existing
  `FeedCard`, `FeedPostMedia`, `FeedPostComments`, `RelatedFeed`, `useProductionFeed`
  yang tetap hijau tanpa perlu diubah.
- **Build**: `npm run build` sukses (Vite 7, 2880 modul).
- **Probe headless** (`localhost:5173`, playwright-core + system Chrome):
  - Detail: `<h1>` ter-render, OG + twitter + canonical benar, tombol
    "Salin Tautan" / "WhatsApp" / "X" ada, tanpa skeleton saat data siap.
  - List: 6 kartu, 6 `<img loading="lazy">`, tanpa skeleton/empty state.
  - Tanpa error JS baru (401 `/auth/me` = belum login; 500 avatar rusak = data seed, pre-existing).
- Screenshot: `docs/feed/production-feed-detail-review.png`,
  `docs/feed/production-feed-list-review.png`.

## 5. Catatan

- Cache `useProductionFeed` bersifat **in-memory per session**; tidak mempengaruhi
  test karena `restoreCache()` hanya dipanggil eksplisit oleh `Feed.vue` (test tidak memanggilnya).
- `Home.vue` (section preview) sengaja **tidak diubah** selain dari sprint sebelumnya —
  perubahan review ini fokus pada halaman Production Feed.
- Bug backend pre-existing (create post dgn `tags`/`media` gagal di MySQL, dan
  1 test `discussion.model` flaky) berada di luar scope review ini.

## 6. Hotfix: Gambar 500 di Dev (`/uploads` ECONNREFUSED)

**Gejala**: gambar yang sudah terupload (mis. `uploads/avatars/*.webp`) dimuat dari
frontend dev (`http://localhost:5173/uploads/...`) mengembalikan **500**:
`[vite] http proxy error: /uploads/... AggregateError [ECONNREFUSED]`.

**Akar masalah**: `frontend/vite.config.js` me-proxy `/api` & `/uploads` ke
`http://localhost:3001` (default lama), padahal backend berjalan di **3000**.

- `/api` tetap jalan karena `src/lib/api.js` memakai `BASE_URL = http://localhost:3000`
  (langsung, tidak lewat proxy).
- `assetUrl()` memakai `window.location.origin + /uploads/...` → lewat proxy vite →
  `3001` tidak ada yang listen → ECONNREFUSED → 500.

**Perbaikan** (`frontend/vite.config.js`):

- `apiProxyTarget` default `3001` → `http://localhost:3000` (tetap bisa di-override
  via env `VITE_API_PROXY_TARGET`).
- `seoPlugin.backendUrl` ikut disamakan ke `http://127.0.0.1:3000` — efek samping
  positif: `npm run build` kini benar-benar menulis `sitemap.xml` & `robots.txt`
  ke `dist/` (sebelumnya `lewati penulisan sitemap.xml: fetch failed`).

**Verifikasi**: `curl http://localhost:5173/uploads/...` → 200; probe headless hanya
menyisakan 401 `/api/auth/me` (belum login, wajar); 140 test pass & build sukses.

## 7. Gallery Grid View (`/feed`)

Halaman `/feed` diubah dari list satu kolom menjadi **grid galeri** responsif:

- Container `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8` (di dalam
  `max-w-7xl` existing) — pola sama persis dengan grid section "Production Feed" di homepage.
- Skeleton loading: 6 `FeedCardSkeleton` dalam grid yang sama.
- Sentinel infinite-scroll kini `col-span-full` (memuat/akhir feed sebaris penuh).
- Tanpa perubahan `FeedCard` (sudah mendukung grid); error/empty state tetap.

Verifikasi: probe headless 1440px → `gridTemplateColumns` = 3 kolom, 6 kartu,
sentinel full-width; 140 test pass & build sukses. Screenshot:
`docs/feed/production-feed-gallery-grid.png`.
