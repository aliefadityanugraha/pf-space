/**
 * src/routes/community.routes.js
 * 
 * Routes for community discussions and topics.
 */

import { communityController } from '../controllers/index.js';
import { authenticate, requireModerator, validateRequest } from '../middlewares/index.js';
import { communityReplySchema } from '../lib/validation.js';

/**
 * Register community discussion routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export async function communityRoutes(fastify) {
  // Public: Get currently active topic
  fastify.get('/active', communityController.getActiveDiscussion.bind(communityController));

  // Public: Get single discussion
  fastify.get('/:id', communityController.getById.bind(communityController));

  // Admin/Moderator: List all historical topics
  fastify.get('/', {
    preHandler: requireModerator
  }, communityController.getAll.bind(communityController));

  // Admin/Moderator: Get replies for a specific topic
  fastify.get('/:id/replies', {
    preHandler: requireModerator
  }, communityController.getReplies.bind(communityController));

  // Administrative: Create new topic
  fastify.post('/', {
    preHandler: requireModerator
  }, communityController.create.bind(communityController));

  // Administrative: Update topic details
  fastify.put('/:id', {
    preHandler: requireModerator
  }, communityController.update.bind(communityController));

  // Administrative: Toggle topic active status
  fastify.patch('/:id/toggle', {
    preHandler: requireModerator
  }, communityController.toggleDiscussion.bind(communityController));

  // Administrative: Delete a topic
  fastify.delete('/:id', {
    preHandler: requireModerator
  }, communityController.delete.bind(communityController));

  // User: Post a reply to a discussion
  fastify.post('/:id/replies', {
    preHandler: [authenticate, validateRequest(communityReplySchema, 'body')]
  }, communityController.addReply.bind(communityController));

  // User: Delete their own reply
  fastify.delete('/replies/:replyId', {
    preHandler: authenticate
  }, communityController.deleteReply.bind(communityController));

  // Public: Get a single reply
  fastify.get('/replies/:replyId', communityController.getReplyById.bind(communityController));

  // Administrative: Moderation delete of a reply
  fastify.delete('/moderator/replies/:replyId', {
    preHandler: requireModerator
  }, communityController.deleteReplyByModerator.bind(communityController));
}
