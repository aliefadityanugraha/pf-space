/**
 * src/services/film.service.js
 * 
 * Service for film-related business logic, handling database 
 * operations for creating, reading, updating, and deleting films.
 */

import { Film, BaseModel } from '../models/index.js';
import { deleteFile } from '../lib/upload.js';
import { FILM_STATUS, PAGINATION } from '../config/constants.js';
import { embeddingService } from './embedding.service.js';
import { sanitizeRichText, sanitizePlainText } from '../lib/sanitize.js';

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
        .filter(c => c && typeof c === 'object')
        .map(c => ({
          jabatan: typeof c.jabatan === 'string' ? c.jabatan.trim() : '',
          anggota: Array.isArray(c.anggota)
            ? c.anggota.filter(a => typeof a === 'string' && a.trim()).map(a => a.trim())
            : []
        }))
        .filter(c => c.jabatan);
      if (clean.crew.length === 0) clean.crew = null;
    } else if (clean.crew !== undefined) {
      clean.crew = null;
    }

    // 2. Sanitize HTML Content
    if (clean.deskripsi_lengkap) clean.deskripsi_lengkap = sanitizeRichText(clean.deskripsi_lengkap);
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
      sortBy = 'created_at',
      sortOrder = 'desc',
      requesting_user_id,
      is_banner_active
    } = options;

    const query = Film.query()
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers);

    // Helper to apply filters to both main and count queries
    const applyFilters = (q) => {
      // 1. Handle Status & Access Control
      if (status) {
        if (status === FILM_STATUS.PUBLISHED && requesting_user_id) {
          // Public shows published, but owner sees their own too
          q.where(builder => {
            builder.where('status', FILM_STATUS.PUBLISHED)
                   .orWhere('user_id', requesting_user_id);
          });
        } else {
          q.where('status', status);
        }
      }

      // 2. Explicit User Filter
      if (user_id) {
        q.where('user_id', user_id);
      }

      // 3. Category Filter
      if (category_id) {
        q.where('category_id', category_id);
      }

      // 4. Search by title or synopsis (Case-Insensitive)
      if (search && String(search).trim()) {
        const term = `%${String(search).trim()}%`;
        q.where(builder => {
          builder.where('judul', 'like', term)
                 .orWhere('sinopsis', 'like', term);
        });
      }

      // 5. Banner Filter
      if (is_banner_active !== undefined) {
        q.where('is_banner_active', is_banner_active);
      }
    };

    applyFilters(query);

    // Sorting
    query.orderBy(sortBy || 'created_at', sortOrder || 'desc');

    // Pagination
    const offset = (page - 1) * limit;
    
    // Count query
    const countQuery = Film.query();
    applyFilters(countQuery);

    const [films, totalResult] = await Promise.all([
      query.limit(limit).offset(offset),
      countQuery.count('film_id as total').first()
    ]);

    const total = parseInt(totalResult?.total || 0);

    return {
      films,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
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
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers);
  }

  /**
   * Increment the view count for a specific film
   * @param {number} id - Film ID
   * @returns {Promise<number>} Number of rows updated
   */
  async incrementViews(id) {
    return Film.query()
      .findById(id)
      .increment('views', 1);
  }

  /**
   * Get a single film by its URL slug
   * @param {string} slug - Film slug
   * @returns {Promise<Film|null>} Film object or null
   */
  async getBySlug(slug) {
    return Film.query()
      .where('slug', slug)
      .withGraphFetched('[creator(selectBasic), category, evaluation]')
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

    return Film.query()
      .where('category_id', film.category_id)
      .where('status', FILM_STATUS.PUBLISHED)
      .whereNot('film_id', filmId)
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers)
      .orderByRaw('RAND()') // Randomize related films
      .limit(limit);
  }

  /**
   * Create a new film entry and handle slug & embedding generation
   * @param {object} data - Film creation data
   * @returns {Promise<Film>} Newly created film object
   */
  async create(data) {
    return Film.transaction(async (trx) => {
      // Insert film first within transaction
      const film = await Film.query(trx).insert(data);
      
      // Generate and update slug with ID
      const slug = Film.generateSlug(data.judul, film.film_id);
      await Film.query(trx).findById(film.film_id).patch({ slug });
      
      // Generate embedding if semantic search is enabled and film is published
      if (process.env.USE_SEMANTIC_SEARCH === 'true' && data.status === FILM_STATUS.PUBLISHED) {
        try {
          const filmWithCategory = await Film.query(trx)
            .findById(film.film_id)
            .withGraphFetched('category');
          
          const embedding = await embeddingService.generateFilmEmbedding(filmWithCategory);
          await Film.query(trx).findById(film.film_id).patch({ 
            embedding: JSON.stringify(embedding) 
          });
        } catch (error) {
          console.error('Failed to generate embedding for new film:', error.message);
          // Don't fail the transaction if embedding generation fails
        }
      }
      
      return { ...film, slug };
    });
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
      'gambar_poster',
      'banner_url',
      'file_naskah',
      'file_storyboard',
      'file_rab'
    ];

    for (const field of fileFields) {
      if (data[field] && existing[field] && data[field] !== existing[field]) {
        await deleteFile(existing[field]);
      }
    }

    const updated = await Film.query().patchAndFetchById(id, data);

    // Regenerate embedding if semantic search is enabled and content changed
    if (process.env.USE_SEMANTIC_SEARCH === 'true' && updated.status === FILM_STATUS.PUBLISHED) {
      const contentChanged = data.judul || data.sinopsis || data.deskripsi_lengkap || data.category_id;
      
      if (contentChanged) {
        try {
          await embeddingService.updateFilmEmbedding(id);
        } catch (error) {
          console.error('Failed to update embedding:', error.message);
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
      'gambar_poster',
      'banner_url',
      'file_naskah',
      'file_storyboard',
      'file_rab'
    ];

    for (const field of fileFields) {
      if (film[field]) {
        await deleteFile(film[field]);
      }
    }

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
    const updated = await Film.query().patchAndFetchById(id, { status, ...extra });

    // Generate embedding when film is published
    if (process.env.USE_SEMANTIC_SEARCH === 'true' && status === FILM_STATUS.PUBLISHED) {
      try {
        await embeddingService.updateFilmEmbedding(id);
      } catch (error) {
        console.error('Failed to generate embedding on publish:', error.message);
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
      .where('status', FILM_STATUS.PUBLISHED)
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  /**
   * Get all films with 'pending' status for admin approval
   * @returns {Promise<Film[]>} Array of pending film objects
   */
  async getPending() {
    return Film.query()
      .where('status', FILM_STATUS.PENDING)
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'asc');
  }
}

export const filmService = new FilmService();
