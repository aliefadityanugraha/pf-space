/**
 * src/controllers/vote.controller.js
 * 
 * Controller for managing film votes (likes) and community engagement metrics.
 */

import { voteService } from '../services/index.js';
import { filmService } from '../services/index.js';
import { ApiResponse } from '../lib/response.js';

export class VoteController {
  /**
   * User: Record a 'like' for a specific film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async vote(request, reply) {
    const { filmId } = request.params;

    // Check film exists and is published
    const film = await filmService.getById(filmId);
    if (!film || film.status !== 'published') {
      return ApiResponse.notFound(reply, 'Film not found');
    }

    const result = await voteService.vote(filmId, request.user.id);

    if (result.alreadyVoted) {
      return ApiResponse.badRequest(reply, 'You have already voted for this film');
    }

    const voteCount = await voteService.getVoteCount(filmId);
    return ApiResponse.success(reply, { vote_count: voteCount }, 'Vote recorded successfully');
  }

  /**
   * User: Remove a previous 'like' from a film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async unvote(request, reply) {
    const { filmId } = request.params;

    const deleted = await voteService.unvote(filmId, request.user.id);

    if (!deleted) {
      return ApiResponse.badRequest(reply, 'You have not voted for this film');
    }

    const voteCount = await voteService.getVoteCount(filmId);
    return ApiResponse.success(reply, { vote_count: voteCount }, 'Vote removed successfully');
  }

  /**
   * User: Toggle the 'like' status for a film (Add if not liked, remove if liked)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async toggleVote(request, reply) {
    const { filmId } = request.params;

    // Check film exists and is published
    const film = await filmService.getById(filmId);
    if (!film || film.status !== 'published') {
      return ApiResponse.notFound(reply, 'Film not found');
    }

    const hasVoted = await voteService.hasVoted(filmId, request.user.id);

    if (hasVoted) {
      await voteService.unvote(filmId, request.user.id);
    } else {
      await voteService.vote(filmId, request.user.id);
    }

    const voteCount = await voteService.getVoteCount(filmId);

    return ApiResponse.success(reply, { 
      voted: !hasVoted,
      vote_count: voteCount 
    }, hasVoted ? 'Vote removed' : 'Vote recorded');
  }

  /**
   * Public: Retrieve the total vote count and current user's vote status for a film
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getVoteCount(request, reply) {
    const { filmId } = request.params;

    const voteCount = await voteService.getVoteCount(filmId);
    
    let hasVoted = false;
    if (request.user) {
      hasVoted = await voteService.hasVoted(filmId, request.user.id);
    }

    return ApiResponse.success(reply, {
      vote_count: voteCount,
      has_voted: hasVoted
    });
  }

  /**
   * Administrative: Remove all recorded votes from the database
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async resetVotes(request, reply) {
    try {
      await voteService.resetAllVotes();
      return ApiResponse.success(reply, null, 'All votes have been reset successfully');
    } catch (error) {
      request.log.error(error);
      return ApiResponse.error(reply, 'Failed to reset votes');
    }
  }

  /**
   * Public: Fetch films sorted by popularity within a given timeframe (week/month/all)
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getTrending(request, reply) {
    const { period = 'week', limit = 10 } = request.query;

    if (!['week', 'month', 'all'].includes(period)) {
      return ApiResponse.badRequest(reply, 'Invalid period. Use: week, month, or all');
    }

    const films = await voteService.getTrending(period, parseInt(limit));
    return ApiResponse.success(reply, films);
  }

  /**
   * User: Fetch a list of all films liked by the current user
   * @param {import('fastify').FastifyRequest} request
   * @param {import('fastify').FastifyReply} reply
   */
  async getMyVotes(request, reply) {
    const votes = await voteService.getUserVotes(request.user.id);
    return ApiResponse.success(reply, votes);
  }
}

export const voteController = new VoteController();
