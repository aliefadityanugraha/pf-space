/**
 * src/services/film.service.js
 *
 * Service for film-related business logic, handling database
 * operations for creating, reading, updating, and deleting films.
 */

import { Film, BaseModel, Vote, Discussion } from "../models/index.js";
import { deleteFile } from "../lib/upload.js";
import { FILM_STATUS, PAGINATION, parsePagination, buildPagination } from "../config/constants.js";
import { embeddingService } from "./embedding.service.js";
import { sanitizeRichText, sanitizePlainText } from "../lib/sanitize.js";
import { enqueueVideoTranscoding } from "../lib/queue/transcoderQueue.js";
import { NotFoundError } from "../lib/errors.js";
import { transcodeAuditService } from "./transcodeAudit.service.js";

export class FilmService {
  /**
   * Normalizes and sanitizes film data before insertion or update.
   * Cleans the crew array and strips dangerous HTML from content.
   *
   * @param {object} data - Raw input data.
   * @returns {object} Cleaned data object.
   */
  normalizeData(data) {
    const clean = { ...data };

    // 1. Clean Crew Structure
    if (Array.isArray(clean.crew)) {
      clean.crew = clean.crew
        .filter((c) => c && typeof c === "object")
        .map((c) => ({
          jabatan: typeof c.jabatan === "string" ? c.jabatan.trim() : "",
          anggota: Array.isArray(c.anggota)
            ? c.anggota
                .filter((a) => typeof a === "string" && a.trim())
                .map((a) => a.trim())
            : [],
        }))
        .filter((c) => c.jabatan);
      if (clean.crew.length === 0) clean.crew = null;
    } else if (clean.crew !== undefined) {
      clean.crew = null;
    }

    // 2. Sanitize HTML Content
    if (clean.deskripsi_lengkap)
      clean.deskripsi_lengkap = sanitizeRichText(clean.deskripsi_lengkap);
    if (clean.sinopsis) clean.sinopsis = sanitizePlainText(clean.sinopsis);

    return clean;
  }

  /**
   * Fetch a paginated list of films with multiple filtering and sorting options
   * @param {object} options - Search and pagination options
   * @param {number} [options.page=1] - Current page number
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.status='published'] - Film status filter
   * @param {number} [options.category_id] - Category ID filter
   * @param {string} [options.search] - Search term for title and synopsis
   * @param {string} [options.user_id] - Creator ID filter
   * @param {string} [options.sortBy='created_at'] - Column to sort by
   * @param {string} [options.sortOrder='desc'] - Sort direction ('asc' or 'desc')
   * @param {string} [options.requesting_user_id] - ID of user making the request (for owner access)
   * @param {boolean} [options.is_banner_active] - Filter for banner films
   * @returns {Promise<{films: Film[], pagination: object}>} Paginated result object
   */
  async getAll(options = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      status = FILM_STATUS.PUBLISHED,
      category_id,
      search,
      user_id,
      sortBy = "created_at",
      sortOrder = "desc",
      requesting_user_id,
      is_banner_active,
    } = options;

    const query = Film.query()
      .withGraphFetched("[creator(selectBasic), category]")
      .modifiers(BaseModel.defaultModifiers);

    // Helper to apply filters to both main and count queries
    const applyFilters = (q) => {
      // 1. Handle Status & Access Control
      if (status) {
        if (status === FILM_STATUS.PUBLISHED && requesting_user_id) {
          // Public shows published, but owner sees their own too
          q.where((builder) => {
            builder
              .where("status", FILM_STATUS.PUBLISHED)
              .orWhere("user_id", requesting_user_id);
          });
        } else {
          q.where("status", status);
        }
      }

      // 2. Explicit User Filter
      if (user_id) {
        q.where("user_id", user_id);
      }

      // 3. Category Filter
      if (category_id) {
        q.where("category_id", category_id);
      }

      // 4. Search by title or synopsis (Case-Insensitive)
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        q.where((builder) => {
          builder
            .where("judul", "like", term)
            .orWhere("sinopsis", "like", term);
        });
      }

      // 5. Banner Filter
      if (is_banner_active !== undefined) {
        q.where("is_banner_active", is_banner_active);
      }
    };

    applyFilters(query);

    // Sorting
    query.orderBy(sortBy || "created_at", sortOrder || "desc");

    // Pagination
    const offset = (page - 1) * limit;

    // Count query
    const countQuery = Film.query();
    applyFilters(countQuery);

    const [films, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count("film_id as total").first(),
    ]);

    const total = parseInt(totalResult?.total || 0);

    return {
      films,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single film by its ID
   * @param {number} id - Film ID
   * @returns {Promise<Film|null>} Film object or null
   */
  async getById(id) {
    return Film.query()
      .findById(id)
      .withGraphFetched("[creator(selectBasic), category]")
      .modifiers(BaseModel.defaultModifiers);
  }

  /**
   * Increment the view count for a specific film
   * @param {number} id - Film ID
   * @returns {Promise<number>} Number of rows updated
   */
  async incrementViews(id) {
    return Film.query().findById(id).increment("views", 1);
  }

  /**
   * Get a single film by its URL slug
   * @param {string} slug - Film slug
   * @returns {Promise<Film|null>} Film object or null
   */
  async getBySlug(slug) {
    return Film.query()
      .where("slug", slug)
      .withGraphFetched("[creator(selectBasic), category, evaluation]")
      .modifiers(BaseModel.defaultModifiers)
      .first();
  }

  /**
   * Get a list of related films based on category
   * @param {number} filmId - Current film ID to exclude from results
   * @param {number} [limit=4] - Max number of related films
   * @returns {Promise<Film[]>} Array of related film objects
   */
  async getRelated(filmId, limit = 4) {
    const film = await this.getById(filmId);
    if (!film) return [];

    // Fetch more than needed then shuffle in JS — avoids MySQL RAND() full table scan
    const candidates = await Film.query()
      .where("category_id", film.category_id)
      .where("status", FILM_STATUS.PUBLISHED)
      .whereNot("film_id", filmId)
      .withGraphFetched("[creator(selectBasic), category]")
      .modifiers(BaseModel.defaultModifiers)
      .orderBy("created_at", "desc")
      .limit(limit * 3);

    // Fisher-Yates shuffle for O(n) in-memory randomization
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, limit);
  }

  /**
   * Create a new film entry and handle slug & embedding generation
   * @param {object} data - Film creation data
   * @returns {Promise<Film>} Newly created film object
   */
  async create(data) {
    const createdFilm = await Film.transaction(async (trx) => {
      // Insert film first within transaction
      const film = await Film.query(trx).insert(data);

      // Generate and update slug with ID
      const slug = Film.generateSlug(data.judul, film.film_id);
      await Film.query(trx).findById(film.film_id).patch({ slug });

      // Generate embedding if semantic search is enabled and film is published
      if (
        process.env.USE_SEMANTIC_SEARCH === "true" &&
        data.status === FILM_STATUS.PUBLISHED
      ) {
        try {
          const filmWithCategory = await Film.query(trx)
            .findById(film.film_id)
            .withGraphFetched("category");

          const embedding =
            await embeddingService.generateFilmEmbedding(filmWithCategory);
          await Film.query(trx)
            .findById(film.film_id)
            .patch({
              embedding: JSON.stringify(embedding),
            });
        } catch (error) {
          console.error(
            "Failed to generate embedding for new film:",
            error.message,
          );
          // Don't fail the transaction if embedding generation fails
        }
      }

      return { ...film, slug };
    });

    // POST-COMMIT: Trigger HLS Transcoding enqueue if local video upload is present
    const videoUrl = createdFilm.link_video_utama;
    if (videoUrl && typeof videoUrl === 'string' && (videoUrl.startsWith('/uploads/videos/') || videoUrl.includes('videos/'))) {
      try {
        const enqueued = await enqueueVideoTranscoding({
          filmId: createdFilm.film_id,
          sourcePath: videoUrl,
        });

        if (enqueued) {
          await Film.query()
            .findById(createdFilm.film_id)
            .patch({ transcode_status: 'pending' });
          createdFilm.transcode_status = 'pending';
        } else {
          console.warn(`[FilmService] Transcoding enqueue failed for film ${createdFilm.film_id}. Retaining transcode_status='none' (MP4 fallback).`);
        }
      } catch (err) {
        console.warn(`[FilmService] Post-commit enqueue error for film ${createdFilm.film_id}: ${err.message}`);
      }
    }

    return createdFilm;
  }

  /**
   * Triggers re-transcoding for an existing film if video file is present
   * @param {number} filmId
   * @returns {Promise<Film>}
   */
  async retranscode(filmId) {
    const film = await Film.query().findById(filmId);
    if (!film) {
      throw new NotFoundError('Film tidak ditemukan');
    }

    // Phase 5 Idempotency: Return existing film if already pending or processing
    if (film.transcode_status === 'pending' || film.transcode_status === 'processing') {
      return film;
    }

    const videoUrl = film.link_video_utama;
    if (!videoUrl || typeof videoUrl !== 'string') {
      throw new Error('Film tidak memiliki berkas video utama untuk di-transcode');
    }

    // Phase 7 Path Traversal Protection: Prevent path traversal attacks
    if (videoUrl.includes('..') || videoUrl.includes('\0')) {
      throw new Error('Invalid video file path detected');
    }

    // Reset transcode fields
    await Film.query().findById(filmId).patch({
      transcode_status: 'pending',
      transcode_progress: 0,
      hls_manifest_url: null,
    });

    const enqueued = await enqueueVideoTranscoding({
      filmId: film.film_id,
      sourcePath: videoUrl,
    });

    if (!enqueued) {
      await Film.query().findById(filmId).patch({
        transcode_status: 'none',
      });
      throw new Error('Gagal memasukkan pekerjaan transkoding ke dalam antrean Redis');
    }

    await transcodeAuditService.recordOperation({
      film_id: filmId,
      operation_type: 'retranscode',
      previous_status: film.transcode_status,
      new_status: 'pending',
      reason: 'user_requested_retranscode',
    });

    return await Film.query().findById(filmId);
  }

  /**
   * Cancels an active or pending transcoding job for a film
   * @param {number} filmId
   * @returns {Promise<Film>}
   */
  async cancelTranscode(filmId) {
    const film = await Film.query().findById(filmId);
    if (!film) {
      throw new NotFoundError('Film tidak ditemukan');
    }

    // Phase 5 Idempotency: Return gracefully if already failed, completed, or cancelled
    if (film.transcode_status !== 'processing' && film.transcode_status !== 'pending') {
      return film;
    }

    // Update status to failed
    await Film.query().findById(filmId).patch({
      transcode_status: 'failed',
      transcode_progress: 0,
      hls_manifest_url: null,
    });

    await transcodeAuditService.recordOperation({
      film_id: filmId,
      operation_type: 'cancelled',
      previous_status: film.transcode_status,
      new_status: 'failed',
      reason: 'user_requested_cancellation',
    });

    return await Film.query().findById(filmId);
  }

  /**
   * Retrieves detailed development transcode status for a film
   * @param {number} filmId
   * @returns {Promise<object>}
   */
  async getTranscodeStatus(filmId) {
    const film = await Film.query().findById(filmId);
    if (!film) {
      throw new NotFoundError('Film tidak ditemukan');
    }

    return {
      filmId: film.film_id,
      title: film.judul,
      status: film.transcode_status || 'none',
      progress: film.transcode_progress || 0,
      job: {
        id: `transcode-film-${film.film_id}`,
        attempt: 1,
        maxAttempts: 2,
      },
      output: {
        hls: !!film.hls_manifest_url,
        manifestUrl: film.hls_manifest_url,
        renditions: film.transcode_status === 'completed' ? ['1080p', '720p', '360p'] : [],
      },
    };
  }

  /**
   * Retrieves overall transcoding queue operational metrics
   * @returns {Promise<object>}
   */
  async getTranscodeQueueMetrics() {
    const stats = await Film.query()
      .select('transcode_status')
      .count('film_id as count')
      .groupBy('transcode_status');

    const result = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };

    if (Array.isArray(stats)) {
      stats.forEach((row) => {
        const s = row.transcode_status;
        const count = parseInt(row.count, 10) || 0;
        if (s === 'pending') result.waiting += count;
        else if (s === 'processing') result.active += count;
        else if (s === 'completed') result.completed += count;
        else if (s === 'failed') result.failed += count;
      });
    }

    return result;
  }

  /**
   * Fetches transcode audit history for a film
   * @param {number} filmId
   * @returns {Promise<object>}
   */
  async getTranscodeHistory(filmId) {
    const film = await Film.query().findById(filmId);
    if (!film) throw new NotFoundError('Film tidak ditemukan');

    const history = await transcodeAuditService.getFilmHistory(filmId);
    return {
      filmId: film.film_id,
      currentStatus: film.transcode_status || 'none',
      currentProgress: film.transcode_progress || 0,
      operations: history.map((op) => ({
        id: op.id,
        operationType: op.operation_type,
        previousStatus: op.previous_status,
        newStatus: op.new_status,
        progress: op.progress,
        attempt: op.attempt,
        reason: op.reason,
        createdAt: op.created_at,
      })),
    };
  }

  /**
   * Fetches detailed transcode audit summary for development debugging
   * @param {number} filmId
   * @returns {Promise<object>}
   */
  async getTranscodeAudit(filmId) {
    const film = await Film.query().findById(filmId);
    if (!film) throw new NotFoundError('Film tidak ditemukan');

    const [history, summary] = await Promise.all([
      transcodeAuditService.getFilmHistory(filmId),
      transcodeAuditService.getOperationSummary(filmId),
    ]);

    return {
      filmId: film.film_id,
      title: film.judul,
      currentStatus: film.transcode_status || 'none',
      currentProgress: film.transcode_progress || 0,
      summary,
      operations: history,
    };
  }

  /**
   * Update an existing film and handle file cleanup & embedding updates
   * @param {number} id - Film ID
   * @param {object} data - Film update data
   * @returns {Promise<Film|null>} Updated film object or null if not found
   */
  async update(id, data) {
    const existing = await Film.query().findById(id);
    if (!existing) return null;

    // Handle slug regeneration if title changes
    if (data.judul && data.judul !== existing.judul) {
      data.slug = Film.generateSlug(data.judul, id);
    }

    // Handle file cleanup for fields that are being updated
    const fileFields = [
      "gambar_poster",
      "banner_url",
      "file_naskah",
      "file_storyboard",
      "file_rab",
    ];

    // Delete replaced files in parallel
    await Promise.all(
      fileFields
        .filter(field => data[field] && existing[field] && data[field] !== existing[field])
        .map(field => deleteFile(existing[field]))
    );

    const updated = await Film.query().patchAndFetchById(id, data);

    // Regenerate embedding if semantic search is enabled and content changed
    if (
      process.env.USE_SEMANTIC_SEARCH === "true" &&
      updated.status === FILM_STATUS.PUBLISHED
    ) {
      const contentChanged =
        data.judul ||
        data.sinopsis ||
        data.deskripsi_lengkap ||
        data.category_id;

      if (contentChanged) {
        try {
          await embeddingService.updateFilmEmbedding(id);
        } catch (error) {
          console.error("Failed to update embedding:", error.message);
          // Don't fail the update if embedding generation fails
        }
      }
    }

    return updated;
  }

  /**
   * Delete a film and its associated files
   * @param {number} id - Film ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const film = await Film.query().findById(id);
    if (!film) return false;

    // Delete all associated files
    const fileFields = [
      "gambar_poster",
      "banner_url",
      "file_naskah",
      "file_storyboard",
      "file_rab",
    ];

    // Delete all associated files in parallel
    await Promise.all(
      fileFields
        .filter(field => film[field])
        .map(field => deleteFile(film[field]))
    );

    return Film.query().deleteById(id);
  }

  /**
   * Update the status of a film and handle embedding generation on publish
   * @param {number} id - Film ID
   * @param {string} status - New status (e.g., 'published', 'rejected')
   * @param {object} [extra={}] - Additional fields to update (e.g., rejection reason)
   * @returns {Promise<Film>} Updated film object
   */
  async updateStatus(id, status, extra = {}) {
    const updated = await Film.query().patchAndFetchById(id, {
      status,
      ...extra,
    });

    // Generate embedding when film is published
    if (
      process.env.USE_SEMANTIC_SEARCH === "true" &&
      status === FILM_STATUS.PUBLISHED
    ) {
      try {
        await embeddingService.updateFilmEmbedding(id);
      } catch (error) {
        console.error(
          "Failed to generate embedding on publish:",
          error.message,
        );
      }
    }

    return updated;
  }

  /**
   * Shortcut to get all films by a specific creator
   * @param {string} userId - Creator user ID
   * @param {object} [options={}] - Pagination and filtering options
   * @returns {Promise<object>} Paginated result object
   */
  async getByCreator(userId, options = {}) {
    return this.getAll({ ...options, user_id: userId, status: null });
  }

  /**
   * Get a list of the most lately published films
   * @param {number} [limit=10] - Number of films to fetch
   * @returns {Promise<Film[]>} Array of film objects
   */
  async getLatest(limit = 10) {
    return Film.query()
      .where("status", FILM_STATUS.PUBLISHED)
      .withGraphFetched("[creator(selectBasic), category]")
      .modifiers(BaseModel.defaultModifiers)
      .orderBy("created_at", "desc")
      .limit(limit);
  }

  /**
   * Get all films with 'pending' status for admin approval
   * @returns {Promise<Film[]>} Array of pending film objects
   */
  async getPending() {
    return Film.query()
      .where("status", FILM_STATUS.PENDING)
      .withGraphFetched("[creator(selectBasic), category]")
      .modifiers(BaseModel.defaultModifiers)
      .orderBy("created_at", "asc");
  }

  /**
   * Get aggregated stats for a specific creator (N+1 optimization)
   * @param {string} userId - User ID of the creator
   * @returns {Promise<object>} Stats object
   */
  async getUserStats(userId) {
    const [filmStats, voteCount, commentCount] = await Promise.all([
      Film.query()
        .where('user_id', userId)
        .select(
          Film.raw('COUNT(film_id) as totalFilms'),
          Film.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending', [FILM_STATUS.PENDING]),
          Film.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as published', [FILM_STATUS.PUBLISHED]),
          Film.raw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as rejected', [FILM_STATUS.REJECTED])
        )
        .first(),
      
      Vote.query()
        .join('films', 'votes.film_id', 'films.film_id')
        .where('films.user_id', userId)
        .count('votes.vote_id as total')
        .first(),

      Discussion.query()
        .join('films', 'discussions.film_id', 'films.film_id')
        .where('films.user_id', userId)
        .count('discussions.diskusi_id as total')
        .first()
    ]);

    return {
      totalFilms: parseInt(filmStats?.totalFilms || 0),
      pending: parseInt(filmStats?.pending || 0),
      published: parseInt(filmStats?.published || 0),
      rejected: parseInt(filmStats?.rejected || 0),
      totalVotes: parseInt(voteCount?.total || 0),
      totalComments: parseInt(commentCount?.total || 0)
    };
  }
}

export const filmService = new FilmService();
