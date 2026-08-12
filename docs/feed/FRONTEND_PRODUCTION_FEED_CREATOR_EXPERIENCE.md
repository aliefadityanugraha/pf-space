# ✍️ Creator Experience — Production Feed (Create / Edit Post)

> Dokumentasi implementasi **Creator Experience** untuk Production Feed: halaman
> **Create Feed** (`/feed/create`), **Edit Feed** (`/feed/:id/edit`), simpan
> draft manual, publish, guard "perubahan belum tersimpan", upload media
> (Cover/Gallery/Video/PDF) via TUS, preview semua media, validasi, dan state
> loading/error.
>
> - **Backend read-only** — seluruh data ditulis ulang ke endpoint Production
>   Feed yang sudah ada (`POST/GET /api/production-feed`, `PUT /api/production-feed/:id`,
>   `PATCH /api/production-feed/:id/publish`, `GET /api/production-feed/tags`,
>   `GET /api/production-feed/my`). Tidak ada perubahan satu pun di backend.
> - **Upload wajib TUS existing** — memakai helper `lib/uploadFileTus.js` yang
>   baru (hasil refactor dari `ArchiveUploadForm.vue`, perilaku TUS identik).
> - **Tanpa autosave** — sesuai keputusan: simpan draft manual + confirm dialog
>   saat meninggalkan halaman dengan perubahan belum tersimpan.
> - **Gaya Brutal PF Space** — semua styling memakai token `brand-*`,
>   `shadow-brutal*`, font `display/heading/body` existing.

---

## 1. Ringkasan Perubahan

- **Module editor** `src/modules/production-feed/` ditambah:
  - `editor.js` — helpers murni (pure functions, unit-testable): konstanta
    `TIPE_OPTIONS`/`VISIBILITY_OPTIONS`, `createInitialForm`, `postToForm`,
    `formToPayload`, `fileToMediaType`, `makeMediaItem`, `moveMediaItem`,
    `removeMediaItem`, `validateForm` (mode draft & publish), `isFormDirty`
    (abaikan `localId` + urutan tag), `stripHtml`.
  - `useProductionFeedEditor.js` — composable state form/baseline/lookups/
    errors/submit/upload; `initEdit` (juga melekatkan film yang tidak ada di
    my-films), add/dedup tag (cap 10), move/remove media, `setCover`,
    `selectFile` (cover harus photo; video → modal aktif; foto/PDF inline),
    `performUpload`, `saveDraft`, `publish`.
  - `api.js` diperluas: `fetchPostDetail`, `createFeedPost`, `updateFeedPost`,
    `publishFeedPost`, `fetchFeedTags`, `fetchMyFilms`.
- **Halaman baru**: `CreateFeed.vue` (`/feed/create`) & `EditFeed.vue`
  (`/feed/:id/edit`) — keduanya memakai satu komponen editor.
- **Komponen utama**: `FeedEditor.vue` — layout 2 kolom (kiri: judul, editor
  TipTap, galeri media; kanan: Cover, Film, Tipe, Kategori, Tag, Visibility,
  Status + aksi, sticky). Modal upload video (progress), modal unsaved-changes.
- **CTA creator**: tombol **"Buat Post"** di header `/feed` dan menu dropdown
  **"Buat Post Produksi"** di Navbar (keduanya creator-only). Kartu post milik
  user menampilkan tombol **Edit** (owner-only) menuju `/feed/:id/edit`.
- **Routes**: `/feed/create` + `/feed/:id/edit` terdaftar dengan meta
  `requiresAuth + requiresCreator`.

### Data flow

```
CreateFeed / EditFeed (page, meta requiresAuth+requiresCreator)
  └─ useProductionFeedEditor({ mode, postId })
       ├─ initEdit()      → GET /api/production-feed/:id (detail)
       │                    GET /api/production-feed/my (my films)
       │                    GET /api/production-feed/tags
       ├─ selectFile()    → lib/uploadFileTus.js (TUS, subfolder per tipe)
       ├─ saveDraft()     → POST /api/production-feed | PUT /api/production-feed/:id
       └─ publish()       → create/update lalu PATCH /:id/publish
  └─ FeedEditor.vue (render, modals, guard)
```

### Endpoint backend yang dipakai (tidak diubah)

| Endpoint                                 | Dipakai untuk                                                                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `POST /api/production-feed`              | Buat post baru (draft/publish langsung).                                                                               |
| `GET /api/production-feed/:id\|:slug`    | Muat detail post saat edit (oleh `post_id`).                                                                           |
| `PUT /api/production-feed/:id`           | Simpan perubahan (update mengganti penuh `media` + `tags` bila dikirim; `gambar_cover` harus foto).                    |
| `PATCH /api/production-feed/:id/publish` | Terbitkan (`draft → published`); slug di-generate backend sekali (`Film.generateSlug`) — frontend tidak mengirim slug. |
| `GET /api/production-feed/tags`          | Daftar tag `{ tag_id, nama_tag, slug }`.                                                                               |
| `GET /api/production-feed/my`            | Film milik creator (`res.data.films`) untuk dropdown relasi film.                                                      |

> **Catatan kontrak**: `update()` mengganti penuh `media` + `tags` saat dikirim
> → payload edit selalu mengirim daftar media & tag terkini. `gambar_cover`
> harus berasal dari upload foto (tipe `photo`).

---

## 2. Keputusan Desain

- **Publish = create/update + PATCH publish.** Untuk post baru, publish
  memanggil `createFeedPost` (langsung `status: published`) — tidak perlu PATCH
  terpisah. Untuk post lama, publish memanggil `updateFeedPost` (simpan isi)
  lalu `publishFeedPost` (PATCH). Slug hanya di-generate backend.
- **Simpan draft = create/update dengan `status: draft`.** Tidak ada autosave;
  satu-satunya trigger simpan adalah tombol **"Simpan Draft"** / **"Terbitkan"**.
- **Guard unsaved-changes**: `onBeforeRouteLeave` + `beforeunload` aktif hanya
  saat `isDirty` (form ≠ baseline). Baseline di-reset setelah simpan/publish
  sukses. Tombol aksi yang menavigasi (mis. batal) melewati guard dengan
  `answerConfirm` ketika dialog disetujui.
- **`isFormDirty`** membandingkan field ter-normalisasi dan mengabaikan
  `localId` (id lokal item media) serta urutan tag — jadi reorder tag tidak
  menandai form kotor.
- **Upload wajib TUS** via `uploadFileTus(file, { hint })` dengan subfolder
  `images`/`videos`/`pdf` sesuai tipe file. Cover & galeri hanya menerima foto;
  video hanya menerima video; PDF diterima inline. Video di-upload setelah
  konfirmasi modal (karena berukuran besar).
- **`gambar_cover` harus photo** — validasi saat pemilihan file: memilih video
  untuk cover akan menampilkan error.
- **Tags cap 10**, dedup case-insensitive; tampilan menyarankan tag existing
  (`fetchFeedTags`).
- **Film yang tidak ada di my-films**: saat edit, jika post menunjuk film yang
  tidak muncul di `GET /api/production-feed/my`, film tersebut dilekatkan ke
  daftar pilihan agar value dropdown valid (tanpa menulis ke backend).
- **Semua tombol di dalam `<form>` diberi `type="button"` eksplisit** — komponen
  `ui/Button.vue` merender `<button>` tanpa `type` default, sehingga tanpa
  `type="button"` tombol akan submit form.

---

## 3. Daftar File Baru

| File                                                                             | Deskripsi                                                                                                                                    |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend/src/lib/uploadFileTus.js`                                              | Helper upload TUS (hasil refactor dari `ArchiveUploadForm.vue`); `guessUploadSubfolder(file, hint)` untuk subfolder `images`/`videos`/`pdf`. |
| `frontend/src/modules/production-feed/editor.js`                                 | Pure helpers editor (validasi, mapping, media ops, dirty check).                                                                             |
| `frontend/src/modules/production-feed/useProductionFeedEditor.js`                | Composable editor (state + upload + save/publish).                                                                                           |
| `frontend/src/components/production-feed/FeedEditor.vue`                         | Komponen editor utama (2 kolom, modal video, guard).                                                                                         |
| `frontend/src/pages/CreateFeed.vue`                                              | Halaman `/feed/create`.                                                                                                                      |
| `frontend/src/pages/EditFeed.vue`                                                | Halaman `/feed/:id/edit`.                                                                                                                    |
| `frontend/src/modules/production-feed/__tests__/editor.test.js`                  | 26 unit test pure helpers.                                                                                                                   |
| `frontend/src/modules/production-feed/__tests__/useProductionFeedEditor.test.js` | 18 unit test composable (mock API + TUS + `lib/api`).                                                                                        |
| `frontend/src/components/production-feed/__tests__/FeedEditor.test.js`           | 10 unit test komponen (mock composable + `vue-router`).                                                                                      |

## 4. Daftar File Diubah

| File                                                   | Perubahan                                                                                                           |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --- | --------------- |
| `frontend/src/modules/production-feed/api.js`          | Tambah `fetchPostDetail`, `createFeedPost`, `updateFeedPost`, `publishFeedPost`, `fetchFeedTags`, `fetchMyFilms`.   |
| `frontend/src/modules/production-feed/types.js`        | Tag mapping menerima `tag?.name                                                                                     |     | tag?.nama_tag`. |
| `frontend/src/modules/production-feed/index.js`        | Export `editor.js` + `useProductionFeedEditor`.                                                                     |
| `frontend/src/components/ArchiveUploadForm.vue`        | Direfactor memakai `lib/uploadFileTus.js` (perilaku identik, duplikasi TUS dihapus, import `BASE_URL` dibersihkan). |
| `frontend/src/router/index.js`                         | Routes `/feed/create` + `/feed/:id/edit` (`requiresAuth + requiresCreator`).                                        |
| `frontend/src/pages/Feed.vue`                          | Tombol **"Buat Post"** (creator-only) di header.                                                                    |
| `frontend/src/components/Navbar.vue`                   | Menu dropdown **"Buat Post Produksi"** (creator-only).                                                              |
| `frontend/src/components/production-feed/FeedCard.vue` | Tombol **Edit** (owner-only) → `/feed/:id/edit`.                                                                    |
| `frontend/src/composables/useAuth.js`                  | Helper test internal `_setAuthUser` (pola `_resetAuthState`).                                                       |

---

## 5. Checklist Testing

### Otomatis (Vitest, frontend)

```bash
cd frontend
npm test                      # seluruh suite frontend (103 test: 11 file pass)
```

Suite baru / bertambah (54 test baru):

- `editor.test.js` — `createInitialForm`, `postToForm`, `formToPayload`
  (create/update), `fileToMediaType`, media ops (make/move/remove),
  `validateForm` (draft & publish mode, cover wajib saat publish), `isFormDirty`
  (abaikan `localId` & urutan tag), `stripHtml`.
- `useProductionFeedEditor.test.js` — inisialisasi create & edit, `initEdit`
  melekatkan film di luar my-films, tag add/dedup/cap-10, media move/remove/
  setCover, `selectFile` (cover harus photo, video → modal, foto/PDF inline),
  upload gagal → error form, `saveDraft`/`publish` reset baseline, publish post
  baru & post lama (update + PATCH).
- `FeedEditor.test.js` — render judul/kategori/tag/media, validasi tampil,
  tombol Simpan Draft/Terbitkan memanggil aksi, guard unsaved-changes muncul
  saat dirty & tidak saat bersih, modal video.
- `FeedCard.test.js` (+2) — CTA Edit tampil hanya untuk owner.

### Manual (sprint ini perlu dicek)

| #   | Item                                                                       | Status |
| --- | -------------------------------------------------------------------------- | ------ |
| 1   | `/feed/create` (login creator) memuat form kosong                          | ☐      |
| 2   | Isi form → **Simpan Draft** → toast sukses, tombol aksi kembali normal     | ☐      |
| 3   | **Terbitkan** → post muncul di `/feed` (slug ter-generate backend)         | ☐      |
| 4   | `/feed/:id/edit` memuat detail post ke form                                | ☐      |
| 5   | Edit → simpan → data berubah; publish ulang draft                          | ☐      |
| 6   | Upload cover/galeri foto via TUS (progress, preview tampil)                | ☐      |
| 7   | Upload video (modal konfirmasi + progress) & PDF (inline)                  | ☐      |
| 8   | Cover wajib saat publish (error jika kosong); draft tanpa cover boleh      | ☐      |
| 9   | Meninggalkan halaman dengan perubahan → dialog "perubahan belum tersimpan" | ☐      |
| 10  | CTA: Buat Post (Feed + Navbar) & Edit (kartu milik owner saja)             | ☐      |

---

## 6. Catatan / Boundaries

- **Backend tidak diubah** — termasuk slug (hanya backend yang generate),
  validasi media, dan status enum (`draft`/`published`/`archived`).
- **Konten editor TipTap** dikirim sebagai HTML (`isi_konten`); di-strip saat
  preview kartu (`stripHtml`/`previewText`).
- **Upload tetap milik infrastruktur TUS** — helper baru hanya membungkus
  perilaku yang sudah ada di `ArchiveUploadForm` agar bisa dipakai bersama
  editor; tidak ada alur upload baru.
- **Komentar/detail post** bukan bagian dari sprint ini (lihat
  `FRONTEND_PRODUCTION_FEED.md` — navigasi ke detail direncanakan terpisah).
