# 💬 Komentar Production Feed — Adapter di atas Comment System existing

> Dokumentasi implementasi **komentar Post** pada bounded context **Production Feed**.
> Keputusan final (setelah rework): komentar Post **memakai Comment System existing** (`discussions`) melalui **adapter** — bukan tabel baru (`production_post_comments`) dan bukan polymorphic `discussions`.
>
> - **Reuse**: struktur, model, endpoint, dan moderasi komentar yang sudah ada dipakai apa adanya.
> - **Tanpa duplikasi**: tidak ada tabel, model, service method, atau endpoint komentar baru di context feed.
> - **Minim perubahan**: `discussions` hanya mendapat 1 kolom nullable (`post_id`) + 3 handler read/add di `discussion.controller.js`.

---

## 1. Latar Belakang & Keputusan

Komentar film sudah ditangani tabel `discussions` (`film_id`, nested via Recursive CTE). Saat merancang komentar Post, ada 3 opsi:

| Opsi | Deskripsi | Hasil |
|---|---|---|
| A. Polymorphic `discussions` (`target_type` + `film_id` nullable) | Mengubah struktur & logika `discussion.service` untuk semua kasus | ❌ Risiko regresi komentar film; coupling tinggi |
| B. Tabel baru `production_post_comments` | Komentar Post terisolasi di context feed | ⚠️ Duplikasi struktur komentar; moderasi terpecah dua tempat |
| C. **Adapter di atas `discussions` existing** (kolom `post_id` nullable) | Komentar Post disimpan `discussions`, aturan domain feed dijaga di adapter | ✅ **KEPUTUSAN FINAL** |

**Alasan C:**
- Project sudah punya **satu** sistem komentar (`discussions`); reuse konsisten dengan aturan project (jangan duplicate, jangan ubah arsitektur).
- Perubahan `discussions` minimal & **non-destruktif** bagi komentar film: kolom `post_id` nullable + `film_id` nullable.
- Aturan domain feed (post harus `published` & `public`, notifikasi penulis, pagination flat) hidup di adapter milik feed → kohesi feed terjaga, `discussion.service` tidak dicampuri.
- Moderasi terpusat: `DELETE /api/discussions/:id` yang sudah ada menangani komentar film maupun Post.

---

## 2. Penyimpanan (Schema `discussions`)

Migration `backend/src/database/migrations/20260807000000_add_post_id_to_discussions.js`:

| Kolom | Sebelum | Sesudah | Keterangan |
|---|---|---|---|
| `film_id` | `NOT NULL` | `NULL` | Komentar Post tidak merujuk film |
| `post_id` | — | `NULL`, FK → `production_posts.post_id` `ON DELETE CASCADE` | **Adapter** komentar Post |
| index | — | `idx_discussions_post` (`post_id`) | Query komentar per Post |

Aturan:
- `post_id` dan `film_id` **saling eksklusif**: baris komentar film (`film_id` terisi, `post_id NULL`) dan komentar Post (`post_id` terisi, `film_id NULL`).
- `ON DELETE CASCADE` → komentar Post ikut terhapus saat post di-**hard delete**. Soft delete (`deleted_at`) tidak menghapus komentar.
- Seluruh kolom lain (`diskusi_id`, `user_id`, `isi_pesan`, `created_at`, `updated_at`, relasi `user`) dipakai ulang tanpa perubahan.

Model: `src/models/Discussion.js` — `jsonSchema` `film_id`/`post_id` nullable (required hanya `user_id`, `isi_pesan`); relasi `post` baru (BelongsToOne → `production_posts`). Relasi `user`/`film` & behavior komentar film tidak berubah.

---

## 3. Adapter (`src/services/productionFeed.commentAdapter.js`)

Aturan domain komentar feed dijaga **di dalam context feed** (adapter), bukan di module Discussion.

| Method | Signature | Deskripsi |
|---|---|---|
| `getByPost` | `(postId, { page, limit }) → {comments, pagination}` | Komentar post, flat, urut `created_at ASC`, `user(selectBasic)`; `buildPagination`. |
| `getCommentCount` | `(postId) → number` | Jumlah komentar post (untuk badge/UI). |
| `addComment` | `(postId, userId, isiPesan) → comment` | Validasi post ada (`whereNull('deleted_at')`) → **`NotFoundError`**; post harus `published` & `public` → **`ValidationError`**; insert `discussions` (`post_id`, `user_id`, `isi_pesan` sanitasi `sanitizePlainText`); notifikasi `production_comment` ke penulis post (bila bukan diri sendiri, side-effect `try/catch`); return komentar + `user`. |

**Penghapusan komentar = reuse `discussionService.delete`** (via `DELETE /api/discussions/:id` existing) — mendukung owner/moderator/admin + hapus anak (rekursif CTE). **Tidak ada method delete baru.**

Ekspor: `services/index.js` mengekspor `productionFeedCommentAdapter` (singleton).

---

## 4. Endpoint (`/api/discussions`)

| Method | Path | Auth | Validation | Rate limit | Handler → delegasi |
|---|---|---|---|---|---|
| GET | `/post/:postId` | public | params: `productionPostNumericParamSchema` | — | `discussionController.getCommentsByPost` → `adapter.getByPost` |
| GET | `/post/:postId/count` | public | params: `productionPostNumericParamSchema` | — | `discussionController.getCommentCountByPost` → `adapter.getCommentCount` |
| POST | `/post/:postId` | `authenticate` | params: `productionPostNumericParamSchema`; body: `commentSchema` (reuse) | 10/menit | `discussionController.addCommentToPost` → `adapter.addComment` |
| DELETE | `/:id` | `authenticate` | — (existing) | — | `discussionController.delete` → `discussionService.delete` (existing) |

Handler di `discussion.controller.js` tetap **thin** (validation → delegasi → `ApiResponse`); tidak berisi aturan domain feed.

**Tidak ada endpoint komentar di `/api/production-feed/*`** (endpoint `/:id/comments`, `POST /:id/comments`, `DELETE /comments/:commentId`, `DELETE /comments/:commentId/moderate` **dihapus**).

---

## 5. Notifikasi

Reuse `notificationService.create` (side-effect `try/catch`, tidak menggagalkan request):

| Event | Penerima | `type` | `data` |
|---|---|---|---|
| Komentar baru di post saya | Penulis post (jika bukan diri sendiri) | `production_comment` | `{ post_id, discussion_id }` |

---

## 6. Matriks Sebelum → Sesudah (rework)

| Aspek | Sebelum rework | Sesudah rework |
|---|---|---|
| Tabel komentar | `production_post_comments` (baru) | `discussions` (existing) + kolom `post_id` nullable |
| Model | `ProductionPostComment.js` | — (dihapus; pakai `Discussion`) |
| Service | `productionFeed.service.js` `getComments`/`addComment`/`deleteComment`/`deleteCommentByModerator` | **dihapus**; aturan domain → `productionFeed.commentAdapter.js` |
| Controller | `productionFeed.controller.js` 4 method komentar | **dihapus**; `discussion.controller.js` + `getCommentsByPost`/`getCommentCountByPost`/`addCommentToPost` |
| Routes | `/production-feed/:id/comments`, `/comments/:commentId(/:moderate)` | **dihapus**; `/discussions/post/:postId(/:count)` + `POST /post/:postId` |
| Hapus komentar | endpoint khusus feed | `DELETE /discussions/:id` existing (rekursif CTE) |
| Migration | `20260806000000` (5 tabel) | `20260806000000` (4 tabel) + `20260807000000` (`discussions.post_id`) |

---

## 7. Alasan Menghindari Tabel Baru (`production_post_comments`)

1. **Duplikasi struktur**: `discussions` sudah menyimpan `user_id` + `isi_pesan` + timestamps; tabel baru = menyalin struktur yang ada (melanggar "reuse, jangan duplicate").
2. **Moderasi terpecah**: admin harus menangani komentar di dua tempat (film & Post) dengan dua perilaku berbeda.
3. **Fitur hilang**: komentar Post tak menikmati recursive CTE (untuk komentar anak di masa depan), `user(selectBasic)` relation, dan endpoint delete yang sudah teruji.
4. **Biaya rendah**: 1 kolom nullable + 3 handler tipis menggantikan seluruh tabel/model/service/controller/route baru.

---

## 8. Checklist Self-Review

- [x] Tidak ada tabel/model/service/controller/route komentar baru di context feed.
- [x] `discussions` hanya bertambah kolom `post_id` nullable (+ `film_id` nullable) — perilaku komentar film existing utuh.
- [x] Aturan domain feed (published & public, notifikasi penulis, pagination flat) hidup di adapter milik feed.
- [x] Penghapusan komentar reuse `discussionService.delete` existing (owner/moderator/admin + rekursif CTE).
- [x] Endpoint `/discussions/post/*` reuse `commentSchema` + `authenticate` + rate limit; tanpa duplikat di `/production-feed/*`.
- [x] Migration baru: `20260807000000_add_post_id_to_discussions.js` (up/down aman).
- [x] Syntax & import tervalidasi (`node --check` + import runtime).
