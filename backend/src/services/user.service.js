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

  /**
   * Get top active curators/creators/admins and total registered user count
   * @returns {Promise<{ curators: Array, totalCurators: number }>}
   */
  async getTopCurators() {
    try {
      const totalCuratorsResult = await User.query().count('id as count').first();
      const totalCurators = parseInt(totalCuratorsResult?.count || 0, 10);

      const curators = await User.query()
        .select([
          'users.id',
          'users.name',
          'users.image',
          'users.role_id',
          'users.createdAt',
          User.relatedQuery('films')
            .count()
            .where('status', FILM_STATUS.PUBLISHED)
            .as('film_count'),
          User.relatedQuery('discussions')
            .count()
            .as('discussion_count'),
          User.relatedQuery('votes')
            .count()
            .as('vote_count')
        ])
        .withGraphFetched('role')
        .orderBy('film_count', 'desc')
        .orderBy('discussion_count', 'desc')
        .orderBy('vote_count', 'desc')
        .orderBy('users.createdAt', 'desc')
        .limit(10);

      return {
        totalCurators,
        curators: curators.map(c => {
          const filmCount = parseInt(c.film_count || 0, 10);
          const discussionCount = parseInt(c.discussion_count || 0, 10);
          const voteCount = parseInt(c.vote_count || 0, 10);
          const roleName = c.role?.role_name || (c.role_id === 4 ? 'Admin' : c.role_id === 2 ? 'Kreator' : 'Member');

          return {
            id: c.id,
            name: c.name,
            image: c.image,
            role_name: roleName,
            film_count: filmCount,
            discussion_count: discussionCount,
            vote_count: voteCount,
            activity_label: filmCount > 0 
              ? `${filmCount} Film` 
              : discussionCount > 0 
                ? `${discussionCount} Diskusi` 
                : `${roleName}`
          };
        })
      };
    } catch (err) {
      console.error('[getTopCurators error]', err);
      return { totalCurators: 0, curators: [] };
    }
  }
}

export const userService = new UserService();

