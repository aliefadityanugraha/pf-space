# 📤 Upload — Production Feed

> Integrasi **Production Feed** dengan **Upload System existing** (Tus.io + `lib/upload.js`).
>
> - **Tidak ada duplikasi upload** — semua file tetap di-upload lewat Tus (`POST /api/files`, `backend/src/lib/tus.js`) dan disimpan/divalidasi lewat `backend/src/lib/upload.js`.
> - Feed hanya **mereferensikan** hasil upload (`/uploads/<subfolder>/<file>`) lewat kolom `gambar_cover` (posts) dan `file_path`/`thumbnail` (media).
> - Mendukung **Photo, Video, PDF**, dan keduanya saat **Draft** maupun **Published**.

---

## 1. Alur Upload (reuse, tanpa perubahan Tus)

```
Frontend (tus-js-client)                  Backend
────────────────────────                  ────────────────────────────────
 1. User pilih file (photo/video/pdf)
 2. tus.Upload → endpoint /api/files/ ──► @tus/server (resumable, 2GB max)
 3. onUploadFinish ────────────────────► pindah ke subfolder by MIME:
                                          video/* → uploads/videos/
                                          image/* → uploads/images/ (+optimasi sharp)
                                          application/pdf → uploads/documents/
 4. Client dapat URL → resolve(`/uploads/${subfolder}/${id}`)
 5. Kirim ke API feed: POST/PUT production-feed
 6. Service `_assertUploadedMedia` ────► cek file BENAR-BENAR ADA + folder sesuai
 7. Simpan baris media / cover di DB
```

- File **tidak pernah di-upload ulang** oleh feed — feed menerima path dari klien yang sudah ter-upload Tus.
- Validasi format path memakai `uploadOrUrl` (dari `lib/validation.js`) di **layer route** (schema Zod).
- Validasi eksistensi & konsistensi tipe memakai helper baru `fileExists`/`getSubfolderForMediaType` (dari `lib/upload.js`) di **layer service**.

---

## 2. Media yang Didukung

| Media Type | Subfolder (Tus) | Kolom DB | Catatan |
|---|---|---|---|
| `photo` | `uploads/images/` | `production_post_media.file_path` | Foto/cover; otomatis dioptimasi sharp (webp 1200px) oleh `optimizeImage` |
| `video` | `uploads/videos/` | `production_post_media.file_path`, `duration`, `thumbnail` | `thumbnail` opsional (harus ada di `uploads/images/`) |
| `pdf` | `uploads/documents/` | `production_post_media.file_path` | Naskah/RAB/storyboard |
| Cover | `uploads/images/` | `production_posts.gambar_cover` | Dianggap `photo` |

Pemetaan media_type → subfolder dipusatkan di `getSubfolderForMediaType()` (`lib/upload.js`) — satu sumber kebenaran, tidak duplikat di service.

---

## 3. Perilaku per Status Post (Draft vs Published)

| Aksi | Draft | Published | Reuse Upload System |
|---|---|---|---|
| `create` (status awal `draft`) | ✅ media + cover divalidasi & disimpan | — | `fileExists` + `getSubfolderForMediaType` |
| `update` | ✅ media diganti (file lama **dihapus** via `deleteFile`) | ✅ sama | `deleteFile` |
| `publish` | media lama tetap, slug dibuat | ✅ | — |
| `archive` | — | ✅ media tetap tersaji | — |
| `softDelete` | file **dipertahankan** (post bisa di-restore) | file dipertahankan | — |
| `hardDelete` (admin, tidak diekspos di route v1) | ✅ file cover + media dihapus fisik | ✅ | `deleteFile` |

> Soft delete mempertahankan file agar restore tetap konsisten; pembersihan fisik hanya saat `hardDelete` (baris media/komentar ikut terhapus via FK CASCADE) atau saat `update` mengganti media.

---

## 4. Validasi Integritas (service layer)

Helper privat `_assertUploadedMedia(filePath, mediaType)` di `productionFeed.service.js` — dipanggil di `create`, `update` (untuk `gambar_cover`), dan `_attachMedia` (untuk setiap item media + `thumbnail`).

1. **Tipe didukung** → `getSubfolderForMediaType()` mengembalikan folder (photo/video/pdf), selain itu `ValidationError('Tipe media tidak didukung')`.
2. **Subfolder sesuai tipe** → `photo` wajib `/uploads/images/`, `video` → `/uploads/videos/`, `pdf` → `/uploads/documents/`. Mismatch → `ValidationError('File harus berada di folder /uploads/<x>/')` (mencegah klien menaruh video di folder lain).
3. **File ada di disk** → `fileExists()` (dengan **path traversal guard** yang sama seperti `deleteFile`). Tidak ada → `ValidationError('File media tidak ditemukan, silakan unggah ulang')` — mencegah post/draft mereferensikan file yang tidak pernah di-upload (broken media).

Error memakai `ValidationError` existing (`lib/errors.js`) → di-respond `400 Validation failed` oleh `globalErrorHandler`.

---

## 5. Perubahan lintas module (alasan)

- **`src/lib/upload.js`** — tambah 3 fungsi baru yang **additive & non-breaking**:
  - `resolveUploadPath(fileUrl)` → path absolut di dalam `UPLOAD_DIR` (guard traversal, dipakai `fileExists` dan bisa dipakai modul lain).
  - `fileExists(fileUrl)` → cek fisik file hasil upload Tus.
  - `getSubfolderForMediaType(mediaType)` → pemetaan `photo/video/pdf` → subfolder.
  - Alasan: ini primitif domain *upload*, bukan utility feed — diletakkan di `lib/upload.js` agar reusable & konsisten dengan `deleteFile`/`getSubfolderForType`; **tidak ada fungsi sejenis yang sudah ada** (tidak ada `fileExists` sebelumnya). Tidak mengubah perilaku fungsi lain.
- **`src/services/productionFeed.service.js`** — hanya menambah import + helper privat `_assertUploadedMedia` + pemanggilan di `create`/`update`/`_attachMedia`. Tidak ada perubahan pada route/controller/schema (validasi format sudah ada di `uploadOrUrl`).

---

## 6. Review

- ✅ **Tanpa duplikasi upload** — feed tidak punya endpoint/parser upload sendiri; semua lewat Tus (`lib/tus.js`) + `lib/upload.js`.
- ✅ **Reuse** `deleteFile`, `getSubfolderForType`, `UPLOAD_DIR`, `UPLOAD_SUBDIRS`, `uploadOrUrl`, `ValidationError` — tanpa membuat ulang.
- ✅ **Photo / Video / PDF** → pemetaan & subfolder diverifikasi; format path dibatasi `uploadOrUrl` (`/uploads/{images|videos|documents|avatars}/{file}`).
- ✅ **Draft & Published** → `_attachMedia` dipanggil di `create` (draft) dan `update` (draft & published); pembersihan file lama di `update`/`hardDelete` sudah ada.
- ✅ **Error** memakai `ValidationError` → 400, konsisten API Standard.
- ✅ Verifikasi: `node --check` OK; smoke test `fileExists`/`resolveUploadPath`/`getSubfolderForMediaType` & 4 kasus `_assertUploadedMedia` lulus.

### Batasan / catatan
- Tidak ada **cleanup otomatis draft yatim** (file Tus ter-upload tapi post tidak pernah dibuat / soft-deleted selamanya). Untuk v1 dibersihkan eksplisit via `hardDelete`/`update`; cron pembersih orphan dapat menyusul (belum ada pattern di project).
- `hardDelete` tidak diekspos di route v1 (tetap kapabilitas service untuk admin).

---

## 7. Checklist Testing

- [ ] `node --check lib/upload.js` & `productionFeed.service.js` (✔ OK).
- [ ] Smoke helper: `fileExists` true/false, `resolveUploadPath` menolak traversal (`null`), `getSubfolderForMediaType` benar (✔ OK).
- [ ] Smoke `_assertUploadedMedia`: subfolder salah / file tidak ada / tipe tidak didukung → `ValidationError` (✔ OK).
- [ ] **Integration** (setelah DB migrate):
  - [ ] Upload foto via Tus → buat post draft dengan `media[{media_type:'photo', file_path:'/uploads/images/<id>.webp'}]` → 201.
  - [ ] Buat post dengan `file_path` yang tidak ada di disk → 400 `File media tidak ditemukan`.
  - [ ] Buat post dengan `media_type:'video'` tapi path `/uploads/images/...` → 400 `File harus berada di folder /uploads/videos/`.
  - [ ] Upload PDF via Tus → `media_type:'pdf'` → 201; file tersaji di `/uploads/documents/`.
  - [ ] Update post published: ganti media → file lama hilang dari disk (`deleteFile`), file baru tervalidasi.
  - [ ] Publish draft → media tetap tampil; archive → media tetap tersaji.
  - [ ] Hard delete (via service test) → file cover + media terhapus fisik.
