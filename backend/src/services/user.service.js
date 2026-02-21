/**
 * src/services/user.service.js
 * 
 * Service for retrieving public-facing user profile information.
 */

import { User } from '../models/index.js';
import { FILM_STATUS } from '../config/constants.js';

export class UserService {
  /**
   * Get a public user profile by ID, including their published films
   * @param {string} userId - User ID to fetch
   * @returns {Promise<object|null>} Profile object with films attached
   */
  async getProfileById(userId) {
    const user = await User.query()
      .findById(userId)
      .select('id', 'name', 'image', 'role_id', 'createdAt');

    if (!user) return null;

    // Fetch published films by this user
    const films = await user.$relatedQuery('films')
      .where('status', FILM_STATUS.PUBLISHED)
      .withGraphFetched('[category]')
      .orderBy('created_at', 'desc');

    return {
      id: user.id,
      name: user.name,
      image: user.image,
      role_id: user.role_id,
      created_at: user.createdAt,
      films
    };
  }
}

export const userService = new UserService();
