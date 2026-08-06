# 🎮 Controller — Production Feed

> Implementasi **Controller Layer** untuk bounded context **Production Feed**.
>
> - **Thin controller**: hanya memetakan request → `productionFeedService` → `ApiResponse`.
> - **Tidak ada business logic** di controller — status, validasi domain, notifikasi, audit, cleanup file semuanya di service.
> - **Access control** memakai access control service (`getById` + `_isModerator`) — tidak menduplikasi logika ownership.
> - Mengikuti pola `FilmController` / `CommunityController` (throw `NotFoundError`, `ApiResponse.success`, pesan Bahasa Indonesia).
>
> File controller: `backend/src/controllers/productionFeed.controller.js`

---

## 1. Mapping Controller ↔ Service ↔ Route

| # | Controller method | Route | Auth | Service call |
|---|---|---|---|---|
| 1 | `getAll` | `GET /production-feed/` | `optionalAuth` | `getAll({page, limit, search, author, date_from, date_to, visibility, category_id, film_id, user_id, tipe, tag_id, sortBy, sortOrder, status, is_pinned, cursor, requesting_user_id})` |
| 2 | `getById` | `GET /production-feed/:id` | `optionalAuth` | `getById(id\|slug, {requesterId, isModerator})` |
| 3 | `getMyPosts` | `GET /production-feed/my` | `requireCreator` | `getByAuthor(userId, {page, limit})` |
| 4 | `create` | `POST /production-feed/` | `requireCreator` | `create(userId, body)` |
| 5 | `update` | `PUT /production-feed/:id` | `authenticate` | `getById` (access check) → `update(id, body)` |
| 6 | `delete` | `DELETE /production-feed/:id` | `authenticate` | `getById` (access check) → `softDelete(id, {actorId, ipAddress})` |
| 7 | `publish` | `PATCH /production-feed/:id/publish` | `authenticate` | `getById` (access check) → `publish(id, {actorId, ipAddress})` |
| 8 | `archive` | `PATCH /production-feed/:id/archive` | `authenticate` | `getById` (access check) → `archive(id, {actorId, ipAddress})` |
| 9 | `getTags` | `GET /production-feed/tags` | public | `getTags()` |
| 10 | `createTag` | `POST /production-feed/tags` | `requireModerator` | `createTag(body)` |
| 11 | `updateTag` | `PUT /production-feed/tags/:tagId` | `requireModerator` | `updateTag(tagId, body)` |
| 12 | `deleteTag` | `DELETE /production-feed/tags/:tagId` | `requireModerator` | `deleteTag(tagId)` |

> **Komentar Post tidak lagi di-handle controller ini.** Method `getComments`, `addComment`, `deleteComment`, `deleteCommentByModerator` (sebelumnya #9–#12) **dihapus** sesuai keputusan adapter komentar (`docs/feed/COMMENTS_PRODUCTION_FEED.md`). Komentar Post ditangani `discussion.controller.js` (lihat §2.1).

---

## 2. Controller

```js
/**
 * src/controllers/productionFeed.controller.js
 *
 * Controller for Production Feed: posts, media, and tags.
 * Thin controller — only maps request data to the service and
 * formats responses (no business logic). Comments are handled by
 * discussion.controller.js via the comment adapter (see docs/feed/COMMENTS_PRODUCTION_FEED.md).
 */

import { productionFeedService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';
import { ROLES } from '../config/constants.js';
import { NotFoundError } from '../lib/errors.js';

export class ProductionFeedController {
  async getAll(request, reply) {
    const { page, limit, search, category_id, film_id, user_id, tipe, tag_id, sortBy, sortOrder, status, is_pinned } = request.query;

    // Admin/Moderator can filter by any status; public only sees published
    let filterStatus;
    if (this._isModerator(request)) {
      filterStatus = status && status !== 'all' ? status : null;
    }

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search: search || null,
      category_id,
      film_id,
      user_id,
      tipe,
      tag_id,
      sortBy: sortBy || 'created_at',
      sortOrder: sortOrder || 'desc',
      status: filterStatus,
      requesting_user_id: request.user?.id,
      is_pinned: is_pinned === 'true' ? true : (is_pinned === 'false' ? false : undefined)
    };

    const result = await productionFeedService.getAll(options);

    return ApiResponse.success(
      reply,
      result.posts,
      'Feed berhasil diambil',
      200,
      result.pagination
    );
  }

  async getById(request, reply) {
    const { id } = request.params;

    const isNumeric = /^\d+$/.test(id);
    const opts = {
      requesterId: request.user?.id || null,
      isModerator: this._isModerator(request)
    };

    const post = isNumeric
      ? await productionFeedService.getById(parseInt(id), opts)
      : await productionFeedService.getBySlug(id, opts);

    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    return ApiResponse.success(reply, post);
  }

  async getMyPosts(request, reply) {
    const { page, limit } = request.query;

    const result = await productionFeedService.getByAuthor(request.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10
    });

    return ApiResponse.success(
      reply,
      result.posts,
      'Post Anda berhasil diambil',
      200,
      result.pagination
    );
  }

  async create(request, reply) {
    const post = await productionFeedService.create(request.user.id, request.body);
    return ApiResponse.success(reply, post, 'Post berhasil dibuat', 201);
  }

  async update(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    const updated = await productionFeedService.update(parseInt(id), request.body);
    return ApiResponse.success(reply, updated, 'Post berhasil diperbarui');
  }

  async delete(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    await productionFeedService.softDelete(parseInt(id), {
      actorId: request.user.id,
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, null, 'Post berhasil dihapus');
  }

  async publish(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    const updated = await productionFeedService.publish(parseInt(id), {
      actorId: request.user.id,
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Post berhasil dipublikasikan');
  }

  async archive(request, reply) {
    const { id } = request.params;

    const post = await productionFeedService.getById(parseInt(id), {
      requesterId: request.user.id,
      isModerator: this._isModerator(request)
    });
    if (!post) {
      throw new NotFoundError('Post tidak ditemukan');
    }

    const updated = await productionFeedService.archive(parseInt(id), {
      actorId: request.user.id,
      ipAddress: request.ip
    });

    return ApiResponse.success(reply, updated, 'Post berhasil diarsipkan');
  }

  async getTags(request, reply) {
    const tags = await productionFeedService.getTags();
    return ApiResponse.success(reply, tags, 'Tag berhasil diambil');
  }

  async createTag(request, reply) {
    const tag = await productionFeedService.createTag(request.body);
    return ApiResponse.success(reply, tag, 'Tag berhasil dibuat', 201);
  }

  async updateTag(request, reply) {
    const { tagId } = request.params;

    const tag = await productionFeedService.updateTag(parseInt(tagId), request.body);
    if (!tag) {
      throw new NotFoundError('Tag tidak ditemukan');
    }

    return ApiResponse.success(reply, tag, 'Tag berhasil diperbarui');
  }

  async deleteTag(request, reply) {
    const { tagId } = request.params;

    const deleted = await productionFeedService.deleteTag(parseInt(tagId));
    if (!deleted) {
      throw new NotFoundError('Tag tidak ditemukan');
    }

    return ApiResponse.success(reply, null, 'Tag berhasil dihapus');
  }

  _isModerator(request) {
    return !!request.user && (request.user.role_id === ROLES.MODERATOR || request.user.role_id === ROLES.ADMIN);
  }
}

export const productionFeedController = new ProductionFeedController();
```

---

## 2.1 Handler komentar Post (di `discussion.controller.js`)

Karena komentar Post memakai sistem komentar existing, tiga handler ditambahkan di `src/controllers/discussion.controller.js` (module discussion, bukan feed):

| Handler | Route | Auth | Delegasi |
|---|---|---|---|
| `getCommentsByPost` | `GET /discussions/post/:postId` | public | `productionFeedCommentAdapter.getByPost(postId, {page, limit})` |
| `getCommentCountByPost` | `GET /discussions/post/:postId/count` | public | `productionFeedCommentAdapter.getCommentCount(postId)` |
| `addCommentToPost` | `POST /discussions/post/:postId` | `authenticate` + rate limit | `productionFeedCommentAdapter.addComment(postId, userId, isi_pesan)` |

- Handler **tetap thin** (validation → delegasi → `ApiResponse`), tidak berisi aturan domain feed.
- Penghapusan komentar memakai `DELETE /discussions/:id` yang sudah ada (`discussionController.delete` → `discussionService.delete`) — **tanpa endpoint baru** (owner/moderator/admin + delete rekursif CTE).
- Perubahan di `discussion.controller.js` hanya **penambahan handler + import adapter**; handler komentar film existing tidak diubah.
- Detail desain adapter: `docs/feed/COMMENTS_PRODUCTION_FEED.md`.

---

## 3. Desain: bagaimana controller tetap thin

- **Access control** tidak diimplementasikan ulang — memakai `productionFeedService.getById/getBySlug` yang sudah ber-`_canAccess` (owner / moderator / published+public). Jika `null` → `throw NotFoundError` (menyembunyikan keberadaan, pola `film.controller`).
- **Role filter status** di `getAll` hanya transformasi query → options (bukan logika domain).
- **Audit & notifikasi** tidak ada di controller — semuanya di service (`actorId` + `ipAddress` dikirim sebagai data polos).
- **Param→service mapping**: `request.user.id`, `request.params`, `request.query`, `request.body` dipetakan apa adanya ke argumen service.
- **Response**: selalu `ApiResponse.success(reply, data, message, code, pagination)`; error domain di-handle `globalErrorHandler` (AppError) / `NotFoundError`.

---

## 4. Review

### 4.1 Kesesuaian GLOBAL RULES
- ✅ **Hanya**: Validation (param/query mapping + access check), Call Service, Return Response.
- ✅ **Tidak ada business logic** — tidak ada manipulasi status, transaksi, notifikasi, cleanup file, atau hitungan di controller.
- ✅ **Controller pattern existing** — class + singleton, `ApiResponse.success`, `throw NotFoundError`, pesan Bahasa Indonesia, `_isModerator` (pola `ROLES` di `film.controller`).

### 4.2 Konsistensi
- ✅ Metode service yang dipakai: `getAll`, `getByAuthor`, `getById`, `getBySlug`, `create`, `update`, `softDelete`, `publish`, `archive`, `getTags`, `createTag`, `updateTag`, `deleteTag` — semuanya ada di `productionFeed.service.js`.
- ✅ Pesan & kode: `201` untuk create/tag, `200` + `pagination` untuk list, `404 NotFoundError` untuk missing/forbidden.
- ✅ Komentar Post tidak lagi ditangani feed controller — dipindah ke `discussion.controller.js` (adapter).
- ✅ `hardDelete` (admin) **tidak** diekspos via controller v1 — tetap sebagai kapabilitas service (endpoint admin permanen menyusul).

### 4.3 Poin yang diperiksa (self-review)
- [x] `getById` menerima id **atau** slug (regex `^\d+$`), konsisten `film.controller`.
- [x] `update`/`delete`/`publish`/`archive` tidak menebak status → access check via `getById`, lalu operasi via service.
- [x] `is_pinned` string → boolean (pola `is_banner_active` di `film.controller`).
- [x] `status='all'` (moderator) → `null` (tanpa filter), konsisten `film.controller`.
- [x] Tanpa import zod — validasi body/query/params dilakukan di **route middleware** (`validateRequest`), bukan di controller.
- [x] Syntax & load tervalidasi: `node --check` + import runtime → 12 method feed + 3 handler Post di `discussion.controller.js` terdaftar.

### 4.4 Perubahan lintas module (alasan)
- **`src/controllers/index.js`** ditambah `export * from './productionFeed.controller.js'` — wajib agar route (tahap berikutnya) dapat mengimpor via barrel `../controllers/index.js`. Hanya penambahan 1 baris.
- **`src/controllers/discussion.controller.js`** (keputusan adapter komentar): tambah 3 handler komentar Post + import `productionFeedCommentAdapter`; handler komentar film existing tidak diubah.

### 4.5 Dependency yang dipakai (sudah tersedia)
- Schema Zod `productionFeed.zod.js` **sudah dibuat** dan dipakai di routes: param `productionPostIdParamSchema` (id|slug), `productionPostNumericIdParamSchema`, `productionPostNumericParamSchema` (postId), `productionTagIdParamSchema`; body create/update/tag; query `productionFeedQuerySchema`.
- Komentar Post memakai `commentSchema` existing (`lib/validation.js`) + `productionPostNumericParamSchema` untuk `:postId` di `/discussions/post/*`.

---

## 5. Checklist Testing

- [ ] `node --check src/controllers/productionFeed.controller.js` (✔ sudah OK).
- [ ] Import `controllers/index.js` → `productionFeedController` ter-export tanpa error (✔ sudah OK).
- [ ] **Unit (mock service)**:
  - [ ] `getAll` meneruskan options benar; moderator dapat `status='all'`/spesifik; publik default `published`.
  - [ ] `getById` numeric → `getById`; non-numeric → `getBySlug`; `null` → `NotFoundError`.
  - [ ] `update`/`delete`/`publish`/`archive`: post tidak dapat diakses (non-owner, non-moderator) → `404`.
  - [ ] `create`/`createTag` → `201` + pesan sesuai.
- [ ] **Adapter comment (unit)**: `getCommentsByPost`/`getCommentCountByPost`/`addCommentToPost` di `discussion.controller.js` mendelegasikan ke `productionFeedCommentAdapter` dan mengembalikan `ApiResponse`.
- [ ] **Integration** (pola `build()`): jalankan endpoint via route — public feed, detail, komentar (`/discussions/post/*`), publish/archive/delete dengan role berbeda.
