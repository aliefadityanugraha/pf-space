/**
 * src/services/collection.service.js
 * 
 * Service for managing user film collections (bookmarks/watchlist).
 */

import { Collection, Film, BaseModel } from '../models/index.js';

export class CollectionService {
  /**
   * Add a film to user's collection
   * @param {number} filmId - Film ID
   * @param {string} userId - User ID
   * @returns {Promise<{alreadyInCollection: boolean}>}
   */
  async add(filmId, userId) {
    const filmIdInt = parseInt(filmId);
    
    // Check if already in collection
    const existing = await Collection.query()
      .findOne({ film_id: filmIdInt, user_id: userId });

    if (existing) {
      return { alreadyInCollection: true };
    }

    await Collection.query().insert({
      film_id: filmIdInt,
      user_id: userId
    });

    return { alreadyInCollection: false };
  }

  /**
   * Remove a film from user's collection
   * @param {number} filmId - Film ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if removed
   */
  async remove(filmId, userId) {
    const filmIdInt = parseInt(filmId);
    const deleted = await Collection.query()
      .delete()
      .where({ film_id: filmIdInt, user_id: userId });

    return deleted > 0;
  }

  /**
   * Check if a film exists in a user's collection
   * @param {number} filmId - Film ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>}
   */
  async isInCollection(filmId, userId) {
    if (!userId) return false;
    const filmIdInt = parseInt(filmId);
    const item = await Collection.query()
      .findOne({ film_id: filmIdInt, user_id: userId });
    return !!item;
  }

  /**
   * Get a paginated list of all films in a user's collection
   * @param {string} userId - User ID
   * @param {object} options - Pagination options
   * @returns {Promise<{collections: Collection[], pagination: object}>}
   */
  async getUserCollections(userId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const query = Collection.query()
      .where('user_id', userId)
      .withGraphFetched('film.[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers)
      .orderBy('created_at', 'desc');

    const [collections, countResult] = await Promise.all([
      query.limit(limit).offset(offset),
      Collection.query().where('user_id', userId).count('film_id as total').first()
    ]);

    const total = parseInt(countResult?.total || 0);

    return {
      collections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const collectionService = new CollectionService();
