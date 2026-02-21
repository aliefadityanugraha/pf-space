/**
 * src/routes/vote.routes.js
 * 
 * Routes for film likes and trending leaderboard.
 */

import { voteController } from '../controllers/index.js';
import { authenticate, requireAdmin } from '../middlewares/index.js';

/**
 * Register vote and engagement routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function voteRoutes(fastify) {
  // Public: Get leaderboard of most liked films
  fastify.get('/trending', voteController.getTrending.bind(voteController));

  // User: Get personal list of films they have liked
  fastify.get('/my-votes', {
    preHandler: authenticate
  }, voteController.getMyVotes.bind(voteController));

  // Public: Get current like status and count for a specific film
  fastify.get('/:filmId', voteController.getVoteCount.bind(voteController));

  // User: Add a like to a film
  fastify.post('/:filmId', {
    preHandler: authenticate
  }, voteController.vote.bind(voteController));

  // User: Remove a like from a film
  fastify.delete('/:filmId', {
    preHandler: authenticate
  }, voteController.unvote.bind(voteController));

  // User: Toggle like status for a film
  fastify.post('/:filmId/toggle', {
    preHandler: authenticate
  }, voteController.toggleVote.bind(voteController));

  // Administrative: Clear all vote records from system (both DELETE and POST supported)
  fastify.delete('/reset', {
    preHandler: requireAdmin
  }, voteController.resetVotes.bind(voteController));

  fastify.post('/reset', {
    preHandler: requireAdmin
  }, voteController.resetVotes.bind(voteController));
}
