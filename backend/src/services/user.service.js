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
      .select('id', 'name', 'image', 'role_id', 'createdAt', 'bio', 'website', 'location', 'instagram', 'linkedin');

    if (!user) return null;

    // Fetch published films by this user
    const films = await user.$relatedQuery('films')
      .where('status', FILM_STATUS.PUBLISHED)
      .withGraphFetched('[category]')
      .orderBy('created_at', 'desc');

    // Aggregate Stats and Skills
    const totalViews = films.reduce((acc, f) => acc + (f.views || 0), 0);
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

    return {
      ...user,
      created_at: user.createdAt,
      films,
      stats: {
        totalFilms: films.length,
        totalViews
      },
      topSkills
    };
  }
}

export const userService = new UserService();
