/**
 * src/routes/community.routes.js
 * 
 * Routes for community discussions and topics.
 */

import { communityController } from '../controllers/index.js';
import { authenticate, requireModerator } from '../middlewares/index.js';

/**
 * Register community discussion routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export async function communityRoutes(fastify) {
  // Public: Get currently active topic
  fastify.get('/active', communityController.getActiveDiscussion.bind(communityController));

  // Admin/Moderator: List all historical topics
  fastify.get('/discussions', {
    preHandler: requireModerator
  }, communityController.getAllDiscussions.bind(communityController));
  
  // Alias for list (used by admin frontend)
  fastify.get('/', {
    preHandler: requireModerator
  }, communityController.getAllDiscussions.bind(communityController));

  // Admin/Moderator: Get replies for a specific topic
  fastify.get('/discussions/:id/replies', {
    preHandler: requireModerator
  }, communityController.getDiscussionReplies.bind(communityController));
  
  fastify.get('/:id/replies', {
    preHandler: requireModerator
  }, communityController.getDiscussionReplies.bind(communityController));

  // Administrative: Create new topic
  fastify.post('/discussions', {
    preHandler: requireModerator
  }, communityController.createDiscussion.bind(communityController));
  
  fastify.post('/', {
    preHandler: requireModerator
  }, communityController.createDiscussion.bind(communityController));

  // Administrative: Update topic details
  fastify.put('/discussions/:id', {
    preHandler: requireModerator
  }, communityController.updateDiscussion.bind(communityController));
  
  fastify.put('/:id', {
    preHandler: requireModerator
  }, communityController.updateDiscussion.bind(communityController));

  // Administrative: Toggle topic active status
  fastify.patch('/discussions/:id/toggle', {
    preHandler: requireModerator
  }, communityController.toggleDiscussion.bind(communityController));
  
  fastify.patch('/:id/toggle', {
    preHandler: requireModerator
  }, communityController.toggleDiscussion.bind(communityController));

  // Administrative: Delete a topic
  fastify.delete('/discussions/:id', {
    preHandler: requireModerator
  }, communityController.deleteDiscussion.bind(communityController));
  
  fastify.delete('/:id', {
    preHandler: requireModerator
  }, communityController.deleteDiscussion.bind(communityController));

  // User: Post a reply to the active topic
  fastify.post('/discussions/:id/replies', {
    preHandler: authenticate
  }, communityController.addReply.bind(communityController));
  
  fastify.post('/:id/replies', {
    preHandler: authenticate
  }, communityController.addReply.bind(communityController));

  // User: Delete their own reply
  fastify.delete('/replies/:replyId', {
    preHandler: authenticate
  }, communityController.deleteReply.bind(communityController));

  // Administrative: Moderation delete of a reply
  fastify.delete('/moderator/replies/:replyId', {
    preHandler: requireModerator
  }, communityController.deleteReplyByModerator.bind(communityController));
  
  fastify.delete('/replies/:replyId/moderate', {
    preHandler: requireModerator
  }, communityController.deleteReplyByModerator.bind(communityController));
}
