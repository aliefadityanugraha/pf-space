/**
 * src/services/productionFeed.service.js
 *
 * Service for Production Feed business logic: posts, media, and tags.
 * Comments are handled by productionFeed.commentAdapter.js (reuses the
 * existing Discussion/comment system). Reuses existing Notification,
 * Upload, Audit, and patterns without touching other modules.
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
   * Fetch a paginated list of posts with search filters (keyword, author,
   * category, tag, film, date range, visibility) and optional cursor pagination.
   * @param {object} options - Search, filter, and pagination options
   * @returns {Promise<object>} Paginated result
   */
  async getAll(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = POST_STATUS.PUBLISHED,
      visibility,
      category_id,
      film_id,
      user_id,
      author,
      tipe,
      tag_id,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
      requesting_user_id,
      is_pinned,
      date_from,
      date_to,
      cursor
    } = options;

    const decodedCursor = cursor ? this._decodeCursor(cursor) : null;
    if (cursor && !decodedCursor) {
      throw new ValidationError('Cursor tidak valid');
    }
    if (
      decodedCursor &&
      (decodedCursor.sortBy !== sortBy || decodedCursor.sortOrder !== sortOrder)
    ) {
      throw new ValidationError('Cursor tidak valid untuk urutan saat ini');
    }

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
        q.where('visibility', POST_VISIBILITY.PUBLIC);
      }

      // 4. Explicit Visibility Filter (narrows only, never widens access)
      if (visibility) {
        q.where('visibility', visibility);
      }

      // 5. Author Filters
      if (user_id) {
        q.where('user_id', user_id);
      }
      if (author && String(author).trim()) {
        const term = `%${String(author).trim()}%`;
        q.whereIn('user_id', (sub) =>
          sub.select('id').from('users').where('name', 'like', term)
        );
      }

      // 6. Category / Film / Type / Pin Filters
      if (category_id) q.where('category_id', category_id);
      if (film_id) q.where('film_id', film_id);
      if (tipe) q.where('tipe', tipe);
      if (is_pinned !== undefined) q.where('is_pinned', is_pinned);

      // 7. Date range (published_at for the published feed, else created_at)
      if (date_from || date_to) {
        const dateColumn =
          status === POST_STATUS.PUBLISHED ? 'published_at' : 'created_at';
        if (date_from) q.where(dateColumn, '>=', `${date_from} 00:00:00`);
        if (date_to) q.where(dateColumn, '<=', `${date_to} 23:59:59`);
      }

      // 8. Tag Filter (via junction table)
      if (tag_id) {
        q.whereIn('post_id', (sub) =>
          sub
            .select('post_id')
            .from('production_post_tags')
            .where('tag_id', tag_id)
        );
      }

      // 9. Search by title or content (Case-Insensitive) — keyword
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

    // Sorting: pinned first, then requested column (+ stable post_id tiebreaker)
    query
      .orderBy('is_pinned', 'desc')
      .orderBy(sortBy, sortOrder)
      .orderBy('post_id', sortOrder);

    // Cursor (keyset) pagination: no count query, returns next_cursor + has_more
    if (decodedCursor) {
      this._applyCursor(query, decodedCursor, sortBy, sortOrder);

      const rows = await query.limit(limit + 1);
      const hasMore = rows.length > limit;
      const posts = rows.slice(0, limit);
      const last = posts[posts.length - 1];

      return {
        posts,
        pagination: {
          limit,
          next_cursor: hasMore && last ? this._encodeCursor(last, sortBy, sortOrder) : null,
          has_more: hasMore
        }
      };
    }

    // Offset pagination (default, backward compatible)
    const offset = (page - 1) * limit;

    const countQuery = ProductionPost.query();
    applyFilters(countQuery);

    const [posts, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('post_id as total').first()
    ]);

    const total = parseInt(totalResult?.total || 0);

    return {
      posts,
      pagination: buildPagination(total, parseInt(page), parseInt(limit))
    };
  }

  /**
   * Encode an opaque cursor for the last row of a page. Format: base64url JSON
   * carrying the sort position tuple (is_pinned, sortBy value, post_id).
   * @param {object} post - Last post of the current page
   * @param {string} sortBy - Sort column
   * @param {string} sortOrder - 'asc' | 'desc'
   * @returns {string} Opaque cursor string
   */
  _encodeCursor(post, sortBy, sortOrder) {
    const rawValue = post[sortBy];
    const sortValue =
      rawValue instanceof Date ? this._formatDateTime(rawValue) : rawValue;
    const payload = {
      v: 1,
      sortBy,
      sortOrder,
      is_pinned: post.is_pinned ? 1 : 0,
      sort_value: sortValue,
      post_id: post.post_id
    };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
  }

  /**
   * Decode and validate an opaque cursor.
   * @param {string} cursor - Cursor string from the client
   * @returns {object|null} Parsed cursor, or null when invalid
   */
  _decodeCursor(cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
      if (
        parsed.v !== 1 ||
        !parsed.sortBy ||
        !parsed.sortOrder ||
        parsed.post_id == null ||
        parsed.is_pinned == null
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Apply the keyset predicate for the page after `cursor`. Must match the
   * ordering `is_pinned DESC, sortBy DIR, post_id DIR` (DIR = sortOrder).
   * @param {object} q - Objection query builder
   * @param {object} cursor - Decoded cursor
   * @param {string} sortBy - Sort column
   * @param {string} sortOrder - 'asc' | 'desc'
   * @returns {void}
   */
  _applyCursor(q, cursor, sortBy, sortOrder) {
    const op = (dir) => (dir === 'desc' ? '<' : '>');
    const cols = [{ key: 'is_pinned', value: cursor.is_pinned, dir: 'desc' }];
    if (sortBy !== 'is_pinned') {
      cols.push({ key: sortBy, value: cursor.sort_value, dir: sortOrder });
    }
    cols.push({ key: 'post_id', value: cursor.post_id, dir: sortOrder });

    q.where((builder) => {
      const buildLevel = (b, index) => {
        const { key, value, dir } = cols[index];
        if (index === cols.length - 1) {
          b.where(key, op(dir), value);
          return;
        }
        b.where((group) => {
          group
            .where(key, op(dir), value)
            .orWhere((sub) => {
              sub.where(key, value);
              buildLevel(sub, index + 1);
            });
        });
      };
      buildLevel(builder, 0);
    });
  }

  /**
   * Format a Date into a MySQL DATETIME string using server-local time, matching
   * how mysql2 serializes Date params (keeps cursor comparisons timezone-consistent).
   * @param {Date} date - Date to format
   * @returns {string} 'YYYY-MM-DD HH:mm:ss'
   */
  _formatDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
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

      // Optional cover: must be a real uploaded file (photo)
      if (clean.gambar_cover) {
        this._assertUploadedMedia(clean.gambar_cover, MEDIA_TYPE.PHOTO);
      }

      const { media, tags, ...postData } = clean;

      const post = await ProductionPost.query(trx).insertAndFetch({
        ...postData,
        user_id: userId,
        status: POST_STATUS.DRAFT,
        is_pinned: clean.is_pinned || false
      });

      // Media gallery
      if (Array.isArray(media) && media.length > 0) {
        await this._attachMedia(trx, post.post_id, media);
      }

      // Tags
      if (Array.isArray(tags) && tags.length > 0) {
        await this._syncTags(trx, post.post_id, tags);
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

    // Optional cover: must be a real uploaded file (photo)
    if (clean.gambar_cover) {
      this._assertUploadedMedia(clean.gambar_cover, MEDIA_TYPE.PHOTO);
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
        const newFilePaths = new Set(clean.media.map((m) => m.file_path).filter(Boolean));

        // Only delete physical files that are no longer present in the updated media list
        const removedMedia = oldMedia.filter((m) => !newFilePaths.has(m.file_path));
        await Promise.all(removedMedia.map((media) => deleteFile(media.file_path)));

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
        published_at: this._formatDateTime(new Date())
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
      deleted_at: this._formatDateTime(new Date())
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
   * Validate a file reference against the existing Upload System:
   * - media type must be supported (photo/video/pdf)
   * - file must live in the matching upload subfolder
   * - the physical file must exist (uploaded via Tus)
   * @param {string} filePath - "/uploads/<subfolder>/<file>"
   * @param {string} mediaType - MEDIA_TYPE.PHOTO | VIDEO | PDF
   */
  _assertUploadedMedia(filePath, mediaType) {
    const expectedSub = getSubfolderForMediaType(mediaType);
    if (!expectedSub) throw new ValidationError('Tipe media tidak didukung');

    if (!filePath) throw new ValidationError('File media wajib diisi');

    const parts = String(filePath).split('/').filter(Boolean);
    if (parts[1] !== expectedSub) {
      throw new ValidationError(`File harus berada di folder /uploads/${expectedSub}/`);
    }

    if (!fileExists(filePath)) {
      throw new ValidationError('File media tidak ditemukan, silakan unggah ulang');
    }
  }

  /**
   * Insert media rows for a post inside a transaction
   * @param {import('objection').Transaction} trx
   * @param {number} postId - Post ID
   * @param {object[]} mediaList - Media items
   */
  async _attachMedia(trx, postId, mediaList) {
    for (const media of mediaList) {
      this._assertUploadedMedia(media.file_path, media.media_type);

      // Optional thumbnail: must also be a real uploaded image
      if (media.thumbnail && !fileExists(media.thumbnail)) {
        throw new ValidationError('Thumbnail media tidak ditemukan, silakan unggah ulang');
      }
    }

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

    for (const row of rows) {
      await ProductionPostMedia.query(trx).insert(row);
    }
  }

  /**
   * Upsert tags by name and link them to a post inside a transaction.
   * @param {import('objection').Transaction} trx
   * @param {number} postId - Post ID
   * @param {string[]} tagNames - Tag names
   */
  async _syncTags(trx, postId, tagNames) {
    // Dedupe case-insensitively
    const unique = new Map();
    for (const raw of tagNames) {
      const name = sanitizePlainText(String(raw || '').trim());
      if (!name) continue;
      unique.set(name.toLowerCase(), name);
    }
    const names = [...unique.values()];
    if (!names.length) return;

    const normalize = (name) => name.toLowerCase();
    const tagIdByName = new Map();

    const existing = await Tag.query(trx).whereIn('nama_tag', names);
    for (const tag of existing) {
      tagIdByName.set(normalize(tag.nama_tag), tag.tag_id);
    }

    const missing = names.filter((name) => !tagIdByName.has(normalize(name)));
    if (missing.length > 0) {
      for (const name of missing) {
        await Tag.query(trx).insert({ nama_tag: name, slug: Film.generateSlug(name) });
      }
      const newlyCreated = await Tag.query(trx).whereIn('nama_tag', missing);
      for (const tag of newlyCreated) {
        tagIdByName.set(normalize(tag.nama_tag), tag.tag_id);
      }
    }

    for (const name of names) {
      const tagId = tagIdByName.get(normalize(name));
      if (tagId) {
        await ProductionPostTag.query(trx).insert({ post_id: postId, tag_id: tagId });
      }
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
