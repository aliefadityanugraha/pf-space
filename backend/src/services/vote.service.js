/**
 * src/services/vote.service.js
 * 
 * Service for managing film votes (likes) and calculating trending content
 * based on popularity during specific time periods.
 */

import { Vote, Film, BaseModel } from '../models/index.js';
import { knex } from '../database/index.js';
import { FILM_STATUS } from '../config/constants.js';
import { notificationService } from './notification.service.js';

export class VoteService {
  /**
   * Record a vote for a film if the user hasn't voted already
   * @param {number} filmId - Film ID
   * @param {string} userId - Voter user ID
   * @returns {Promise<{alreadyVoted: boolean}>} Object indicating if vote was duplicate
   */
  async vote(filmId, userId) {
    const filmIdInt = parseInt(filmId);
    // Check if already voted
    const existing = await Vote.query()
      .findOne({ film_id: filmIdInt, user_id: userId });

    if (existing) {
      return { alreadyVoted: true };
    }

    await Vote.query().insert({
      film_id: filmIdInt,
      user_id: userId
    });

    // Send notification to film creator
    try {
      const film = await Film.query().findById(filmIdInt).select('user_id', 'judul');
      if (film && film.user_id !== userId) {
        await notificationService.create({
          user_id: film.user_id,
          type: 'vote',
          title: 'Film Anda Mendapat Like Baru!',
          message: `Seseorang menyukai film karya Anda: "${film.judul}"`,
          data: { film_id: filmIdInt }
        });
      }
    } catch (error) {
      console.error('Failed to send vote notification:', error);
      // Continue execution, don't fail the vote action
    }

    return { alreadyVoted: false };
  }

  /**
   * Remove a vote from a film
   * @param {number} filmId - Film ID
   * @param {string} userId - User ID who's unvoting
   * @returns {Promise<boolean>} True if a vote was removed
   */
  async unvote(filmId, userId) {
    const filmIdInt = parseInt(filmId);
    const deleted = await Vote.query()
      .delete()
      .where({ film_id: filmIdInt, user_id: userId });

    return deleted > 0;
  }

  /**
   * Check if a user has already voted for a specific film
   * @param {number} filmId - Film ID
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if user has voted
   */
  async hasVoted(filmId, userId) {
    const filmIdInt = parseInt(filmId);
    if (!userId) return false;
    const vote = await Vote.query()
      .findOne({ film_id: filmIdInt, user_id: userId });
    return !!vote;
  }

  /**
   * Get the total number of votes for a specific film
   * @param {number} filmId - Film ID
   * @returns {Promise<number>} Vote count
   */
  async getVoteCount(filmId) {
    const filmIdInt = parseInt(filmId);
    const result = await Vote.query()
      .where('film_id', filmIdInt)
      .count('vote_id as count')
      .first();
    return parseInt(result.count);
  }

  /**
   * Admin only: Reset all recorded votes to zero (deletes all vote records)
   * @returns {Promise<number>} Number of deleted rows
   */
  async resetAllVotes() {
    return await Vote.query().delete().whereRaw('1 = 1');
  }

  /**
   * Get films sorted by vote count within a specific time period
   * @param {string} [period='week'] - Period ('week', 'month', 'all')
   * @param {number} [limit=10] - Number of trending films to fetch
   * @returns {Promise<Film[]>} Array of film objects with vote_count attached
   */
  async getTrending(period = 'week', limit = 10) {
    let dateFilter;
    const now = new Date();

    if (period === 'week') {
      dateFilter = new Date(now.setDate(now.getDate() - 7));
    } else if (period === 'month') {
      dateFilter = new Date(now.setMonth(now.getMonth() - 1));
    } else {
      // all time
      dateFilter = null;
    }

    const query = knex('films')
      .select(
        'films.film_id',
        knex.raw('COUNT(votes.vote_id) as vote_count')
      )
      .leftJoin('votes', function() {
        this.on('films.film_id', '=', 'votes.film_id');
        if (dateFilter) {
          this.andOn('votes.created_at', '>=', knex.raw('?', [dateFilter]));
        }
      })
      .where('films.status', FILM_STATUS.PUBLISHED)
      .groupBy('films.film_id')
      .orderBy('vote_count', 'desc')
      .limit(limit);

    const films = await query;

    // Fetch relations manually
    const filmIds = films.map(f => f.film_id);
    if (filmIds.length === 0) return [];

    const filmsWithRelations = await Film.query()
      .whereIn('film_id', filmIds)
      .withGraphFetched('[creator(selectBasic), category]')
      .modifiers(BaseModel.defaultModifiers);

    // Merge vote_count
    return filmsWithRelations.map(film => {
      const voteData = films.find(f => String(f.film_id) === String(film.film_id));
      return {
        ...film,
        vote_count: parseInt(voteData?.vote_count || 0)
      };
    }).sort((a, b) => b.vote_count - a.vote_count);
  }

  /**
   * Get all votes specifically made by a user
   * @param {string} userId - Voter user ID
   * @returns {Promise<Vote[]>} Array of vote records with film details
   */
  async getUserVotes(userId) {
    return Vote.query()
      .where('user_id', userId)
      .withGraphFetched('film')
      .orderBy('created_at', 'desc');
  }
}

export const voteService = new VoteService();
