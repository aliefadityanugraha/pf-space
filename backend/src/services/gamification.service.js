/**
 * src/services/gamification.service.js
 * 
 * Service for handling creator badges and gamification logic.
 */

import { Film, Vote, Discussion } from '../models/index.js';
import { FILM_STATUS } from '../config/constants.js';

export class GamificationService {
  /**
   * Defined badges and their requirements
   */
  get BADGE_DEFINITIONS() {
    return [
      {
        id: 'pioneer',
        name: 'Pioneer',
        description: 'Telah mengunggah karya pertama.',
        icon: 'Award',
        color: 'bg-blue-100 text-blue-600',
        check: async (stats) => stats.totalFilms >= 1
      },
      {
        id: 'script-master',
        name: 'Script Master',
        description: 'Memiliki minimal 3 karya dengan naskah lengkap.',
        icon: 'FileText',
        color: 'bg-orange-100 text-orange-600',
        check: async (stats, userId) => {
          const count = await Film.query()
            .where('user_id', userId)
            .where('status', FILM_STATUS.PUBLISHED)
            .whereNotNull('file_naskah')
            .count('film_id as total')
            .first();
          return parseInt(count?.total || 0) >= 3;
        }
      },
      {
        id: 'trending-creator',
        name: 'Community Star',
        description: 'Mendapatkan lebih dari 50 apresiasi (votes) total.',
        icon: 'Star',
        color: 'bg-yellow-100 text-yellow-600',
        check: async (stats) => stats.totalVotes >= 50
      },
      {
        id: 'active-debater',
        name: 'Active Debater',
        description: 'Berpartisipasi aktif dalam diskusi (10+ komentar/balasan).',
        icon: 'MessageSquare',
        color: 'bg-green-100 text-green-600',
        check: async (stats, userId) => {
          // stats.totalComments from getUserStats is count of comments *on his films*
          // For active debater, we want comments *made by him*
          const count = await Discussion.query()
            .where('user_id', userId)
            .count('diskusi_id as total')
            .first();
          return parseInt(count?.total || 0) >= 10;
        }
      },
      {
        id: 'cinematographer',
        name: 'Visionary',
        description: 'Telah mengunggah lebih dari 5 karya yang dipublikasi.',
        icon: 'Camera',
        color: 'bg-purple-100 text-purple-600',
        check: async (stats) => stats.published >= 5
      }
    ];
  }

  /**
   * Calculate badges for a specific user
   * @param {string} userId - User ID
   * @param {object} stats - Pre-calculated user stats
   * @returns {Promise<Array>} Array of earned badges
   */
  async getUserBadges(userId, stats) {
    const earnedBadges = [];
    
    for (const badge of this.BADGE_DEFINITIONS) {
      if (await badge.check(stats, userId)) {
        earnedBadges.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color
        });
      }
    }
    
    return earnedBadges;
  }
}

export const gamificationService = new GamificationService();
