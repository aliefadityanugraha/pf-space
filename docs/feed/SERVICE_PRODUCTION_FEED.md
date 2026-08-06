# ⚙️ Service Layer — Production Feed

> Implementasi **Service Layer** untuk bounded context **Production Feed**.
>
> - **Tanpa Fastify code** & **tanpa Request object** — service murni menerima nilai primitif (userId, id, data, opts).
> - **Business logic berada di Service** — validasi domain, transaksi, notifikasi, audit, cleanup file.
> - **Reuse**: Notification (`notificationService.create`), Upload (`deleteFile`), Comment (pola `CommunityService.addReply`/`deleteReply`), Audit (`recordAuditLog`), slug (`Film.generateSlug`), sanitasi (`sanitizeRichText`/`sanitizePlainText`).
>
> File service: `backend/src/services/productionFeed.service.js`

---

## 1. Service

```js
/**
 * src/services/productionFeed.service.js
 *
 * Service for Production Feed business logic: posts, media, tags.
 * Comments live in `productionFeed.commentAdapter.js` (reuses the
 * existing Discussion/comment system). Reuses existing Notification,
 * Upload, Audit, and Comment patterns without touching other modules.
 */

import {
  ProductionPost,
  ProductionPostMedia,
  ProductionPostTag,
  Tag,
  Film,
  BaseModel
} from '../models/index.js';
import { deleteFile, fileExists, getSubfolderForMediaType } from '../lib/upload.js';
import { recordAuditLog } from '../lib/audit.js';
import { sanitizeRichText, sanitizePlainText } from '../lib/sanitize.js';
import { PAGINATION, buildPagination } from '../config/constants.js';
import { ValidationError, ConflictError } from '../lib/errors.js';
import { notificationService } from './notification.service.js';

// --- Feed constants (scoped to this context) ---

export const POST_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const POST_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private'
};

export const POST_TYPE = {
  PROGRESS: 'progress',
  BEHIND_THE_SCENES: 'behind_the_scenes',
  CASTING: 'casting',
  ANNOUNCEMENT: 'announcement',
  WRAP: 'wrap'
};

export const MEDIA_TYPE = {
  PHOTO: 'photo',
  VIDEO: 'video',
  PDF: 'pdf'
};

export class ProductionFeedService {
  /**
   * Normalize and sanitize post data before insert/update
   * @param {object} data - Raw input data
   * @returns {object} Cleaned data object
   */
  normalizeData(data) {
    const clean = { ...data };
    if (clean.isi_konten) clean.isi_konten = sanitizeRichText(clean.isi_konten);
    return clean;
  }

  /**
   * Fetch a paginated list of posts with filtering and sorting
   * @param {object} options - Search, filter, and pagination options
   * @returns {Promise<{posts: ProductionPost[], pagination: object}>}
   */
  async getAll(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = POST_STATUS.PUBLISHED,
      visibility = POST_VISIBILITY.PUBLIC,
      category_id,
      film_id,
      user_id,
      tipe,
      tag_id,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      requesting_user_id,
      is_pinned
    } = options;

    const query = ProductionPost.query()
      .withGraphFetched('[creator(selectBasic), category, tags]')
      .modifiers(BaseModel.defaultModifiers);

    // Helper to apply filters to both main and count queries
    const applyFilters = (q) => {
      // 1. Exclude soft-deleted posts
      q.whereNull('deleted_at');

      // 2. Status & Access Control
      if (status) {
        if (status === POST_STATUS.PUBLISHED && requesting_user_id) {
          // Public shows published, but owner sees their own too
          q.where((builder) => {
            builder
              .where('status', POST_STATUS.PUBLISHED)
              .orWhere('user_id', requesting_user_id);
          });
        } else {
          q.where('status', status);
        }
      }

      // 3. Visibility & Access Control
      if (requesting_user_id) {
        q.where((builder) => {
          builder
            .where('visibility', POST_VISIBILITY.PUBLIC)
            .orWhere('user_id', requesting_user_id);
        });
      } else {
        q.where('visibility', visibility);
      }

      // 4. Explicit Author Filter
      if (user_id) {
        q.where('user_id', user_id);
      }

      // 5. Category / Film / Type / Pin Filters
      if (category_id) q.where('category_id', category_id);
      if (film_id) q.where('film_id', film_id);
      if (tipe) q.where('tipe', tipe);
      if (is_pinned !== undefined) q.where('is_pinned', is_pinned);

      // 6. Tag Filter (via junction table)
      if (tag_id) {
        q.whereIn('post_id', (sub) =>
          sub
            .select('post_id')
            .from('production_post_tags')
            .where('tag_id', tag_id)
        );
      }

      // 7. Search by title or content (Case-Insensitive)
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        q.where((builder) => {
          builder
            .where('judul', 'like', term)
            .orWhere('isi_konten', 'like', term);
        });
      }
    };

    applyFilters(query);

    // Sorting: pinned first, then requested column
    query.orderBy('is_pinned', 'desc').orderBy(sortBy, sortOrder);

    // Pagination
    const offset = (page - 1) * limit;

    // Count query
    const countQuery = ProductionPost.query();
    applyFilters(countQuery);

    const [posts, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('post_id as total').first()
    ]);

    const total = parseInt(totalResult?.total || 0);

    return {
      posts,
      pagination: buildPagination(parseInt(page), parseInt(limit), total)
    };
  }

  /**
   * Shortcut to get all posts by a specific author (all statuses)
   * @param {string} userId - Author user ID
   * @param {object} [options={}] - Pagination options
   * @returns {Promise<object>} Paginated result
   */
  async getByAuthor(userId, options = {}) {
    return this.getAll({
      ...options,
      user_id: userId,
      status: null,
      requesting_user_id: userId
    });
  }

  /**
   * Get a single post by ID with access control
   * @param {number} id - Post ID
   * @param {object} [opts]
   * @param {string} [opts.requesterId] - Current user ID
   * @param {boolean} [opts.isModerator=false] - Moderator/admin bypass
   * @returns {Promise<ProductionPost|null>} Post or null if not found/not permitted
   */
  async getById(id, { requesterId = null, isModerator = false } = {}) {
    const post = await ProductionPost.query()
      .findById(id)
      .whereNull('deleted_at')
      .withGraphFetched('[creator(selectBasic), category, tags, media]')
      .modifiers(BaseModel.defaultModifiers)
      .modifyGraph('media', (builder) => builder.orderBy('sort_order', 'asc'));

    if (!post || !this._canAccess(post, { requesterId, isModerator })) {
      return null;
    }

    return post;
  }

  /**
   * Get a single post by its URL slug
   * @param {string} slug - Post slug
   * @param {object} [opts]
   * @returns {Promise<ProductionPost|null>}
   */
  async getBySlug(slug, opts = {}) {
    const post = await ProductionPost.query()
      .where('slug', slug)
      .whereNull('deleted_at')
      .withGraphFetched('[creator(selectBasic), category, tags, media]')
      .modifiers(BaseModel.defaultModifiers)
      .modifyGraph('media', (builder) => builder.orderBy('sort_order', 'asc'))
      .first();

    if (!post || !this._canAccess(post, opts)) {
      return null;
    }

    return post;
  }

  /**
   * Create a new post (always starts as draft)
   * @param {string} userId - Author user ID
   * @param {object} data - Post data (validated & sanitized)
   * @returns {Promise<ProductionPost>} Newly created post
   */
  async create(userId, data) {
    return ProductionPost.transaction(async (trx) => {
      const clean = this.normalizeData(data);

      // Optional link to Film: ensure the film actually exists
      if (clean.film_id) {
        const film = await Film.query(trx).findById(clean.film_id);
        if (!film) throw new ValidationError('Film tidak ditemukan');
      }

      const post = await ProductionPost.query(trx).insert({
        ...clean,
        user_id: userId,
        status: POST_STATUS.DRAFT,
        is_pinned: clean.is_pinned || false
      });

      // Media gallery
      if (Array.isArray(clean.media) && clean.media.length > 0) {
        await this._attachMedia(trx, post.post_id, clean.media);
      }

      // Tags
      if (Array.isArray(clean.tags) && clean.tags.length > 0) {
        await this._syncTags(trx, post.post_id, clean.tags);
      }

      return post;
    });
  }

  /**
   * Update an existing post (media & tags are fully replaced when provided)
   * @param {number} id - Post ID
   * @param {object} data - Update data
   * @returns {Promise<ProductionPost|null>} Updated post or null if not found
   */
  async update(id, data) {
    const existing = await ProductionPost.query()
      .findById(id)
      .whereNull('deleted_at');
    if (!existing) return null;

    const clean = this.normalizeData(data);

    // Regenerate slug if the title changed on an already-published post
    if (clean.judul && clean.judul !== existing.judul && existing.slug) {
      clean.slug = Film.generateSlug(clean.judul, id);
    }

    // Optional link to Film: ensure the film actually exists
    if (clean.film_id) {
      const film = await Film.query().findById(clean.film_id);
      if (!film) throw new ValidationError('Film tidak ditemukan');
    }

    return ProductionPost.transaction(async (trx) => {
      // Remove replaced cover file
      if (
        clean.gambar_cover &&
        existing.gambar_cover &&
        clean.gambar_cover !== existing.gambar_cover
      ) {
        await deleteFile(existing.gambar_cover);
      }

      // Replace media gallery (files + rows)
      if (clean.media) {
        const oldMedia = await ProductionPostMedia.query(trx).where('post_id', id);
        await Promise.all(oldMedia.map((media) => deleteFile(media.file_path)));
        await ProductionPostMedia.query(trx).where('post_id', id).delete();
        if (clean.media.length > 0) {
          await this._attachMedia(trx, id, clean.media);
        }
      }

      // Replace tags
      if (clean.tags) {
        await ProductionPostTag.query(trx).where('post_id', id).delete();
        if (clean.tags.length > 0) {
          await this._syncTags(trx, id, clean.tags);
        }
      }

      const { media, tags, ...rest } = clean;
      return ProductionPost.query(trx).patchAndFetchById(id, rest);
    });
  }

  /**
   * Publish a draft post: sets status, published_at, and generates slug
   * @param {number} id - Post ID
   * @param {object} [opts]
   * @returns {Promise<ProductionPost|null>}
   */
  async publish(id, { actorId = null, ipAddress = null } = {}) {
    const post = await ProductionPost.query()
      .findById(id)
      .whereNull('deleted_at');
    if (!post) return null;

    const updated = await ProductionPost.transaction(async (trx) => {
      const patch = {
        status: POST_STATUS.PUBLISHED,
        published_at: new Date()
      };
      // Slug generated once, following the film slug pattern
      if (!post.slug) {
        patch.slug = Film.generateSlug(post.judul, post.post_id);
      }
      return ProductionPost.query(trx).patchAndFetchById(id, patch);
    });

    // Notify the film owner when the post links to their film
    if (updated.film_id) {
      try {
        const film = await Film.query().findById(updated.film_id);
        if (film && film.user_id && film.user_id !== post.user_id) {
          await notificationService.create({
            user_id: film.user_id,
            type: 'production_post',
            title: 'Post produksi baru terkait film Anda',
            message: `Post produksi baru terhubung ke film "${film.judul}".`,
            data: {
              post_id: updated.post_id,
              film_id: updated.film_id,
              slug: updated.slug
            }
          });
        }
      } catch (err) {
        console.error('Failed to send production_post notification:', err.message);
      }
    }

    await this._recordAudit(
      actorId,
      ipAddress,
      'PUBLISH_PRODUCTION_POST',
      updated.post_id,
      { judul: updated.judul }
    );

    return updated;
  }

  /**
   * Archive a published post
   * @param {number} id - Post ID
   * @param {object} [opts]
   * @returns {Promise<ProductionPost|null>}
   */
  async archive(id, { actorId = null, ipAddress = null } = {}) {
    const post = await ProductionPost.query()
      .findById(id)
      .whereNull('deleted_at');
    if (!post) return null;

    const updated = await ProductionPost.query().patchAndFetchById(id, {
      status: POST_STATUS.ARCHIVED
    });

    await this._recordAudit(
      actorId,
      ipAddress,
      'ARCHIVE_PRODUCTION_POST',
      id,
      { judul: post.judul }
    );

    return updated;
  }

  /**
   * Soft delete a post (keeps row, media rows, comments; only sets deleted_at)
   * @param {number} id - Post ID
   * @param {object} [opts]
   * @returns {Promise<ProductionPost|null>}
   */
  async softDelete(id, { actorId = null, ipAddress = null } = {}) {
    const post = await ProductionPost.query()
      .findById(id)
      .whereNull('deleted_at');
    if (!post) return null;

    const updated = await ProductionPost.query().patchAndFetchById(id, {
      deleted_at: new Date()
    });

    await this._recordAudit(
      actorId,
      ipAddress,
      'DELETE_PRODUCTION_POST',
      id,
      { judul: post.judul }
    );

    return updated;
  }

  /**
   * Hard delete a post (admin only): removes physical files and the row,
   * media/tags/comments rows are removed by FK CASCADE
   * @param {number} id - Post ID
   * @param {object} [opts]
   * @returns {Promise<number>} Deleted rows count
   */
  async hardDelete(id, { actorId = null, ipAddress = null } = {}) {
    const post = await ProductionPost.query().findById(id);
    if (!post) return null;

    const media = await ProductionPostMedia.query().where('post_id', id);
    await Promise.all([
      deleteFile(post.gambar_cover),
      ...media.map((item) => deleteFile(item.file_path))
    ]);

    const deleted = await ProductionPost.query().deleteById(id);

    if (deleted) {
      await this._recordAudit(
        actorId,
        ipAddress,
        'HARD_DELETE_PRODUCTION_POST',
        id,
        { judul: post.judul }
      );
    }

    return deleted;
  }

  /**
   * Create a tag (name normalized, slug auto-generated)
   * @param {object} data - Tag data (nama_tag)
   * @returns {Promise<Tag>}
   */
  async createTag(data) {
    const namaTag = sanitizePlainText(String(data.nama_tag || '').trim());
    if (!namaTag) throw new ValidationError('Nama tag tidak boleh kosong');

    const existing = await Tag.query().where('nama_tag', namaTag).first();
    if (existing) throw new ConflictError('Tag sudah ada');

    return Tag.query().insert({
      nama_tag: namaTag,
      slug: Film.generateSlug(namaTag)
    });
  }

  /**
   * Get all tags (for filter/search UI)
   * @returns {Promise<Tag[]>}
   */
  async getTags() {
    return Tag.query().orderBy('nama_tag', 'asc');
  }

  /**
   * Update a tag (slug regenerated when name changes)
   * @param {number} tagId - Tag ID
   * @param {object} data - Update data
   * @returns {Promise<Tag|null>}
   */
  async updateTag(tagId, data) {
    const patch = {};
    if (data.nama_tag) {
      const namaTag = sanitizePlainText(String(data.nama_tag).trim());
      patch.nama_tag = namaTag;
      patch.slug = Film.generateSlug(namaTag);
    }
    return Tag.query().patchAndFetchById(tagId, patch);
  }

  /**
   * Delete a tag (junction rows removed by FK CASCADE)
   * @param {number} tagId - Tag ID
   * @returns {Promise<number>} Deleted rows
   */
  async deleteTag(tagId) {
    return Tag.query().deleteById(tagId);
  }

  /**
   * Access control for a single post
   * @param {ProductionPost} post - Post instance
   * @param {object} [opts]
   * @returns {boolean}
   */
  _canAccess(post, { requesterId = null, isModerator = false } = {}) {
    if (isModerator) return true;
    if (requesterId && post.user_id === requesterId) return true;
    return post.status === POST_STATUS.PUBLISHED && post.visibility === POST_VISIBILITY.PUBLIC;
  }

  /**
   * Insert media rows for a post inside a transaction
   * @param {import('objection').Transaction} trx
   * @param {number} postId - Post ID
   * @param {object[]} mediaList - Media items
   */
  async _attachMedia(trx, postId, mediaList) {
    const rows = mediaList.map((media, index) => ({
      post_id: postId,
      media_type: media.media_type,
      file_path: media.file_path,
      mime_type: media.mime_type || null,
      file_size: media.file_size != null ? media.file_size : null,
      thumbnail: media.thumbnail || null,
      duration: media.duration != null ? media.duration : null,
      sort_order: media.sort_order != null ? media.sort_order : index
    }));

    await ProductionPostMedia.query(trx).insert(rows);
  }

  /**
   * Upsert tags by name and link them to a post inside a transaction
   * @param {import('objection').Transaction} trx
   * @param {number} postId - Post ID
   * @param {string[]} tagNames - Tag names
   */
  async _syncTags(trx, postId, tagNames) {
    const tagIds = [];

    for (const name of tagNames) {
      const trimmed = sanitizePlainText(String(name || '').trim());
      if (!trimmed) continue;

      let tag = await Tag.query(trx).where('nama_tag', trimmed).first();
      if (!tag) {
        tag = await Tag.query(trx).insert({
          nama_tag: trimmed,
          slug: Film.generateSlug(trimmed)
        });
      }
      tagIds.push(tag.tag_id);
    }

    if (tagIds.length > 0) {
      await ProductionPostTag.query(trx).insert(
        tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId }))
      );
    }
  }

  /**
   * Record an audit log entry (must never crash the main flow)
   * @param {string|null} actorId - Acting user ID
   * @param {string|null} ipAddress - Requester IP
   * @param {string} action - Audit action name
   * @param {number} targetId - Target post/comment ID
   * @param {object} [details={}] - Extra details
   */
  async _recordAudit(actorId, ipAddress, action, targetId, details = {}) {
    if (!actorId) return;
    await recordAuditLog({
      userId: actorId,
      action,
      targetType: 'production_post',
      targetId,
      details,
      ipAddress
    });
  }
}

export const productionFeedService = new ProductionFeedService();
```

---

## 2. Method List

### Posts (lifecycle)

| # | Method | Signature | Deskripsi |
|---|---|---|---|
| 1 | `normalizeData` | `(data) → object` | Sanitasi `isi_konten` (rich text). |
| 2 | `getAll` | `({ page, limit, status, visibility, category_id, film_id, user_id, author, tipe, tag_id, search, date_from, date_to, sortBy, sortOrder, requesting_user_id, is_pinned, cursor }) → {posts, pagination}` | Listing feed + **search** (keyword, author, category, tag, film, date, visibility) + **cursor pagination** + access control + soft-delete aware. Detail: `SEARCH_PRODUCTION_FEED.md`. |
| 3 | `getByAuthor` | `(userId, options) → {posts, pagination}` | Post milik author (semua status). |
| 4 | `getById` | `(id, { requesterId, isModerator }) → post\|null` | Detail + relasi `creator/category/tags/media` + access control. |
| 5 | `getBySlug` | `(slug, opts) → post\|null` | Detail via slug. |
| 6 | `create` | `(userId, data) → post` | Buat post (status `draft`), validasi Film, insert media & tag (transaksi). |
| 7 | `update` | `(id, data) → post\|null` | Update; regenerate slug, hapus file cover lama, replace media & tag (transaksi). |
| 8 | `publish` | `(id, { actorId, ipAddress }) → post\|null` | Set `published` + `published_at` + generate slug; notifikasi pemilik film + audit. |
| 9 | `archive` | `(id, { actorId, ipAddress }) → post\|null` | Set `archived` + audit. |
| 10 | `softDelete` | `(id, { actorId, ipAddress }) → post\|null` | Set `deleted_at` (soft delete) + audit. |
| 11 | `hardDelete` | `(id, { actorId, ipAddress }) → rows\|null` | Hapus file fisik + baris (CASCADE), khusus admin + audit. |

### Tags

| # | Method | Signature | Deskripsi |
|---|---|---|---|
| 12 | `createTag` | `(data) → tag` | Normalisasi nama, deteksi duplikat (ConflictError), slug otomatis. |
| 13 | `getTags` | `() → tag[]` | List tag terurut. |
| 14 | `updateTag` | `(tagId, data) → tag\|null` | Update nama + slug. |
| 15 | `deleteTag` | `(tagId) → rows` | Hapus tag (junction CASCADE). |

### Komentar (di `productionFeed.commentAdapter.js`)

Method komentar **tidak ada** di service feed — keputusan adapter komentar:

| # | Method | Lokasi | Deskripsi |
|---|---|---|---|
| A1 | `getByPost` | `productionFeed.commentAdapter.js` | Komentar post (flat, paginated) via `Discussion.post_id`. |
| A2 | `getCommentCount` | `productionFeed.commentAdapter.js` | Jumlah komentar post. |
| A3 | `addComment` | `productionFeed.commentAdapter.js` | Validasi post published & public; insert `discussions`; **notifikasi** penulis post (`production_comment`) + mention (`production_mention`). |

Penghapusan komentar memakai `discussionService.delete` existing (`DELETE /discussions/:id`, rekursif CTE) — **tidak ada method baru**.

### Helper internal

| # | Method | Deskripsi |
|---|---|---|
| 16 | `_canAccess` | Access control post: moderator ✓ / owner ✓ / published+public ✓. |
| 17 | `_attachMedia` | Insert baris media dalam transaksi (`sort_order` default = index). |
| 18 | `_syncTags` | Upsert tag by name + link junction (dalam transaksi). |
| 19 | `_recordAudit` | Wrapper `recordAuditLog`, `targetType: 'production_post'`. |
| 20 | `_extractMentionCandidates` (adapter) | Ekstrak calon `@Nama` (maks. 2 kata) dari teks komentar. |
| 21 | `_notifyMentionedUsers` (adapter) | Notifikasi `production_mention` ke tiap user yang cocok (`users.name`), per-recipient `try/catch`. |
| 22 | `_encodeCursor` | `(sortBy, sortOrder, is_pinned, sort_value, post_id) → base64url(JSON)` — token cursor opaque. |
| 23 | `_decodeCursor` | `(cursor) → payload` — decode + validasi `{v, sortBy, sortOrder, is_pinned, sort_value, post_id}`; invalid → `ValidationError`. |
| 24 | `_applyCursor` | `(query, payload, opts)` — predikat keyset `is_pinned DESC, <sortBy> DIR, post_id DIR`; sort mismatch → `ValidationError`. |
| 25 | `_formatDateTime` | Serialisasi tanggal cursor ke `YYYY-MM-DD HH:mm:ss` (konsisten dengan mysql2). |

---

## 3. Reuse yang Diterapkan

| Kebutuhan | Reuse | Titik pemakaian |
|---|---|---|
| **Notification** | `notificationService.create` (import dari `./notification.service.js`) | adapter `addComment` → `production_comment` (penulis) + `production_mention` (user yang disebut `@Nama`); `publish` → `production_post` (pemilik film). Side-effect dibungkus `try/catch`. Detail event: `NOTIFICATIONS_PRODUCTION_FEED.md`. |
| **Upload** | `deleteFile`, `fileExists`, `getSubfolderForMediaType` (`lib/upload.js`) | `update` (cover & media diganti), `hardDelete` (semua file fisik), `_assertUploadedMedia` (validasi media). |
| **Comment** | `Discussion` model + `discussionService.delete` (komentar film existing, rekursif CTE) | adapter komentar feed (`productionFeed.commentAdapter.js`). |
| **Audit** | `recordAuditLog` (`lib/audit.js`) | publish / archive / softDelete / hardDelete. |
| **Slug** | `Film.generateSlug` (tidak membuat slug generator baru) | `publish` (post), `createTag`/`updateTag`/`_syncTags` (tag). |
| **Sanitasi** | `sanitizeRichText` (isi_konten), `sanitizePlainText` (komentar, tag) | `normalizeData`, adapter `addComment`, `createTag`, `_syncTags`. |
| **Pagination** | `PAGINATION`, `buildPagination` (`config/constants.js`) | `getAll`, adapter `getByPost`. |
| **Error** | `ValidationError`, `ConflictError`; adapter memakai `NotFoundError` juga (`lib/errors.js`) | Validasi domain di service (di-handle `globalErrorHandler`). |

---

## 4. Review

### 4.1 Kesesuaian aturan
- ✅ **Tanpa Fastify code / Request object** — semua argumen primitif (`userId`, `id`, `data`, `opts`); audit menerima `actorId` + `ipAddress` sebagai data polos.
- ✅ **Business logic di service** — validasi film, access control, transaksi, notifikasi, audit, cleanup file ada di service; controller hanya memetakan request→service→response (tahap berikutnya).
- ✅ **Reuse** — tanpa utility baru; semua helper yang ada dipakai (lihat §3).
- ✅ **Pola project** — `class + singleton`, JSDoc, `withGraphFetched` + `modifiers`, `applyFilters`, transaksi Objection, `buildPagination`, pesan Bahasa Indonesia.

### 4.2 Konsistensi dengan dokumen feed
- ✅ Sesuai `ARCHITECTURE_PRODUCTION_FEED.md`: relasi Film read-only (hanya cek eksistensi), notifikasi outbound, komentar Post via adapter (`productionFeed.commentAdapter.js`).
- ✅ Sesuai `DATABASE_PRODUCTION_FEED.md`: draft→published→archived, `published_at`, soft delete via `deleted_at`, media gallery, tag M:N.
- ✅ Slug dibuat saat **publish** (`Film.generateSlug(judul, post_id)`), nullable saat draft.

### 4.3 Poin yang diperiksa (self-review)
- [x] `getAll`: soft delete (`whereNull('deleted_at')`), access control status+visibility, semua filter (keyword/author/date/visibility), sorting pinned-first + tiebreaker `post_id`, pagination count query identik, mode **cursor keyset** tanpa count query.
- [x] Cursor helper (`_encodeCursor`/`_decodeCursor`/`_applyCursor`/`_formatDateTime`): round-trip, validasi versi & sort, predikat keyset verified via SQL compile (lihat `SEARCH_PRODUCTION_FEED.md` §7).
- [x] `buildPagination` dipanggil dengan urutan argumen yang benar **`(total, page, limit)`** di `getAll` & adapter `getByPost` (bug pre-existing diperbaiki).
- [x] `getById`/`getBySlug`: tidak membocorkan draft/private ke non-owner (kecuali moderator).
- [x] `create`/`update`: `film_id` divalidasi eksis (hindari FK error 500), seluruhnya dalam transaksi.
- [x] `update` media/tags: **full replace** — file lama dihapus, baris lama dihapus, lalu insert ulang; `media`/`tags` dikeluarkan dari `patch`.
- [x] Side-effects (notifikasi, audit, deleteFile) tidak pernah menggagalkan request utama (`try/catch` / helper aman).
- [x] `hardDelete` hanya admin (enforcement role ada di controller nanti; service tetap aman tanpa audit bila `actorId` null).
- [x] Method komentar (`getComments`/`addComment`/`deleteComment`/`deleteCommentByModerator`) **dihapus** dari service — keputusan adapter komentar (`docs/feed/COMMENTS_PRODUCTION_FEED.md`).
- [x] Syntax & load tervalidasi: `node --check` + import runtime → `productionFeedService` ter-export, method terdaftar.

### 4.4 Perubahan lintas module (alasan)
- **`src/services/index.js`** ditambah `export * from './productionFeed.service.js'` + `export * from './productionFeed.commentAdapter.js'` — wajib agar controller (tahap berikutnya) dapat mengimpor via barrel `../services/index.js`, konsisten dengan service lain. Hanya penambahan baris.
- **`src/services/productionFeed.commentAdapter.js`** (baru, keputusan adapter komentar): memuat aturan domain komentar Post (validasi published & public, notifikasi `production_comment` ke penulis, pagination flat) di atas `Discussion` model existing — bukan di `productionFeed.service.js`.

---

## 5. Checklist Testing

- [ ] `node --check src/services/productionFeed.service.js` (✔ sudah OK).
- [ ] Import `services/index.js` → `productionFeedService` & `productionFeedCommentAdapter` ter-export tanpa error (✔ sudah OK).
- [ ] **Unit (Vitest, mock model)** — butuh DB untuk aktual:
  - [ ] `getAll` default → hanya `status='published'`, `visibility='public'`, `deleted_at` NULL, pinned di atas.
  - [ ] `getAll` dengan `requesting_user_id` → user melihat post sendiri (semua status) + post public published orang lain.
  - [ ] `getAll` filter `search`, `category_id`, `film_id`, `tipe`, `tag_id` benar.
  - [ ] `getById` draft oleh non-owner → `null`; oleh owner/moderator → post.
  - [ ] `create` → status `draft`, media & tag terinsert; `film_id` invalid → `ValidationError`.
  - [ ] `publish` → `published` + `published_at` + `slug` terisi; republish tidak mengubah slug.
  - [ ] `update` ganti `gambar_cover`/media → file lama terhapus (`vi.mock('lib/upload.js')`).
  - [ ] `softDelete` → `deleted_at` terisi, baris media/komentar tetap; `getAll` tidak menampilkannya.
  - [ ] `hardDelete` → baris + media/tags/komentar terhapus (CASCADE), file terhapus.
  - [ ] **Adapter** `addComment` → insert `discussions` + notifikasi `production_comment` & `production_mention` (mock `notificationService`); post draft/private → `ValidationError`; post tidak ada → `NotFoundError`. (✔ `productionFeed.commentAdapter.test.js` — 9 test.)
  - [ ] `createTag` duplikat → `ConflictError`; slug tag otomatis.
  - [ ] `recordAuditLog` terpanggil pada publish/archive/delete (mock `lib/audit.js`).
- [ ] **Integration** (pola `build()` di TESTING_GUIDE): alur public feed → detail → komentar (`/discussions/post/*`) → notifikasi; alur creator create→publish→archive→delete.
