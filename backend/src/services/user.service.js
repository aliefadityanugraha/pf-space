/**
 * src/services/user.service.js
 * 
 * Service for retrieving public-facing user profile information.
 */

import { User, Film } from '../models/index.js';
import { FILM_STATUS } from '../config/constants.js';
import { gamificationService } from './gamification.service.js';

export class UserService {
  /**
   * Get a public user profile by ID, including their published films
   * @param {string} userId - User ID to fetch
   * @returns {Promise<object|null>} Profile object with films attached
   */
  async getProfileById(userId) {
    const user = await User.query()
      .findById(userId)
      .select('id', 'name', 'email', 'image', 'role_id', 'createdAt', 'bio', 'website', 'location', 'instagram', 'linkedin')
      .withGraphFetched('role');

    if (!user) return null;

    // Fetch published films by this user
    const films = await user.$relatedQuery('films')
      .select([
        'films.*',
        Film.relatedQuery('votes').count().as('vote_count'),
        Film.relatedQuery('discussions').count().as('comment_count')
      ])
      .where('status', FILM_STATUS.PUBLISHED)
      .withGraphFetched('[category, creator]')
      .orderBy('created_at', 'desc');

    // Fetch contributions (where tagged as crew)
    const contributions = await this.getContributionsByUserId(userId);

    // Aggregate Stats and Skills
    const totalViews = films.reduce((acc, f) => acc + (f.views || 0), 0);
    const totalVotes = films.reduce((acc, f) => acc + parseInt(f.vote_count || 0, 10), 0);
    const totalComments = films.reduce((acc, f) => acc + parseInt(f.comment_count || 0, 10), 0);
    const skillsMap = {};
    
    films.forEach(f => {
      // Check if crew info exists
      if (f.crew) {
        // Handle both old array format and new object format { crew: [...] }
        const groups = Array.isArray(f.crew) ? f.crew : (f.crew.crew || []);
        groups.forEach(g => {
          const isMember = g.anggota?.some(m => m.user_id === user.id || m.name === user.name);
          if (isMember && g.jabatan) {
            skillsMap[g.jabatan] = (skillsMap[g.jabatan] || 0) + 1;
          }
        });
      }
    });

    const topSkills = Object.entries(skillsMap)
      .sort((a, b) => b[1] - a[1])
      .map(e => e[0]);

    const stats = {
      totalFilms: films.length,
      totalViews,
      totalVotes,
      totalComments,
      published: films.length
    };

    const badges = await gamificationService.getUserBadges(userId, stats);

    return {
      ...user,
      created_at: user.createdAt,
      films,
      contributions,
      badges,
      stats,
      topSkills
    };
  }

  /**
   * Search users by name for autocomplete tagging
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matched users
   */
  async searchUsers(query) {
    if (!query || query.trim() === '') return [];
    return await User.query()
      .select('id', 'name', 'image')
      .where('name', 'like', `%${query}%`)
      .limit(10);
  }

  /**
   * Fetch contributions for a specific user ID, with their specific roles attached
   * @param {string} userId - User ID to query contributions for
   * @returns {Promise<Array>} List of films
   */
  async getContributionsByUserId(userId) {
    const contributions = await Film.query()
      .select([
        'films.*',
        Film.relatedQuery('votes').count().as('vote_count'),
        Film.relatedQuery('discussions').count().as('comment_count')
      ])
      .where('status', FILM_STATUS.PUBLISHED)
      .where('crew', 'like', `%${userId}%`)
      .withGraphFetched('[category, creator]')
      .orderBy('created_at', 'desc');

    return contributions.map(f => {
      const roles = [];
      if (f.crew) {
        const groups = Array.isArray(f.crew) ? f.crew : (f.crew.crew || []);
        groups.forEach(g => {
          const isMember = g.anggota?.some(m => m.user_id === userId);
          if (isMember && g.jabatan) {
            roles.push(g.jabatan);
          }
        });
      }
      const json = f.toJSON ? f.toJSON() : f;
      json.contribution_roles = roles;
      return json;
    });
  }
}

export const userService = new UserService();
