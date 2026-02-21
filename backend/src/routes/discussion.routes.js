/**
 * src/routes/discussion.routes.js
 * 
 * Routes for film comments and nested discussion threads.
 */

import { discussionController } from '../controllers/index.js';
import { authenticate, requireModerator } from '../middlewares/index.js';

/**
 * Register discussion routes
 * @param {import('fastify').FastifyInstance} fastify - Fastify instance
 */
export default async function discussionRoutes(fastify) {
  // Public: List all comments for a film (paged/nested)
  fastify.get('/film/:filmId', discussionController.getByFilm.bind(discussionController));

  // Public: Get comment count for a film
  fastify.get('/film/:filmId/count', discussionController.getCommentCount.bind(discussionController));

  // Admin/Moderator: Flat list of all comments for moderation
  fastify.get('/all', {
    preHandler: requireModerator
  }, discussionController.getAllFlat.bind(discussionController));

  // User: Post a new comment or reply
  fastify.post('/film/:filmId', {
    preHandler: authenticate
  }, discussionController.create.bind(discussionController));

  // User: Edit own comment content
  fastify.put('/:id', {
    preHandler: authenticate
  }, discussionController.update.bind(discussionController));

  // User/Admin/Moderator: Delete a comment
  fastify.delete('/:id', {
    preHandler: authenticate
  }, discussionController.delete.bind(discussionController));
}
